// Service worker: app-shell caching so the PWA boots offline, plus the existing
// push-notification handlers. Data reads are served from the app's IndexedDB
// SWR cache (not here), and writes are queued by the app-layer sync engine, so
// this worker only needs to cache the shell (HTML/JS/CSS/assets).
//
// Strategy:
//   - navigations        -> network-first, fall back to the cached app shell
//   - same-origin GET     -> stale-while-revalidate (hashed JS/CSS/img)
//   - /api/*              -> pass through to the network (SWR cache handles reads)
//   - non-GET             -> pass through (offline writes are queued by the app)

const CACHE_VERSION = "v1";
const CACHE_NAME = `gym-shell-${CACHE_VERSION}`;
const APP_SHELL = "/";

// When the device has a network but the server is unreachable, `fetch` doesn't
// fail fast — it hangs until a TCP/HTTP timeout (tens of seconds). Racing it
// against these deadlines lets us fall back to the cached shell/asset quickly so
// an unreachable server behaves like being offline instead of freezing on boot.
const NAV_TIMEOUT_MS = 3000;
const ASSET_TIMEOUT_MS = 5000;

/** `fetch`, but aborted (rejects) if it doesn't respond within `timeoutMs`. */
function fetchWithTimeout(request, timeoutMs) {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	return fetch(request, { signal: controller.signal }).finally(() =>
		clearTimeout(timer),
	);
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.add(APP_SHELL)),
	);
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		(async () => {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter((key) => key.startsWith("gym-shell-") && key !== CACHE_NAME)
					.map((key) => caches.delete(key)),
			);
			await self.clients.claim();
		})(),
	);
});

self.addEventListener("fetch", (event) => {
	const { request } = event;

	// Only GET requests are cacheable; let everything else hit the network so
	// offline writes fail fast and the app queues them.
	if (request.method !== "GET") return;

	const url = new URL(request.url);

	// Different origin (e.g. analytics, fonts) — don't intercept.
	if (url.origin !== self.location.origin) return;

	// API reads go straight to the network; the app's SWR IndexedDB cache is the
	// offline read layer, not the service worker.
	if (url.pathname.startsWith("/api/")) return;

	// Navigations: network-first with a timeout, falling back to the cached shell
	// when offline OR when the server doesn't respond in time (unreachable server).
	if (request.mode === "navigate") {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE_NAME);
				try {
					const response = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
					// Only treat a real 2xx/3xx as a usable shell; cache & serve it.
					if (response.ok) {
						cache.put(APP_SHELL, response.clone());
						return response;
					}
					throw new Error(`HTTP ${response.status}`);
				} catch {
					const cached =
						(await cache.match(request)) || (await cache.match(APP_SHELL));
					if (cached) return cached;
					return new Response("Offline", {
						status: 503,
						statusText: "Offline",
					});
				}
			})(),
		);
		return;
	}

	// Static assets: stale-while-revalidate.
	event.respondWith(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			const cached = await cache.match(request);
			const network = fetchWithTimeout(request, ASSET_TIMEOUT_MS)
				.then((response) => {
					if (response.ok) cache.put(request, response.clone());
					return response;
				})
				.catch(() => undefined);
			return cached || (await network) || Response.error();
		})(),
	);
});

self.addEventListener("push", (event) => {
	const options = {
		body: event.data ? event.data.text() : "Time for your workout!",
		icon: "/logo-96697w9z.png",
		badge: "/logo-96697w9z.png",
		vibrate: [100, 50, 100],
		data: {
			dateOfArrival: Date.now(),
			primaryKey: 1,
		},
		actions: [
			{
				action: "explore",
				title: "Start Workout",
				icon: "/logo-96697w9z.png",
			},
			{
				action: "close",
				title: "Close notification",
				icon: "/logo-96697w9z.png",
			},
		],
	};

	event.waitUntil(
		self.registration.showNotification("Gym Workout Reminder", options),
	);
});

self.addEventListener("notificationclick", (event) => {
	event.notification.close();

	if (event.action === "explore") {
		event.waitUntil(clients.openWindow("/"));
	}
});
