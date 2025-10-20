import { serve } from "bun";
import serveStatic from "serve-static-bun";
import { authRoutes } from "./api/auth";
import { exercisePerformancesRoutes } from "./api/exercise-performances";
import helloRoutes from "./api/hello";
import { programsRoutes } from "./api/programs";
import { progressPhotosRoutes } from "./api/progress-photos";
import { weightLogsRoutes } from "./api/weight-logs";
import { workoutsRoutes } from "./api/workouts";
import index from "./index.html";

const apiRoutes = Object.fromEntries(
	Object.entries({
		...helloRoutes,
		...authRoutes,
		...programsRoutes,
		...workoutsRoutes,
		...exercisePerformancesRoutes,
		...weightLogsRoutes,
		...progressPhotosRoutes,
	}).map(([key, value]) => [`/api${key}`, value]),
);

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		...apiRoutes,
		"/public/*": serveStatic("public", {
			stripFromPathname: "/public",
		}),
		"/*": index,
	},

	development: process.env.NODE_ENV !== "production" && {
		// Enable browser hot reloading in development
		hmr: true,

		// Echo console logs from the browser to the server
		console: true,
	},
});

console.log(`🚀 Server running at ${server.url}`);
