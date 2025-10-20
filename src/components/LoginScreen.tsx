import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface LoginScreenProps {
	onLogin: (user: { id: string; email: string; name: string | null }) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		try {
			const response = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Login failed");
				return;
			}

			onLogin(data.user);
		} catch (_err) {
			setError("Network error. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen min-w-screen flex items-center justify-center bg-gray-50 relative">
			<div
				className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
				style={{ backgroundImage: "url(/public/logo.png)" }}
			/>
			<div className="max-w-md w-full space-y-8 p-8 relative z-10">
				<div className="text-center">
					<h2 className="text-3xl font-bold text-gray-900">Gym Tracker</h2>
					<p className="mt-2 text-gray-600">Sign in to your account</p>
				</div>

				<form className="space-y-6" onSubmit={handleLogin}>
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
							{error}
						</div>
					)}

					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700"
						>
							Email
						</label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="mt-1 bg-white"
							placeholder="Enter your email"
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700"
						>
							Password
						</label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="mt-1 bg-white"
							placeholder="Enter your password"
						/>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Signing in..." : "Sign in"}
					</Button>
				</form>

				<div className="text-center">
					<p className="text-sm text-gray-600">
						Don't have an account?{" "}
						<Link to="/register" className="text-blue-600 hover:text-blue-500">
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
