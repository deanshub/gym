/**
 * App-layer offline sync engine.
 *
 * Writes go through `apiMutate`: when the device is offline (or a request fails
 * with a network error) the mutation is persisted to IndexedDB and replayed,
 * FIFO, once connectivity returns. We deliberately do NOT use the Service
 * Worker Background Sync API because iOS Safari does not support it — replay is
 * driven here by `online`/`visibilitychange` events instead.
 *
 * Conflict policy is last-write-wins by `updatedAt`: queued local writes flush
 * first, then every SWR key is revalidated to pull the authoritative server
 * state.
 *
 * Flushes are event-driven (`online`/`visibilitychange`), but a flush that stays
 * blocked while the device still reports online (e.g. a 5xx loop or captive
 * portal) would otherwise never retry, so a self-cancelling exponential-backoff
 * timer re-attempts until the queue drains.
 */

import { mutate as globalMutate } from "swr";
import type {
	MutationMethod,
	QueuedMutation,
	SyncLogEntry,
	SyncState,
} from "../types";
import {
	dequeueMutation,
	enqueueMutation,
	queueCount,
	readQueue,
} from "./offline-db";

// Backoff bounds for the online-but-stuck retry timer.
const RETRY_BASE_MS = 30_000;
const RETRY_MAX_MS = 5 * 60_000;

// `navigator.onLine` is true even when the server is unreachable, and `fetch`
// then hangs until a TCP timeout. Bounding each request lets a request to a dead
// server fail fast so the mutation is queued (and flushes retried) like offline.
const REQUEST_TIMEOUT_MS = 5000;

/**
 * Next backoff delay: double the current one, capped at the max. A `current`
 * below the base snaps up to the base so the first retry always waits ~30s.
 */
export function nextRetryDelay(current: number): number {
	const doubled = Math.max(current, RETRY_BASE_MS) * 2;
	return Math.min(doubled, RETRY_MAX_MS);
}

/**
 * Generate a stable, client-side id matching the server's historical shape
 * (`${prefix}_${timestamp}_${random}`). Client-generated ids are what make
 * offline creates — and idempotent replays — possible.
 */
