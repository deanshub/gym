import { useEffect, useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ActiveWorkoutPage } from "./ActiveWorkoutPage";
import { LoginScreen } from "./LoginScreen";
import { Navigation } from "./Navigation";
import { ProgramsPage } from "./ProgramsPage";
import { RegisterScreen } from "./RegisterScreen";
import { StatisticsPage } from "./StatisticsPage";
import { ToolsPage } from "./ToolsPage";
import { WorkoutPage } from "./WorkoutPage";

interface User {
	id: string;
	email: string;
	name: string | null;
}

export function Router() {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	// Load user from localStorage on startup
	useEffect(() => {
		const savedUser = localStorage.getItem("gym-user");
		if (savedUser) {
			try {
				const userData = JSON.parse(savedUser);
				setUser(userData);
			} catch {
				localStorage.removeItem("gym-user");
			}
		}
		setIsLoading(false);
	}, []);

	const handleLogin = (userData: User) => {
		setUser(userData);
		localStorage.setItem("gym-user", JSON.stringify(userData));
	};

	const handleLogout = async () => {
		try {
			await fetch("/api/logout", { method: "POST" });
		} catch (error) {
			console.error("Logout error:", error);
		} finally {
			setUser(null);
			localStorage.removeItem("gym-user");
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-lg">Loading...</div>
			</div>
		);
	}

	if (!user) {
		return (
			<BrowserRouter>
				<Routes>
					<Route
						path="/register"
						element={<RegisterScreen onRegister={handleLogin} />}
					/>
					<Route path="*" element={<LoginScreen onLogin={handleLogin} />} />
				</Routes>
			</BrowserRouter>
		);
	}

	return (
		<BrowserRouter>
			<div className="min-h-screen min-w-screen bg-gray-50 flex flex-col">
				<Navigation user={user} onLogout={handleLogout} />
				<Routes>
					<Route index path="/" element={<WorkoutPage />} />
					<Route path="/workout/:programId" element={<ActiveWorkoutPage />} />
					<Route path="/programs" element={<ProgramsPage />} />
					<Route path="/statistics" element={<StatisticsPage />} />
					<Route path="/tools" element={<ToolsPage />} />
				</Routes>
			</div>
		</BrowserRouter>
	);
}
