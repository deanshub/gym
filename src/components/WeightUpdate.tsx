import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface WeightLog {
	id: string;
	weight: number;
	createdAt: string;
}

export function WeightUpdate() {
	const [weight, setWeight] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const { data: weightLogs = [] } = useSWR<WeightLog[]>("/api/weight-logs");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!weight.trim()) return;

		setIsSubmitting(true);
		try {
			await fetch("/api/weight-logs", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ weight: parseFloat(weight) }),
			});

			setWeight("");
			mutate("/api/weight-logs");
		} catch (error) {
			console.error("Error saving weight:", error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const latestWeight = weightLogs[0];

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-semibold mb-4">Update Your Weight</h3>

				{latestWeight && (
					<div className="mb-4 p-3 bg-blue-50 rounded-lg">
						<p className="text-sm text-blue-700">
							Current weight:{" "}
							<span className="font-semibold">{latestWeight.weight} kg</span>
						</p>
						<p className="text-xs text-blue-600">
							Last updated:{" "}
							{new Date(latestWeight.createdAt).toLocaleDateString()}
						</p>
					</div>
				)}

				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						type="number"
						step="0.1"
						placeholder="Weight (kg)"
						value={weight}
						onChange={(e) => setWeight(e.target.value)}
						className="flex-1"
					/>
					<Button type="submit" disabled={isSubmitting || !weight.trim()}>
						{isSubmitting ? "Saving..." : "Save"}
					</Button>
				</form>
			</div>

			{weightLogs.length > 0 && (
				<div>
					<h4 className="font-medium mb-3">Weight History</h4>
					<div className="space-y-2 max-h-64 overflow-y-auto">
						{weightLogs.map((log) => (
							<div
								key={log.id}
								className="flex justify-between items-center p-2 bg-gray-50 rounded"
							>
								<span className="font-medium">{log.weight} kg</span>
								<span className="text-sm text-gray-600">
									{new Date(log.createdAt).toLocaleDateString()}
								</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
