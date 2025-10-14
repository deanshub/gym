import { serve } from "bun";
import helloRoutes from "./api/hello";
import { programsRoutes } from "./api/programs";
import index from "./index.html";

const apiRoutes = Object.fromEntries(
	Object.entries({ ...helloRoutes, ...programsRoutes }).map(([key, value]) => [
		`/api${key}`,
		value,
	]),
);

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		"/*": index,
		...apiRoutes,
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
