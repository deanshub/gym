import type {
	Exercise,
	ExercisePerformance,
	Program,
	Workout,
} from "@prisma/client";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
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

export function StrengthRadarChart() {
	const { data: performances = [] } = useSWR<PerformanceWithRelations[]>(
		"/api/exercise-performances",
	);

	if (performances.length === 0) {
		return null;
	}

	// Group by muscle group and get the maximum weight for each
	const strengthByMuscleGroup = performances.reduce(
		(acc, performance) => {
			const muscleGroup = formatMuscleGroup(performance.exercise.group);
			const currentMax = acc[muscleGroup] || 0;
			acc[muscleGroup] = Math.max(currentMax, performance.weight);
			return acc;
		},
		{} as Record<string, number>,
	);

	// Convert to radar chart data format
	const radarData = Object.entries(strengthByMuscleGroup).map(
		([muscleGroup, maxWeight]) => ({
			muscleGroup,
			strength: maxWeight,
		}),
	);

	const chartConfig: ChartConfig = {
		strength: {
			label: "Max Weight (kg)",
			color: "var(--chart-1)",
		},
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Overall Strength by Muscle Group</CardTitle>
				<CardDescription>
					Maximum weight achieved for each muscle group
				</CardDescription>
			</CardHeader>
			<CardContent>
				<ChartContainer config={chartConfig} className="mx-auto aspect-square">
					<RadarChart data={radarData}>
						<ChartTooltip cursor={false} content={<ChartTooltipContent />} />
						<PolarAngleAxis dataKey="muscleGroup" />
						<PolarGrid />
						<Radar
							dataKey="strength"
							fill="var(--chart-1)"
							fillOpacity={0.6}
							stroke="var(--chart-1)"
							strokeWidth={2}
						/>
					</RadarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	);
}
