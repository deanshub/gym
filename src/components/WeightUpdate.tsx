import { format } from "date-fns";
import { TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import {
	CartesianGrid,
	LabelList,
	Line,
	LineChart,
	XAxis,
	YAxis,
} from "recharts";
import useSWR, { mutate } from "swr";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "./ui/card";
import type { ChartConfig } from "./ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";
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
	const previousWeight = weightLogs[1];

	// Calculate weight change
	const weightChange =
		latestWeight && previousWeight
			? latestWeight.weight - previousWeight.weight
			: 0;

	// Prepare chart data
	const chartData = weightLogs
		.slice(0, 8)
		.reverse()
		.map((log) => ({
			date: format(new Date(log.createdAt), "MMM d"),
			weight: log.weight,
		}));

	const chartConfig: ChartConfig = {
		weight: {
			label: "Weight (kg)",
			color: "var(--chart-1)",
		},
	};

	return (
		<div className="space-y-6">
			<div>
				{latestWeight && (
					<Card className="@container/card mb-4">
						<CardHeader>
							<CardDescription>Current Weight</CardDescription>
							<CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
								{latestWeight.weight} kg
							</CardTitle>
							{previousWeight && (
								<CardAction>
									<Badge variant="outline">
										{weightChange > 0 ? (
											<TrendingUp className="size-3" />
										) : (
											<TrendingDown className="size-3" />
										)}
										{weightChange >= 0 ? "+" : ""}
										{weightChange.toFixed(1)} kg
									</Badge>
								</CardAction>
							)}
						</CardHeader>
						<CardFooter className="flex-col items-start gap-1.5 text-sm">
							<div className="line-clamp-1 flex gap-2 font-medium">
								{weightChange > 0
									? "Weight increased"
									: weightChange < 0
										? "Weight decreased"
										: "Weight unchanged"}
								{weightChange > 0 ? (
									<TrendingUp className="size-4" />
								) : (
									<TrendingDown className="size-4" />
								)}
							</div>
							<div className="text-muted-foreground">
								Last updated:{" "}
								{new Date(latestWeight.createdAt).toLocaleDateString()}
							</div>
						</CardFooter>
					</Card>
				)}

				<form onSubmit={handleSubmit} className="flex gap-2">
					<Input
						type="number"
						step="0.1"
						placeholder="Weight (kg)"
						value={weight}
						onChange={(e) => setWeight(e.target.value)}
						className="flex-1 bg-white"
					/>
					<Button type="submit" disabled={isSubmitting || !weight.trim()}>
						{isSubmitting ? "Saving..." : "Save"}
					</Button>
				</form>
			</div>

			{weightLogs.length > 0 && (
				<>
					<Card>
						<CardHeader>
							<CardTitle>Weight Progress</CardTitle>
							<CardDescription>Your weight tracking over time</CardDescription>
						</CardHeader>
						<CardContent>
							<ChartContainer config={chartConfig}>
								<LineChart
									accessibilityLayer
									data={chartData}
									margin={{
										top: 20,
										left: 12,
										right: 12,
									}}
								>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="date"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis tickLine={false} axisLine={false} tickMargin={8} />
									<ChartTooltip
										cursor={false}
										content={<ChartTooltipContent indicator="line" />}
									/>
									<Line
										dataKey="weight"
										type="natural"
										stroke="var(--color-weight)"
										strokeWidth={2}
										dot={{
											fill: "var(--color-weight)",
										}}
										activeDot={{
											r: 6,
										}}
									>
										<LabelList
											position="top"
											offset={12}
											className="fill-foreground"
											fontSize={12}
										/>
									</Line>
								</LineChart>
							</ChartContainer>
						</CardContent>
					</Card>

					<div>
						<h4 className="font-medium mb-3">Recent Weight History</h4>
						<div className="space-y-2">
							{weightLogs.slice(0, 5).map((log) => (
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
				</>
			)}
		</div>
	);
}
