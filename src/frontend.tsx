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
registerServiceWorker();

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
