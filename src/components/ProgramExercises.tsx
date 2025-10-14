import { Trash2 } from "lucide-react";
import { Suspense } from "react";
import useSWR from "swr";
import type { Exercise, ProgramExercisesProps } from "../types";
import { Button } from "./ui/button";

function ExercisesList({ programId, onDeleteExercise }: ProgramExercisesProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${programId}`,
	);

	if (exercises.length === 0) {
		return <p className="text-gray-500">No exercises added</p>;
	}

	return (
		<div className="space-y-2">
			{exercises.map((exercise) => (
				<div
					key={exercise.id}
					className="flex justify-between items-center p-2 bg-gray-50 rounded"
				>
					<span>{exercise.name}</span>
					<div className="flex gap-4 text-sm text-gray-600">
						<span>{exercise.sets} sets</span>
						<span>{exercise.reps} reps</span>
						<span>{exercise.weight}kg</span>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => onDeleteExercise(programId, exercise.id)}
						>
							<Trash2 size={12} />
						</Button>
					</div>
				</div>
			))}
		</div>
	);
}

export function ProgramExercises({
	programId,
	onDeleteExercise,
}: ProgramExercisesProps) {
	return (
		<Suspense fallback={<p className="text-gray-400">Loading exercises...</p>}>
			<ExercisesList
				programId={programId}
				onDeleteExercise={onDeleteExercise}
			/>
		</Suspense>
	);
}
