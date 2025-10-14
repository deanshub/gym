import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Navigation } from "./Navigation";
import { ProgramsPage } from "./ProgramsPage";
import { StatisticsPage } from "./StatisticsPage";
import { ToolsPage } from "./ToolsPage";
import { WorkoutPage } from "./WorkoutPage";

export function Router() {
	return (
		<BrowserRouter>
			<div className="min-h-screen min-w-screen bg-gray-50 flex flex-col">
				<Navigation />
				<Routes>
					<Route index path="/" element={<WorkoutPage />} />
					<Route path="/programs" element={<ProgramsPage />} />
					<Route path="/statistics" element={<StatisticsPage />} />
					<Route path="/tools" element={<ToolsPage />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}
