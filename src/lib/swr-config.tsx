import type { ReactNode } from "react";
import { SWRConfig } from "swr";
import type { CacheEntry } from "../types";
import { loadCacheEntries, saveCacheEntries } from "./offline-db";

const fetcher = async (url: string) => {
	const res = await fetch(url);

	// If unauthorized, clear localStorage and reload page. This fires only on an
	// actual HTTP 401 (reachable server), never on an offline network error, so
	// it stays offline-safe.
	if (res.status === 401) {
		localStorage.removeItem("gym-user");
		window.location.reload();
		return;
	}

	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}

	return res.json();
};

/**
 * In-memory SWR cache, seeded from IndexedDB by `hydrateCache()` before render
 * and written back on every change so reads work offline and survive reloads.
 */
const cacheMap = new Map<string, { data: unknown }>();

/**
 * Load persisted SWR entries into the in-memory cache. Must be awaited before
 * the app renders so the first paint has data even with no network.
 */
export async function hydrateCache(): Promise<void> {
	try {
		const entries = await loadCacheEntries();
		for (const [key, value] of entries) {
			cacheMap.set(key, value);
		}
	} catch (err) {
		console.error("Failed to hydrate offline cache:", err);
	}
}

let persistTimer: ReturnType<typeof setTimeout> | null = null;

/** Debounced write-back of the whole cache to IndexedDB. */
function schedulePersist() {
	if (persistTimer) clearTimeout(persistTimer);
	persistTimer = setTimeout(() => {
		persistTimer = null;
		const entries: CacheEntry[] = [];
		for (const [key, value] of cacheMap) {
			// Only persist real request data, not SWR's internal state keys.
			if (value && typeof value === "object" && "data" in value) {
				entries.push([key, { data: value.data }]);
			}
		}
		void saveCacheEntries(entries);
	}, 500);
}

/** SWR cache provider: an observable Map that persists to IndexedDB on change. */
function cacheProvider(): Map<string, { data: unknown }> {
	const originalSet = cacheMap.set.bind(cacheMap);
	cacheMap.set = (key, value) => {
		originalSet(key, value);
		schedulePersist();
		return cacheMap;
	};
	const originalDelete = cacheMap.delete.bind(cacheMap);
	cacheMap.delete = (key) => {
		const result = originalDelete(key);
		schedulePersist();
		return result;
	};
	return cacheMap;
}

export function SWRProvider({ children }: { children: ReactNode }) {
	return (
		<SWRConfig
			value={{
				fetcher,
				provider: cacheProvider,
				revalidateOnReconnect: true,
				onError: (error) => {
					console.error("SWR Error:", error);
				},
				shouldRetryOnError: false,
			}}
		>
			{children}
		</SWRConfig>
	);
}