export function newId(prefix: string): string {
	return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * After replaying a queued mutation, decide whether to drop it. A 2xx means it
 * applied; a 4xx means it can never succeed (e.g. deleting something already
 * gone) so we drop it to avoid an infinite retry loop. A 5xx / network error is
 * transient — keep it and stop the flush so it retries later.
 */
export function shouldDropAfterReplay(status: number): boolean {
	return status < 500;
}

// --- Sync state (subscribable for the UI) ---------------------------------

const isBrowser = typeof window !== "undefined";

let state: SyncState = {
	online: isBrowser ? navigator.onLine : true,
	// Assume reachable until a request proves otherwise, so the UI stays quiet on
	// a healthy boot.
	serverReachable: true,
	pending: 0,
	syncing: false,
	lastSyncAt: null,
	log: [],
};

// Cap the log so a long-running session (or a retry loop) can't grow it without
// bound; the UI only ever shows the tail anyway.
const MAX_LOG = 50;

const listeners = new Set<() => void>();

function emit(next: Partial<SyncState>) {
	const merged = { ...state, ...next };
	if (
		merged.online === state.online &&
		merged.serverReachable === state.serverReachable &&
		merged.pending === state.pending &&
		merged.syncing === state.syncing &&
		merged.lastSyncAt === state.lastSyncAt &&
		merged.log === state.log
	) {
		return;
	}
	state = merged;
	for (const cb of listeners) cb();
}

/**
 * Append a line to the sync log (new array so `emit` notifies) and, for errors,
 * mirror it to the console. This is the visibility that turns a silent, forever
 * "Syncing…" into something the user can actually diagnose.
 */
function pushLog(level: SyncLogEntry["level"], message: string) {
	const entry: SyncLogEntry = { time: Date.now(), level, message };
	if (level === "error") console.error("[sync]", message);
	emit({ log: [...state.log, entry].slice(-MAX_LOG) });
}

/** Human label for a queued mutation in the log: just method + path (no query). */
function describeMutation(item: QueuedMutation): string {
	return `${item.method} ${item.url.split("?")[0]}`;
}

/**
 * Record that the server responded (reachable) or that a request failed with a
 * network error/timeout while the device is online (unreachable). Any HTTP
 * status counts as reachable — a 4xx/5xx still means the server answered.
 */
export function reportServerReachable(): void {
	const recovered = !state.serverReachable;
	emit({ serverReachable: true });
	// On the unreachable→reachable transition, drain the queue immediately rather
	// than waiting out the backoff. This is what recovers a queue that built up
	// while the app stayed online with the server down — the event-driven flush
	// triggers (`online`/visibility) never fired because connectivity never
	// changed. flushQueue is hoisted, and its own `flushing` guard makes any
	// re-entry from a replay success a no-op.
	if (recovered && isBrowser && navigator.onLine) {
		void flushQueue();
	}
}

export function reportServerUnreachable(): void {
	emit({ serverReachable: false });
}

export function subscribeSync(cb: () => void): () => void {
	listeners.add(cb);
	return () => listeners.delete(cb);
}

export function getSyncState(): SyncState {
	return state;
}

async function refreshPending() {
	emit({ pending: await queueCount() });
}

// --- Mutations ------------------------------------------------------------

const JSON_HEADERS = { "Content-Type": "application/json" };

interface MutateOptions {
	method: MutationMethod;
	body?: unknown;
}

/**
 * Send a mutating request, queueing it for later if the network is unavailable.
 *
 * @returns the server's JSON response when online, or the request `body` echoed
 * back as an optimistic result when the request was queued. Real HTTP client
 * errors (4xx) are thrown so callers can surface them.
 */
export async function apiMutate<T = unknown>(
	url: string,
	{ method, body }: MutateOptions,
): Promise<T> {
	const init: RequestInit = {
		method,
		credentials: "same-origin",
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
		...(body !== undefined
			? { headers: JSON_HEADERS, body: JSON.stringify(body) }
			: {}),
	};

	if (!isBrowser || navigator.onLine) {
		try {
			const res = await fetch(url, init);
			// The server answered (any status) — it's reachable.
			reportServerReachable();
			if (res.ok) {
				return res.status === 204
					? (undefined as T)
					: ((await res.json()) as T);
			}
			// Client error: not recoverable by retrying — surface it.
			if (res.status >= 400 && res.status < 500) {
				throw new Error(`HTTP ${res.status}`);
			}
			// 5xx falls through to the queue for a later retry.
		} catch (err) {
			// A thrown Error above (4xx) must propagate; only a genuine network
			// failure (TypeError from fetch) should be queued.
			if (err instanceof Error && err.message.startsWith("HTTP ")) {
				throw err;
			}
			// Reached the catch without an HTTP response: network error or timeout.
			reportServerUnreachable();
		}
	}

	const mutation: QueuedMutation = { url, method, body, createdAt: Date.now() };
	await enqueueMutation(mutation);
	pushLog("info", `Queued ${describeMutation(mutation)}`);
	await refreshPending();
	// Kick a flush (non-blocking) so the backoff-retry chain gets armed. Without
	// this, a write queued while the app stays online (server unreachable) would
	// never retry — the chain is only started from inside flushQueue, which
	// otherwise runs solely on online/visibility events or startup. If the server
	// is still down the flush fails fast and schedules the retry; if it recovered,
	// it drains now.
	if (isBrowser && navigator.onLine) void flushQueue();
	// Optimistic result: the body already carries the client-generated id.
	return body as T;
}

// --- Flush ----------------------------------------------------------------

let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryDelay = RETRY_BASE_MS;

/** Cancel any pending retry and reset the backoff to its base delay. */
function clearRetry() {
	if (retryTimer) {
		clearTimeout(retryTimer);
		retryTimer = null;
	}
	retryDelay = RETRY_BASE_MS;
}

/**
 * Arm a single backoff retry if none is pending. Used when a flush leaves work
 * queued while still online, so a stuck flush eventually self-heals without
 * waiting for an `online`/visibility event.
 */
function scheduleRetry() {
	if (retryTimer) return; // one in flight already — don't stack or reset it
	retryTimer = setTimeout(() => {
		retryTimer = null;
		void flushQueue();
	}, retryDelay);
	retryDelay = nextRetryDelay(retryDelay);
}

/**
 * The app configures a custom SWR cache `provider`, so the top-level `mutate`
 * imported from "swr" (bound to SWR's default cache) can't reach the mounted
 * hooks. `SyncBridge` registers the provider-scoped `mutate` here; until then we
 * fall back to the global one.
 */
let boundMutate: typeof globalMutate = globalMutate;

export function setSyncMutate(fn: typeof globalMutate): void {
	boundMutate = fn;
}

/** Revalidate every SWR key so the UI reflects the latest server state. */
async function revalidateAll() {
	await boundMutate(() => true, undefined, { revalidate: true });
}

/**
 * Replay queued mutations in FIFO order. Stops at the first transient failure
 * (5xx / offline) and leaves the remainder queued. After draining, revalidates
 * all SWR data. Safe to call repeatedly; concurrent calls are ignored.
 */
export async function flushQueue(): Promise<void> {
	if (flushing || (isBrowser && !navigator.onLine)) return;
	flushing = true;
	emit({ syncing: true });
	let flushedAny = false;
	try {
		const items = await readQueue();
		if (items.length > 0) {
			pushLog(
				"info",
				`Syncing ${items.length} change${items.length === 1 ? "" : "s"}…`,
			);
		}
		for (const item of items) {
			if (item.key === undefined) continue;
			const label = describeMutation(item);
			try {
				const res = await fetch(item.url, {
					method: item.method,
					credentials: "same-origin",
					signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
					...(item.body !== undefined
						? { headers: JSON_HEADERS, body: JSON.stringify(item.body) }
						: {}),
				});
				reportServerReachable();
				if (shouldDropAfterReplay(res.status)) {
					await dequeueMutation(item.key);
					flushedAny = true;
					if (res.ok) {
						pushLog("success", `${label} ✓`);
					} else {
						// A 4xx can never succeed on retry, so we drop it — but that
						// silently discards a user's change, so it must be surfaced.
						pushLog(
							"error",
							`${label} → HTTP ${res.status}; discarded (won't retry)`,
						);
					}
				} else {
					// 5xx: the server answered but failed. Keep the item and stop; this
					// is the head-of-line block behind an endless "Syncing…".
					pushLog("error", `${label} → HTTP ${res.status}; will retry`);
					break;
				}
			} catch {
				reportServerUnreachable();
				pushLog("error", `${label} failed — server unreachable; will retry`);
				break; // network dropped mid-flush — retry later
			}
		}
	} finally {
		flushing = false;
		const pending = await queueCount();
		const drained = pending === 0;
		emit({
			pending,
			syncing: false,
			...(drained && flushedAny ? { lastSyncAt: Date.now() } : {}),
		});
		if (drained && flushedAny) {
			pushLog("success", "All changes synced");
		}
		if (flushedAny) {
			await revalidateAll();
		}
		// Still online with work left behind → a transient failure blocked us, so
		// retry on a backoff. Otherwise (drained, or offline) reset the backoff and
		// let the online/visibility events drive the next attempt.
		if (isBrowser && navigator.onLine && pending > 0) {
			scheduleRetry();
		} else {
			clearRetry();
		}
	}
}

/**
 * User-initiated sync. Resets any pending backoff so it runs now (not in up to
 * 5 minutes), flushes the queue, and — even when the queue is already empty —
 * revalidates all SWR data so the button doubles as a manual "refresh". All
 * outcomes land in the log.
 */
export async function syncNow(): Promise<void> {
	if (!isBrowser) return;
	if (!navigator.onLine) {
		pushLog("error", "Can't sync — this device is offline");
		return;
	}
	clearRetry();
	pushLog("info", "Manual sync started");
	const hadQueue = (await queueCount()) > 0;
	await flushQueue();
	// flushQueue only revalidates when it flushed something; with an empty queue
	// (or a fully-drained one) still pull fresh server state so the manual button
	// always refreshes the UI.
	if (!hadQueue && navigator.onLine) {
		emit({ syncing: true });
		try {
			await revalidateAll();
			emit({ lastSyncAt: Date.now() });
			pushLog("success", "Up to date");
		} catch {
			pushLog("error", "Refresh failed — server unreachable");
		} finally {
			emit({ syncing: false });
		}
	}
}

// --- Lifecycle ------------------------------------------------------------

let initialized = false;

/** Wire up online/visibility listeners and do an initial flush. Idempotent. */
export function initSync(): void {
	if (!isBrowser || initialized) return;
	initialized = true;

	window.addEventListener("online", () => {
		emit({ online: true });
		clearRetry(); // reconnect is a fresh start — reset the backoff
		void flushQueue();
	});
	window.addEventListener("offline", () => {
		emit({ online: false });
		clearRetry(); // no point retrying while offline; `online` will re-trigger
	});
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "visible" && navigator.onLine) {
			void flushQueue();
		}
	});

	void refreshPending();
	if (navigator.onLine) void flushQueue();
}
