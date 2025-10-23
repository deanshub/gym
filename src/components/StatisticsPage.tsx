import type {
	Exercise,
	ExercisePerformance,
	Program,
	Workout,
} from "@prisma/client";
import { format, formatDuration, intervalToDuration } from "date-fns";
import useSWR from "swr";
import { formatMuscleGroup, getWeightTypeIcon } from "../lib/utils";
import { WorkoutDurationChart } from "./WorkoutDurationChart";

type PerformanceWithRelations = ExercisePerformance & {
	exercise: Exercise;
	workout: Workout & { program: Program };
};

export function StatisticsPage() {
	const { data: performances = [] } = useSWR<PerformanceWithRelations[]>(
		"/api/exercise-performances",
	);

	// Group performances by muscle group, then by program, then by exercise
	const performancesByMuscleGroup = performances.reduce(
		(acc, performance) => {
			const muscleGroup = performance.exercise.group;
			const programName = performance.workout.program.name;
			const exerciseName = performance.exercise.name;

			if (!acc[muscleGroup]) {
				acc[muscleGroup] = {};
			}
			if (!acc[muscleGroup][programName]) {
				acc[muscleGroup][programName] = {};
			}
			if (!acc[muscleGroup][programName][exerciseName]) {
				acc[muscleGroup][programName][exerciseName] = [];
			}
			acc[muscleGroup][programName][exerciseName].push(performance);
			return acc;
		},
		{} as Record<
			string,
			Record<string, Record<string, PerformanceWithRelations[]>>
		>,
	);

	return (
		<div className="flex-1 p-4">
			{performances.length === 0 ? (
				<p className="text-gray-600">
					No workout data yet. Complete some workouts to see statistics!
				</p>
			) : (
				<div className="space-y-6">
					{Object.entries(performancesByMuscleGroup).map(
						([muscleGroup, programs]) => (
							<div key={muscleGroup} className="border rounded-lg p-4">
								<h3 className="text-lg font-semibold mb-4">
									{formatMuscleGroup(muscleGroup)}
								</h3>
								<div className="space-y-4">
									{Object.entries(programs).map(
										([programName, exerciseGroups]) => (
											<div
												key={programName}
												className="border-l-4 border-blue-200 pl-4"
											>
												<h4 className="text-md font-medium mb-3 text-blue-700">
													{programName}
												</h4>
												<div className="space-y-3">
													{Object.entries(exerciseGroups).map(
														([exerciseName, exercisePerformances]) => (
															<div
																key={exerciseName}
																className="bg-gray-50 rounded p-3"
															>
																<h5 className="font-medium mb-3">
																	{exerciseName}
																</h5>
																<div className="space-y-2">
																	{exercisePerformances.map((performance) => (
																		<div
																			key={performance.id}
																			className="p-2 rounded text-sm bg-secondary/50"
																		>
																			<div className="flex justify-between items-center">
																				<div className="flex gap-4">
																					<span className="text-center">
																						{performance.sets} sets
																					</span>
																					<span className="text-center">
																						{performance.reps} reps
																					</span>
																					<span className="text-center flex flex-col items-center">
																						{getWeightTypeIcon(
																							performance.exercise.weightType,
																							12,
																						)}
																						{performance.weight}kg
																					</span>
																					<span className="text-center text-gray-600">
																						{formatDuration(
																							intervalToDuration({
																								start: new Date(
																									performance.startTime,
																								),
																								end: new Date(
																									performance.endTime,
																								),
																							}),
																							{
																								format: ["minutes", "seconds"],
																							},
																						)}
																					</span>
																				</div>
																				<div className="text-gray-500">
																					{format(
																						new Date(performance.startTime),
																						"MMM d",
																					)}
																				</div>
																			</div>
																		</div>
																	))}
																</div>
															</div>
														),
													)}
												</div>
											</div>
										),
									)}
								</div>
							</div>
						),
					)}
				</div>
			)}

			<div className="mt-8">
				<WorkoutDurationChart />
			</div>
		</div>
	);
}
