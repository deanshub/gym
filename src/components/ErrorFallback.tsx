import { AlertTriangle, Home, RefreshCw, WifiOff } from "lucide-react";
import type { FallbackProps } from "react-error-boundary";
import { Button } from "./ui/button";

/**
 * Generic error fallback rendered by route-level ErrorBoundaries. Detects the
 * offline case (a common cause now that the app runs offline-first) and shows a
 * tailored message, with retry + go-home escape hatches so the user is never
 * stuck on a blank or frozen screen.
 */
export function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
	const offline = typeof navigator !== "undefined" && !navigator.onLine;
	const message =
		error instanceof Error ? error.message : "An unexpected error occurred.";

	return (
		<div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
			<div className="mx-auto w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
				{offline ? (
					<WifiOff className="h-8 w-8 text-amber-600" />
				) : (
					<AlertTriangle className="h-8 w-8 text-amber-600" />
				)}
			</div>
			<h2 className="text-xl font-semibold text-gray-900 mb-2">
				{offline ? "You're offline" : "Something went wrong"}
			</h2>
			<p className="text-gray-600 max-w-sm mb-6">{message}</p>
			<div className="flex gap-3">
				<Button variant="outline" onClick={resetErrorBoundary}>
					<RefreshCw size={16} />
					Try again
				</Button>
				<Button
					onClick={() => {
						window.location.href = "/";
					}}
				>
					<Home size={16} />
					Go home
				</Button>
			</div>
		</div>
	);
}
