import { Play } from "lucide-react";
import useSWR from "swr";
import type { Exercise, ProgramCardProps } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function ProgramCard({ program }: ProgramCardProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${program.id}/exercises`,
	);
	const hasExercises = exercises.length > 0;

	const startWorkout = () => {
		window.location.href = `/workout/${program.id}`;
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{program.name}</CardTitle>
			</CardHeader>
			<CardContent>
				<Button
					onClick={startWorkout}
					className="w-full"
					disabled={!hasExercises}
				>
					<Play size={16} />
					{hasExercises ? "Start Workout" : "No Exercises"}
				</Button>
			</CardContent>
		</Card>
	);
}
