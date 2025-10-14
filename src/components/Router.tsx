import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navigation } from "./Navigation";

export function Router() {
	return (
		<BrowserRouter>
			<div className="min-h-screen min-w-screen bg-gray-50">
				<Navigation />
				<Routes>
					<Route path="/" element={<div>Workout Page</div>} />
					<Route path="/programs" element={<div>Programs Page</div>} />
					<Route path="/statistics" element={<div>Statistics Page</div>} />
					<Route path="/tools" element={<div>Tools Page</div>} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}
