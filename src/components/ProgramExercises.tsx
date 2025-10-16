import type { Exercise } from "@prisma/client";
import { Info, Play, Trash2 } from "lucide-react";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { formatMuscleGroup, getWeightTypeIcon } from "../lib/utils";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ProgramExercisesProps {
	programId: string;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
}

function ExercisesList({ programId, onDeleteExercise }: ProgramExercisesProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${programId}/exercises`,
	);
	const [expandedExercise, setExpandedExercise] = useState<string | null>(null);

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

	const toggleExerciseDetails = (exerciseId: string) => {
		setExpandedExercise(expandedExercise === exerciseId ? null : exerciseId);
	};

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
								<Card key={exercise.id} className="overflow-hidden">
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between">
											<CardTitle className="text-base">
												{exercise.name}
											</CardTitle>
											<div className="flex items-center gap-2">
												{exercise.exerciseDbId && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => toggleExerciseDetails(exercise.id)}
													>
														<Info size={14} />
													</Button>
												)}
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														onDeleteExercise(programId, exercise.id)
													}
												>
													<Trash2 size={14} />
												</Button>
											</div>
										</div>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex items-center justify-between">
											<div className="flex gap-4">
												<span className="flex flex-col items-center">
													<div className="text-sm font-semibold">
														{exercise.sets}
													</div>
													<div className="text-xs text-gray-600">sets</div>
												</span>
												<span className="flex flex-col items-center">
													<div className="text-sm font-semibold">
														{exercise.reps}
													</div>
													<div className="text-xs text-gray-600">reps</div>
												</span>
												<span className="flex flex-col items-center">
													<div className="">
														{getWeightTypeIcon(exercise.weightType, 12)}
													</div>
													<div className="text-sm font-semibold">
														{exercise.weight}
														<small className="text-xs text-gray-600">kg</small>
													</div>
												</span>
											</div>
											{exercise.gifUrl && (
												<div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
													<img
														src={exercise.gifUrl}
														alt={exercise.name}
														className="w-full h-full object-cover"
														onError={(e) => {
															e.currentTarget.style.display = "none";
															const sibling = e.currentTarget
																.nextElementSibling as HTMLElement;
															if (sibling) sibling.style.display = "flex";
														}}
													/>
													<div
														className="w-full h-full flex items-center justify-center text-gray-400"
														style={{ display: "none" }}
													>
														<Play size={16} />
													</div>
												</div>
											)}
										</div>

										{expandedExercise === exercise.id &&
											exercise.exerciseDbId && (
												<div className="mt-4 pt-4 border-t space-y-3">
													{exercise.equipment && (
														<div className="flex gap-2">
															<Badge variant="secondary" className="text-xs">
																{exercise.equipment}
															</Badge>
															{exercise.target && (
																<Badge variant="outline" className="text-xs">
																	{exercise.target}
																</Badge>
															)}
														</div>
													)}
													{exercise.instructions && (
														<div>
															<h5 className="text-sm font-medium mb-1">
																Instructions:
															</h5>
															<p className="text-sm text-gray-600 leading-relaxed">
																{exercise.instructions}
															</p>
														</div>
													)}
													{exercise.secondaryMuscles && (
														<div>
															<h5 className="text-sm font-medium mb-1">
																Secondary Muscles:
															</h5>
															<p className="text-sm text-gray-600">
																{JSON.parse(exercise.secondaryMuscles).join(
																	", ",
																)}
															</p>
														</div>
													)}
												</div>
											)}
									</CardContent>
								</Card>
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
