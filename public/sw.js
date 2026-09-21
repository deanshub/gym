// Service worker: app-shell caching so the PWA boots with no network — or when
// the network is up but the server is unreachable — plus the existing push
// handlers. Data reads come from the app's IndexedDB SWR cache (not here) and
// writes are queued by the app-layer sync engine, so this worker only caches the
// shell: the HTML and the hashed JS/CSS it references.
//
// Strategy:
//   - navigations      -> cache-first (instant boot), revalidated in background
//   - same-origin GET   -> stale-while-revalidate (hashed JS/CSS/img)
//   - /api/*            -> pass through to the network (SWR cache handles reads)
//   - non-GET           -> pass through (offline writes are queued by the app)
//
// The shell HTML references content-hashed chunks (chunk-<hash>.js/.css). Caching
// only "/" is not enough: the boot then fetches chunks that may be missing from
// the cache, and against an unreachable server that fetch hangs and the app never
// mounts. So at install we parse the HTML and cache the chunks alongside it.

const CACHE_VERSION = "v3";
const CACHE_NAME = `gym-shell-${CACHE_VERSION}`;
const APP_SHELL = "/";

// A reachable network with an unreachable server makes `fetch` hang until a
// TCP/HTTP timeout (tens of seconds) rather than failing fast. These deadlines
// bound the wait so an unreachable server degrades to the cached shell quickly.
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

/** Pull every same-origin asset URL the shell HTML references (src/href). */
function extractAssetUrls(html) {
	const urls = new Set();
	const re = /(?:src|href)\s*=\s*"([^"]+?)"/gi;
	for (let m = re.exec(html); m; m = re.exec(html)) {
		const raw = m[1];
		if (raw.startsWith("data:") || raw.startsWith("#")) continue;
		try {
			const u = new URL(raw, self.registration.scope);
			// Only same-origin assets are ours to cache.
			if (u.origin === self.location.origin) urls.add(u.href);
		} catch {
			// Ignore anything that isn't a resolvable URL.
		}
	}
	return [...urls];
}

/** True for the render-critical bundle chunks the page cannot display without. */
function isCriticalAsset(url) {
	return /\.(?:js|css)(?:\?|$)/i.test(url);
}

/** True for a web app manifest URL (its icons live inside, not in the HTML). */
function isManifest(url) {
	return /\.webmanifest(?:\?|$)/i.test(url) || /manifest\.json(?:\?|$)/i.test(url);
}

/**
 * Fetch a manifest and return the same-origin icon URLs it references. Icons are
 * declared inside the JSON, so they're invisible to the HTML asset scan; without
 * this the PWA install icon 404s offline. Best-effort — any failure yields none.
 */
async function extractManifestIcons(manifestUrl) {
	try {
		const res = await fetch(manifestUrl, { cache: "reload" });
		if (!res.ok) return [];
		const manifest = await res.json();
		const icons = Array.isArray(manifest.icons) ? manifest.icons : [];
		const urls = [];
		for (const icon of icons) {
			if (!icon || typeof icon.src !== "string") continue;
			try {
				const u = new URL(icon.src, self.registration.scope);
				if (u.origin === self.location.origin) urls.push(u.href);
			} catch {
				// skip unresolvable icon src
			}
		}
		return urls;
	} catch {
		return [];
	}
}

/**
 * Fetch the shell HTML fresh and cache it together with the assets it references.
 *
 * Critical bundle chunks (JS/CSS) are cached FIRST, and the HTML is committed
 * only if they all succeed — so the cached shell can never point at a chunk we
 * don't have. (Committing the HTML first, then chunks, risks a partial precache
 * that boots the app unstyled offline when a chunk fetch fails mid-way.) Content
 * hashes make chunks immutable, so an already-cached one is never re-fetched and
 * this stays cheap to re-run on every launch. Icons/manifest are cached
 * best-effort and never block the shell.
 */
async function precacheShell(cache) {
	const res = await fetch(APP_SHELL, { cache: "reload" });
	if (!res.ok) return;
	const html = await res.text();

	const assets = extractAssetUrls(html);
	const critical = assets.filter(isCriticalAsset);
	const extras = assets.filter((u) => !isCriticalAsset(u));

	// Manifest icons are referenced inside the manifest JSON, not the HTML, so
	// pull them in explicitly and cache them best-effort alongside the extras.
	const manifests = assets.filter(isManifest);
	for (const m of manifests) {
		for (const icon of await extractManifestIcons(m)) {
			if (!extras.includes(icon)) extras.push(icon);
		}
	}

	const cacheOne = async (url) => {
		if (await cache.match(url)) return true;
		try {
			const r = await fetch(url, { cache: "reload" });
			if (r.ok) {
				await cache.put(url, r.clone());
				return true;
			}
		} catch {
			// fall through to false
		}
		return false;
	};

	// All render-critical chunks must cache before we commit the HTML.
	const results = await Promise.all(critical.map(cacheOne));
	if (critical.length > 0 && !results.every(Boolean)) {
		// Leave the last-known-good shell in place rather than commit a broken one.
		return;
	}

	await cache.put(
		APP_SHELL,
		new Response(html, {
			headers: { "Content-Type": "text/html; charset=utf-8" },
		}),
	);

	// Icons, manifest, fonts: nice to have offline, but not worth blocking on.
	await Promise.all(extras.map(cacheOne));
}

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => precacheShell(cache))
			// Never let a transient precache failure block activation; runtime
			// caching will fill the gaps on the next online navigation.
			.catch(() => undefined),
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

	// Navigations: cache-first so the app boots instantly regardless of whether
	// the server is reachable, then refresh the cached shell in the background for
	// the next launch. Falls back to the network only when nothing is cached yet.
	if (request.mode === "navigate") {
		event.respondWith(
			(async () => {
				const cache = await caches.open(CACHE_NAME);
				const cached = await cache.match(APP_SHELL);
				if (cached) {
					// Refresh for next time without blocking this boot; ignore failures
					// (e.g. server unreachable) so we still return the cached shell now.
					event.waitUntil(precacheShell(cache).catch(() => undefined));
					return cached;
				}
				// First ever load and nothing cached — try the network briefly.
				try {
					const response = await fetchWithTimeout(request, NAV_TIMEOUT_MS);
					if (response.ok) {
						await cache.put(APP_SHELL, response.clone());
						return response;
					}
				} catch {
					// fall through to the offline response
				}
				return new Response(
					"<!doctype html><meta charset=utf-8><title>Offline</title>" +
						"<body style=\"font-family:system-ui;padding:2rem\">" +
						"<h1>Can't reach the server</h1>" +
						"<p>Open the app once while connected so it can work offline.</p>",
					{ status: 503, headers: { "Content-Type": "text/html" } },
				);
			})(),
		);
		return;
	}

	// Static assets: stale-while-revalidate. A cached (hashed, immutable) asset is
	// returned instantly, so an unreachable server never blocks the boot.
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
