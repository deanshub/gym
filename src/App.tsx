import "./index.css";
import { SWRProvider } from "./lib/swr-config";

export function App() {
	return (
		<SWRProvider>
			<div className="container mx-auto p-8 text-center relative z-10"></div>
		</SWRProvider>
	);
}

export default App;
