import { serve } from "bun";
import serveStatic from "serve-static-bun";
import { authRoutes } from "./api/auth";
import { exercisePerformancesRoutes } from "./api/exercise-performances";
import helloRoutes from "./api/hello";
import { programsRoutes } from "./api/programs";
import { progressPhotosRoutes } from "./api/progress-photos";
import { remindersRoutes } from "./api/reminders";
import { weightLogsRoutes } from "./api/weight-logs";
import { workoutsRoutes } from "./api/workouts";
import index from "./index.html";
import "./lib/scheduler"; // Start the reminder scheduler

const apiRoutes = Object.fromEntries(
	Object.entries({
		...helloRoutes,
		...authRoutes,
		...programsRoutes,
		...workoutsRoutes,
		...exercisePerformancesRoutes,
		...weightLogsRoutes,
		...progressPhotosRoutes,
		...remindersRoutes,
	}).map(([key, value]) => [`/api${key}`, value]),
);

const server = serve({
	routes: {
		// Serve index.html for all unmatched routes.
		...apiRoutes,
		// Serve the service worker at the root so it can control the whole origin
		// (a worker's scope cannot be broader than its own URL path).
		"/sw.js": () =>
			new Response(Bun.file("public/sw.js"), {
				headers: {
					"Content-Type": "text/javascript",
					"Service-Worker-Allowed": "/",
					"Cache-Control": "no-cache",
				},
			}),
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

	// A thrown value from any route handler lands here. Auth/validation guards
	// (e.g. `getCurrentUserId`) `throw new Response(..., { status: 401 })` to
	// short-circuit — but Bun does NOT auto-return a thrown Response, so without
	// this handler it collapses to a generic 500 (plus the 66KB dev HTML page).
	// That matters for offline sync: `shouldDropAfterReplay` retries a 5xx
	// forever but drops a 4xx, so a mis-reported 401→500 turns a re-login-needed
	// request into a poison item that jams the whole FIFO queue. Return thrown
	// Responses verbatim; collapse everything else to a clean JSON 500.
	error(error) {
		if (error instanceof Response) return error;
		console.error("[server] unhandled route error:", error);
		return Response.json({ error: "Internal server error" }, { status: 500 });
	},
});

console.log(`🚀 Server running at ${server.url}`);
