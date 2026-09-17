/**
 * IndexedDB persistence for offline-first support.
 *
 * Two stores live in one database:
 *  - `swr-cache`   — the last-seen data for each SWR request key, so reads work
 *                    offline and survive reloads.
 *  - `mutation-queue` — writes that could not reach the server, replayed FIFO
 *                    (by auto-increment key) once the connection returns.
 *
 * Uses the tiny `idb` wrapper rather than raw IndexedDB boilerplate.
 */

import type { DBSchema, IDBPDatabase } from "idb";
import { openDB } from "idb";
import type { CacheEntry, QueuedMutation } from "../types";

const DB_NAME = "gym-offline";
const DB_VERSION = 1;
const CACHE_STORE = "swr-cache";
const QUEUE_STORE = "mutation-queue";

interface GymDB extends DBSchema {
	[CACHE_STORE]: {
		key: string;
		value: { data: unknown };
	};
	[QUEUE_STORE]: {
		key: number;
		value: QueuedMutation;
	};
}

let dbPromise: Promise<IDBPDatabase<GymDB>> | null = null;

function getDB(): Promise<IDBPDatabase<GymDB>> {
	if (!dbPromise) {
		dbPromise = openDB<GymDB>(DB_NAME, DB_VERSION, {
			upgrade(db) {
				if (!db.objectStoreNames.contains(CACHE_STORE)) {
					db.createObjectStore(CACHE_STORE);
				}
				if (!db.objectStoreNames.contains(QUEUE_STORE)) {
					db.createObjectStore(QUEUE_STORE, {
						keyPath: "key",
						autoIncrement: true,
					});
				}
			},
		});
	}
	return dbPromise;
}

// --- SWR cache ------------------------------------------------------------

/** Load all persisted cache entries as `[key, { data }]` tuples. */
export async function loadCacheEntries(): Promise<CacheEntry[]> {
	const db = await getDB();
	const keys = await db.getAllKeys(CACHE_STORE);
	const values = await db.getAll(CACHE_STORE);
	return keys.map((key, i) => [key, values[i] ?? { data: undefined }]);
}

/** Replace the persisted cache with the given snapshot. */
export async function saveCacheEntries(entries: CacheEntry[]): Promise<void> {
	const db = await getDB();
	const tx = db.transaction(CACHE_STORE, "readwrite");
	await tx.store.clear();
	for (const [key, value] of entries) {
		await tx.store.put(value, key);
	}
	await tx.done;
}

// --- Mutation queue -------------------------------------------------------

/** Append a mutation to the FIFO queue. Returns its assigned key. */
export async function enqueueMutation(
	mutation: QueuedMutation,
): Promise<number> {
	const db = await getDB();
	return db.add(QUEUE_STORE, mutation);
}

/** Read the whole queue in FIFO (ascending key) order. */
export async function readQueue(): Promise<QueuedMutation[]> {
	const db = await getDB();
	return db.getAll(QUEUE_STORE);
}

/** Remove a mutation from the queue by its key. */
export async function dequeueMutation(key: number): Promise<void> {
	const db = await getDB();
	await db.delete(QUEUE_STORE, key);
}

/** Number of mutations still waiting to be flushed. */
export async function queueCount(): Promise<number> {
	const db = await getDB();
	return db.count(QUEUE_STORE);
}
