import type { Exercise } from "@prisma/client";
import { Trash2 } from "lucide-react";
import { Suspense } from "react";
import useSWR from "swr";
import { formatMuscleGroup } from "../lib/utils";
import { Button } from "./ui/button";

interface ProgramExercisesProps {
	programId: string;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
}

function ExercisesList({ programId, onDeleteExercise }: ProgramExercisesProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${programId}/exercises`,
	);

	if (exercises.length === 0) {
		return <p className="text-gray-500">No exercises added</p>;
	}

	// Group exercises by muscle group
	const exercisesByMuscleGroup = exercises.reduce(
		(acc, exercise) => {
			const muscleGroup = exercise.group;
			if (!acc[muscleGroup]) {
				acc[muscleGroup] = [];
			}
			acc[muscleGroup].push(exercise);
			return acc;
		},
		{} as Record<string, Exercise[]>,
	);

	return (
		<div className="space-y-4">
			{Object.entries(exercisesByMuscleGroup).map(
				([muscleGroup, groupExercises]) => (
					<div key={muscleGroup} className="border-l-4 border-blue-200 pl-4">
						<h4 className="text-sm font-medium mb-2 text-blue-700">
							{formatMuscleGroup(muscleGroup)}
						</h4>
						<div className="space-y-2">
							{groupExercises.map((exercise) => (
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
					</div>
				),
			)}
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
