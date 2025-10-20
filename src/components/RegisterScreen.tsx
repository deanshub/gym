import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface RegisterScreenProps {
	onRegister: (user: {
		id: string;
		email: string;
		name: string | null;
	}) => void;
}

export function RegisterScreen({ onRegister }: RegisterScreenProps) {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [name, setName] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState("");

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			setIsLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/register", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password, confirmPassword, name }),
			});

			const data = await response.json();

			if (!response.ok) {
				setError(data.error || "Registration failed");
				return;
			}

			onRegister(data.user);
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
					<p className="mt-2 text-gray-600">Create your account</p>
				</div>

				<form className="space-y-6" onSubmit={handleRegister}>
					{error && (
						<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
							{error}
						</div>
					)}

					<div>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-700"
						>
							Name
						</label>
						<Input
							id="name"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							className="mt-1 bg-white"
							placeholder="Enter your name"
						/>
					</div>

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

					<div>
						<label
							htmlFor="confirmPassword"
							className="block text-sm font-medium text-gray-700"
						>
							Confirm Password
						</label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							className="mt-1 bg-white"
							placeholder="Confirm your password"
						/>
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading ? "Creating account..." : "Create account"}
					</Button>
				</form>

				<div className="text-center">
					<p className="text-sm text-gray-600">
						Already have an account?{" "}
						<Link to="/login" className="text-blue-600 hover:text-blue-500">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</div>
	);
}
