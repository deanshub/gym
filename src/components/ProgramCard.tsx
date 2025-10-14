import { Play } from "lucide-react";
import useSWR from "swr";
import type { Exercise, Program } from "../types/program";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ProgramWithExercises extends Program {
	exercises: Exercise[];
}

interface ProgramCardProps {
	program: Program;
	onStartWorkout: (program: ProgramWithExercises) => void;
}

export function ProgramCard({ program, onStartWorkout }: ProgramCardProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${program.id}`,
	);
	const hasExercises = exercises.length > 0;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{program.name}</CardTitle>
			</CardHeader>
			<CardContent>
				<Button
					onClick={() => onStartWorkout({ ...program, exercises })}
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
