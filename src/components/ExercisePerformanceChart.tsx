import type {
	Exercise,
	ExercisePerformance,
	Program,
	Workout,
} from "@prisma/client";
import { format } from "date-fns";
import {
	CartesianGrid,
	LabelList,
	Line,
	LineChart,
	XAxis,
	YAxis,
} from "recharts";
import useSWR from "swr";
import { formatMuscleGroup } from "../lib/utils";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import type { ChartConfig } from "./ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

type PerformanceWithRelations = ExercisePerformance & {
	exercise: Exercise;
	workout: Workout & { program: Program };
};

export function ExercisePerformanceChart() {
	const { data: performances = [] } = useSWR<PerformanceWithRelations[]>(
		"/api/exercise-performances",
	);

	if (performances.length === 0) {
		return null;
	}

	// Group by muscle group
	const performancesByMuscleGroup = performances.reduce(
		(acc, performance) => {
			const muscleGroup = performance.exercise.group;
			if (!acc[muscleGroup]) {
				acc[muscleGroup] = [];
			}
			acc[muscleGroup].push(performance);
			return acc;
		},
		{} as Record<string, PerformanceWithRelations[]>,
	);

	return (
		<div className="space-y-8">
			{Object.entries(performancesByMuscleGroup).map(
				([muscleGroup, groupPerformances]) => {
					// Group by exercise and create time series data
					const exerciseData = groupPerformances.reduce(
						(acc, performance) => {
							const exerciseName = performance.exercise.name;
							if (!acc[exerciseName]) {
								acc[exerciseName] = [];
							}
							acc[exerciseName].push(performance);
							return acc;
						},
						{} as Record<string, PerformanceWithRelations[]>,
					);

					// Create chart data with dates as x-axis
					const allDates = Array.from(
						new Set(
							groupPerformances.map((p) =>
								format(new Date(p.startTime), "MMM d"),
							),
						),
					).sort(
						(a, b) =>
							new Date(
								groupPerformances.find(
									(p) => format(new Date(p.startTime), "MMM d") === a,
								)?.startTime || 0,
							).getTime() -
							new Date(
								groupPerformances.find(
									(p) => format(new Date(p.startTime), "MMM d") === b,
								)?.startTime || 0,
							).getTime(),
					);

					const chartData = allDates.map((date) => {
						const dataPoint: Record<string, string | number> = { date };

						groupPerformances
							.filter((p) => format(new Date(p.startTime), "MMM d") === date)
							.forEach((p) => {
								dataPoint[p.exercise.name] = p.weight;
							});

						return dataPoint;
					});

					const exercises = Object.keys(exerciseData);
					const chartConfig: ChartConfig = exercises.reduce(
						(config, exercise, index) => {
							config[exercise] = {
								label: exercise,
								color: `hsl(var(--chart-${(index % 5) + 1}))`,
							};
							return config;
						},
						{} as ChartConfig,
					);

					return (
						<Card key={muscleGroup}>
							<CardHeader>
								<CardTitle>{formatMuscleGroup(muscleGroup)}</CardTitle>
								<CardDescription>
									Exercise performance over time
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ChartContainer config={chartConfig}>
									<LineChart
										accessibilityLayer
										data={chartData}
										margin={{
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
											content={<ChartTooltipContent />}
										/>
										{exercises.map((exercise, index) => {
											const colors = [
												"var(--chart-1)",
												"var(--chart-2)",
												"var(--chart-3)",
												"var(--chart-4)",
												"var(--chart-5)",
												"#8884d8",
												"#82ca9d",
												"#ffc658",
												"#ff7300",
												"#00ff00",
											];
											const color = colors[index % 5];

											return (
												<Line
													key={exercise}
													dataKey={exercise}
													type="natural"
													stroke={color}
													strokeWidth={2}
													dot={{
														fill: color,
													}}
													activeDot={{
														r: 6,
													}}
													connectNulls={false}
												>
													<LabelList
														position="top"
														offset={12}
														className="fill-foreground"
														fontSize={12}
													/>
												</Line>
											);
										})}
									</LineChart>
								</ChartContainer>
							</CardContent>
						</Card>
					);
				},
			)}
		</div>
	);
}
