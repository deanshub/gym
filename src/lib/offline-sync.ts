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
import type { MutationMethod, QueuedMutation, SyncState } from "../types";
import {
	dequeueMutation,
	enqueueMutation,
	queueCount,
	readQueue,
} from "./offline-db";

// Backoff bounds for the online-but-stuck retry timer.
const RETRY_BASE_MS = 30_000;
const RETRY_MAX_MS = 5 * 60_000;

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
	pending: 0,
};

const listeners = new Set<() => void>();

function emit(next: Partial<SyncState>) {
	const merged = { ...state, ...next };
	if (merged.online === state.online && merged.pending === state.pending) {
		return;
	}
	state = merged;
	for (const cb of listeners) cb();
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
		...(body !== undefined
			? { headers: JSON_HEADERS, body: JSON.stringify(body) }
			: {}),
	};

	if (!isBrowser || navigator.onLine) {
		try {
			const res = await fetch(url, init);
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
		}
	}

	const mutation: QueuedMutation = { url, method, body, createdAt: Date.now() };
	await enqueueMutation(mutation);
	await refreshPending();
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
	let flushedAny = false;
	try {
		const items = await readQueue();
		for (const item of items) {
			if (item.key === undefined) continue;
			try {
				const res = await fetch(item.url, {
					method: item.method,
					credentials: "same-origin",
					...(item.body !== undefined
						? { headers: JSON_HEADERS, body: JSON.stringify(item.body) }
						: {}),
				});
				if (shouldDropAfterReplay(res.status)) {
					await dequeueMutation(item.key);
					flushedAny = true;
				} else {
					break; // transient server error — retry on the next flush
				}
			} catch {
				break; // network dropped mid-flush — retry later
			}
		}
	} finally {
		flushing = false;
		const pending = await queueCount();
		emit({ pending });
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
