import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { ErrorFallback } from "./components/ErrorFallback";
import { Router } from "./components/Router";
import { Toaster } from "./components/ui/sonner";
import { SWRProvider } from "./lib/swr-config";
import "./index.css";

export function App() {
	return (
		<SWRProvider>
			<ErrorBoundary FallbackComponent={ErrorFallback}>
				<Suspense fallback={<div>Loading...</div>}>
					<Router />
				</Suspense>
			</ErrorBoundary>
			<Toaster />
		</SWRProvider>
	);
}

export default App;
