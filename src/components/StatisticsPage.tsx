import { Download } from "lucide-react";
import useSWR from "swr";
import { ExercisePerformanceChart } from "./ExercisePerformanceChart";
import { StrengthRadarChart } from "./StrengthRadarChart";
import { Button } from "./ui/button";
import { WorkoutDurationChart } from "./WorkoutDurationChart";

interface WeightEntry {
	id: string;
	weight: number;
	createdAt: string;
}

interface ExercisePerformance {
	id: string;
	exerciseId: string;
	workoutId: string;
	sets: number;
	reps: number;
	weight: number;
	startTime: string;
	endTime: string;
	exercise: {
		name: string;
		group: string;
	};
	workout: {
		program: {
			name: string;
		};
	};
}

interface Exercise {
	id: string;
	name: string;
	sets: number;
	reps: number;
	weight: number;
	group: string;
	weightType: string;
	programId: string;
}

interface Program {
	id: string;
	name: string;
	createdAt: string;
}

export function StatisticsPage() {
	const { data: weightEntries = [] } =
		useSWR<WeightEntry[]>("/api/weight-logs");
	const { data: exercisePerformances = [] } = useSWR<ExercisePerformance[]>(
		"/api/exercise-performances",
	);
	const { data: programs = [] } = useSWR<Program[]>("/api/programs");

	const exportPrograms = async () => {
		const csvData = [
			[
				"Program",
				"Exercise",
				"Muscle Group",
				"Sets",
				"Reps",
				"Weight (kg)",
				"Weight Type",
				"Created Date",
			],
		];

		for (const program of programs) {
			try {
				const response = await fetch(`/api/programs/${program.id}/exercises`);
				const exercises = await response.json();

				exercises.forEach((exercise: Exercise) => {
					csvData.push([
						program.name,
						exercise.name,
						exercise.group,
						exercise.sets.toString(),
						exercise.reps.toString(),
						exercise.weight.toString(),
						exercise.weightType,
						program.createdAt.split("T")[0],
					]);
				});
			} catch (error) {
				console.error(
					`Failed to fetch exercises for program ${program.id}:`,
					error,
				);
			}
		}

		downloadCSV(csvData, "programs");
	};

	const exportPerformances = () => {
		const csvData = [
			[
				"Date",
				"Program",
				"Exercise",
				"Muscle Group",
				"Sets",
				"Reps",
				"Weight (kg)",
				"Duration (min)",
			],
		];

		exercisePerformances.forEach((perf) => {
			const duration = Math.round(
				(new Date(perf.endTime).getTime() -
					new Date(perf.startTime).getTime()) /
					60000,
			);
			const date = new Date(perf.startTime).toISOString().split("T")[0];

			csvData.push([
				date,
				perf.workout.program.name,
				perf.exercise.name,
				perf.exercise.group,
				perf.sets.toString(),
				perf.reps.toString(),
				perf.weight.toString(),
				duration.toString(),
			]);
		});

		downloadCSV(csvData, "performances");
	};

	const exportWeight = () => {
		const csvData = [["Date", "Weight (kg)"]];

		weightEntries.forEach((entry) => {
			csvData.push([entry.createdAt.split("T")[0], entry.weight.toString()]);
		});

		downloadCSV(csvData, "weight");
	};

	const downloadCSV = (csvData: (string | number)[][], type: string) => {
		const csvString = csvData
			.map((row) => row.map((field) => `"${field}"`).join(","))
			.join("\n");

		const blob = new Blob([csvString], { type: "text/csv" });
		const url = window.URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = `gym-${type}-${new Date().toISOString().split("T")[0]}.csv`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		window.URL.revokeObjectURL(url);
	};

	return (
		<div className="flex-1 p-4 pt-0">
			<div className="py-4">
				<h1 className="text-2xl font-bold">Statistics</h1>
			</div>

			<div className="flex gap-2 pb-4">
				<Button onClick={exportPrograms} variant="outline" size="sm">
					<Download className="mr-2 h-4 w-4" />
					Programs
				</Button>
				<Button onClick={exportPerformances} variant="outline" size="sm">
					<Download className="mr-2 h-4 w-4" />
					Performances
				</Button>
				<Button onClick={exportWeight} variant="outline" size="sm">
					<Download className="mr-2 h-4 w-4" />
					Weight
				</Button>
			</div>

			<div className="space-y-4">
				<StrengthRadarChart />
				<ExercisePerformanceChart />
				<WorkoutDurationChart />
			</div>
		</div>
	);
}
