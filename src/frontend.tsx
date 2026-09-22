/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { initSync } from "./lib/offline-sync";
import { hydrateCache } from "./lib/swr-config";

/** Register the app-shell service worker at root scope so it controls the origin. */
function registerServiceWorker() {
	if (!("serviceWorker" in navigator)) return;
	navigator.serviceWorker
		.register("/sw.js")
		.catch((err) => console.error("Service worker registration failed:", err));
}

/**
 * Dev rebuilds the bundle on every change with fresh chunk URLs, but the shell
 * service worker serves the cached shell cache-first — so it quickly points at
 * chunks the dev server no longer produces. That boots stale code, and when the
 * dev server is unreachable a referenced chunk can't load at all, leaving a
 * blank page. The SW is a production/offline concern only: in dev, unregister
 * any SW a previous session left behind and drop its shell caches so the dev
 * server is always talked to directly.
 */
async function unregisterServiceWorker() {
	if (!("serviceWorker" in navigator)) return;
	try {
		const registrations = await navigator.serviceWorker.getRegistrations();
		await Promise.all(registrations.map((r) => r.unregister()));
		if ("caches" in window) {
			const keys = await caches.keys();
			await Promise.all(
				keys
					.filter((key) => key.startsWith("gym-shell-"))
					.map((key) => caches.delete(key)),
			);
		}
	} catch (err) {
		console.error("Service worker cleanup failed:", err);
	}
}

const elem = document.getElementById("root");
if (!elem) throw new Error("Root element not found");
const app = (
	<StrictMode>
		<App />
	</StrictMode>
);

// Hydrate the offline cache before first paint so the app renders with data
// even when there is no network, then start the sync engine and register the SW.
await hydrateCache();
initSync();
// The service worker is a production-only offline shell. In dev (`import.meta.hot`)
// it would serve stale bundles and white-screen when the dev server is down, so
// register it only in production and clean up any dev leftovers otherwise.
if (import.meta.hot) {
	void unregisterServiceWorker();
} else {
	registerServiceWorker();
}

if (import.meta.hot) {
	// With hot module reloading, `import.meta.hot.data` is persisted.
	if (!import.meta.hot.data.root) {
		import.meta.hot.data.root = createRoot(elem);
	}
	const root = import.meta.hot.data.root;
	root.render(app);
} else {
	// The hot module reloading API is not available in production.
	createRoot(elem).render(app);
}
