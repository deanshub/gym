import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { Router } from "./components/Router";
import { SWRProvider } from "./lib/swr-config";
import "./index.css";

export function App() {
	return (
		<SWRProvider>
			<ErrorBoundary fallback={<div>Something went wrong</div>}>
				<Suspense fallback={<div>Loading...</div>}>
					<Router />
				</Suspense>
			</ErrorBoundary>
		</SWRProvider>
	);
}

export default App;
