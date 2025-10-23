import type {
	Exercise,
	ExercisePerformance,
	Program,
	Workout,
} from "@prisma/client";
import { format, intervalToDuration } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import useSWR from "swr";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "./ui/card";
import type { ChartConfig } from "./ui/chart";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "./ui/chart";

type WorkoutWithRelations = Workout & {
	program: Program;
	exercisePerformances: (ExercisePerformance & { exercise: Exercise })[];
};

export function WorkoutDurationChart() {
	const { data: workouts = [] } =
		useSWR<WorkoutWithRelations[]>("/api/workouts");

	// Prepare chart data for workout durations by program
	const chartData = workouts
		.filter((workout) => workout.endTime) // Only completed workouts
		.map((workout) => {
			const duration = intervalToDuration({
				start: new Date(workout.startTime),
				end: new Date(workout.endTime as Date),
			});
			const durationMinutes =
				(duration.hours || 0) * 60 +
				(duration.minutes || 0) +
				(duration.seconds || 0) / 60;

			return {
				date: format(new Date(workout.startTime), "MMM d"),
				[workout.program.name]: Math.round(durationMinutes),
				programName: workout.program.name,
			};
		})
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

	// Get unique programs for chart config
	const programs = Array.from(new Set(workouts.map((w) => w.program.name)));
	const chartConfig: ChartConfig = programs.reduce((config, program, index) => {
		const colors = [
			"hsl(var(--chart-1))",
			"hsl(var(--chart-2))",
			"hsl(var(--chart-3))",
			"hsl(var(--chart-4))",
			"hsl(var(--chart-5))",
		];
		config[program] = {
			label: program,
			color: colors[index % colors.length],
		};
		return config;
	}, {} as ChartConfig);

	if (workouts.length === 0) {
		return null;
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Workout Duration Trends</CardTitle>
				<CardDescription>
					Duration of workouts over time by program (in minutes)
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig}>
					<AreaChart
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
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						{programs.map((program) => (
							<Area
								key={program}
								dataKey={program}
								type="natural"
								fill={chartConfig[program]?.color}
								fillOpacity={0.4}
								stroke={chartConfig[program]?.color}
								stackId="a"
							/>
						))}
					</AreaChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
