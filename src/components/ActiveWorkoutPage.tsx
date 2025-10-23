import type { Exercise, Program } from "@prisma/client";
import {
	CheckCircle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Edit,
	TimerOff,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { formatMuscleGroup, getWeightTypeIcon } from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { WorkoutCompleted } from "./WorkoutCompleted";

interface WorkoutSession {
	workoutId: string;
	currentExerciseIndex: number;
	startTime: Date;
	exerciseStartTime: Date | null;
	completedExercises: Array<{
		exerciseId: string;
		performanceId: string;
		startTime: Date;
		endTime: Date;
		sets: number;
		reps: number;
		weight: number;
	}>;
	workoutCompleted?: boolean;
	workoutEndTime?: Date;
}

export function ActiveWorkoutPage() {
	const { programId } = useParams<{ programId: string }>();
	const { data: program } = useSWR<Program>(`/api/programs/${programId}`);
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${programId}/exercises`,
	);

	const [session, setSession] = useState<WorkoutSession>(() => {
		const now = new Date();
		return {
			workoutId: Date.now().toString(),
			currentExerciseIndex: 0,
			startTime: now,
			exerciseStartTime: now,
			completedExercises: [],
		};
	});

	const [elapsedTime, setElapsedTime] = useState(0);

	// Timer effect
	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedTime(
				Math.floor((Date.now() - session.startTime.getTime()) / 1000),
			);
		}, 1000);
		return () => clearInterval(interval);
	}, [session.startTime]);

	const [exerciseValues, setExerciseValues] = useState<
		Record<string, { sets: number; reps: number; weight: number }>
	>({});

	// Create workout session on component mount
	useEffect(() => {
		if (programId) {
			fetch("/api/workouts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					id: session.workoutId,
					programId,
					startTime: session.startTime.toISOString(),
				}),
			})
				.then((res) => res.json())
				.then((workout) => {
					// Update session with actual workout ID from database
					setSession((prev) => ({ ...prev, workoutId: workout.id }));
				});
		}
	}, [programId, session.workoutId, session.startTime]);

	// Initialize exercise values when exercises load
	useEffect(() => {
		if (exercises.length > 0) {
			const initialValues: Record<
				string,
				{ sets: number; reps: number; weight: number }
			> = {};
			exercises.forEach((exercise) => {
				initialValues[exercise.id] = {
					sets: exercise.sets,
					reps: exercise.reps,
					weight: exercise.weight,
				};
			});
			setExerciseValues(initialValues);
		}
	}, [exercises]);

	const updateValue = (field: "sets" | "reps" | "weight", delta: number) => {
		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		setExerciseValues((prev) => ({
			...prev,
			[currentExercise.id]: {
				...prev[currentExercise.id],
				[field]: Math.max(0, (prev[currentExercise.id]?.[field] || 0) + delta),
			},
		}));
	};

	const goToPreviousExercise = () => {
		if (session.currentExerciseIndex > 0) {
			setSession((prev) => ({
				...prev,
				currentExerciseIndex: prev.currentExerciseIndex - 1,
			}));
		}
	};

	const goToNextExercise = () => {
		if (session.currentExerciseIndex < exercises.length - 1) {
			setSession((prev) => ({
				...prev,
				currentExerciseIndex: prev.currentExerciseIndex + 1,
			}));
		}
	};

	const goToExercise = (index: number) => {
		if (index >= 0 && index < exercises.length) {
			setSession((prev) => ({
				...prev,
				currentExerciseIndex: index,
			}));
		}
	};

	const updateExercise = async () => {
		if (!exercises.length) return;

		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		const completed = session.completedExercises.find(
			(c) => c.exerciseId === currentExercise.id,
		);
		if (!completed) return;

		const updatedPerformance = {
			sets: exerciseValues[currentExercise.id]?.sets || currentExercise.sets,
			reps: exerciseValues[currentExercise.id]?.reps || currentExercise.reps,
			weight:
				exerciseValues[currentExercise.id]?.weight || currentExercise.weight,
		};

		try {
			const response = await fetch(
				`/api/exercise-performances/${completed.performanceId}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						workoutId: session.workoutId,
						...updatedPerformance,
					}),
				},
			);

			if (!response.ok) {
				const error = await response.text();
				console.error("Failed to update exercise performance:", error);
				alert(`Failed to update exercise performance: ${error}`);
				return;
			}

			// Update local state
			setSession((prev) => ({
				...prev,
				completedExercises: prev.completedExercises.map((c) =>
					c.exerciseId === currentExercise.id
						? { ...c, ...updatedPerformance }
						: c,
				),
			}));

			// Move to next exercise
			if (session.currentExerciseIndex < exercises.length - 1) {
				setSession((prev) => ({
					...prev,
					currentExerciseIndex: prev.currentExerciseIndex + 1,
				}));
			}
		} catch (error) {
			console.error("Error updating exercise:", error);
			alert("Failed to update exercise");
		}
	};

	const completeExercise = async () => {
		if (!exercises.length) return;

		const now = new Date();
		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		const performance = {
			exerciseId: currentExercise.id,
			startTime: session.exerciseStartTime || now,
			endTime: now,
			sets: exerciseValues[currentExercise.id]?.sets || currentExercise.sets,
			reps: exerciseValues[currentExercise.id]?.reps || currentExercise.reps,
			weight:
				exerciseValues[currentExercise.id]?.weight || currentExercise.weight,
		};

		// Save exercise performance
		const response = await fetch("/api/exercise-performances", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				id: Date.now().toString(),
				workoutId: session.workoutId,
				...performance,
				startTime: performance.startTime.toISOString(),
				endTime: performance.endTime.toISOString(),
			}),
		});

		if (!response.ok) {
			const error = await response.text();
			console.error("Failed to save exercise performance:", error);
			alert(`Failed to save exercise performance: ${error}`);
			return;
		}

		const savedPerformance = await response.json();

		const updatedSession = {
			...session,
			completedExercises: [
				...session.completedExercises,
				{
					...performance,
					performanceId: savedPerformance.id,
				},
			],
		};

		if (session.currentExerciseIndex < exercises.length - 1) {
			setSession({
				...updatedSession,
				currentExerciseIndex: session.currentExerciseIndex + 1,
				exerciseStartTime: now,
			});
		} else {
			// Workout complete - update workout end time
			const response = await fetch(`/api/workouts/${session.workoutId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					endTime: now.toISOString(),
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				console.error("Failed to complete workout:", error);
				alert(`Failed to complete workout: ${error}`);
				return;
			}

			// Set workout as completed
			setSession({
				...updatedSession,
				workoutCompleted: true,
				workoutEndTime: now,
			});
		}
	};

	const stopWorkout = async () => {
		// Update workout end time
		await fetch(`/api/workouts/${session.workoutId}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				endTime: new Date().toISOString(),
			}),
		});
		window.location.href = "/";
	};

	if (!program || !exercises.length) {
		return (
			<div className="flex-1 p-4">
				<p>Loading workout...</p>
			</div>
		);
	}

	const currentExercise = exercises[session.currentExerciseIndex];
	if (!currentExercise) return null;

	const progress =
		((session.currentExerciseIndex + 1) / exercises.length) * 100;

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex-1 p-4">
			{session.workoutCompleted ? (
				<WorkoutCompleted
					program={program}
					startTime={session.startTime}
					endTime={session.workoutEndTime || new Date()}
					completedExercises={session.completedExercises}
				/>
			) : (
				<>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-bold">{program.name}</h2>
						<div className="text-lg font-mono">{formatTime(elapsedTime)}</div>
						<Button variant="outline" onClick={stopWorkout}>
							<TimerOff />
							Stop Workout
						</Button>
					</div>

					<div className="mb-4">
						<div className="flex justify-between text-sm text-gray-600 mb-1">
							<span>
								Exercise {session.currentExerciseIndex + 1} of{" "}
								{exercises.length}
							</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full transition-all"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					<div className="flex gap-2 mb-4">
						<Button
							variant="outline"
							onClick={goToPreviousExercise}
							disabled={session.currentExerciseIndex === 0}
							className="flex-1 h-11"
						>
							<ChevronLeft size={16} />
							Previous
						</Button>
						<Button
							variant="outline"
							onClick={goToNextExercise}
							disabled={session.currentExerciseIndex === exercises.length - 1}
							className="flex-1 h-11"
						>
							Next
							<ChevronRight size={16} />
						</Button>
					</div>

					<Card className="mb-6">
						<CardHeader>
							<CardTitle className="text-2xl">{currentExercise.name}</CardTitle>
							<div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
								{getWeightTypeIcon(currentExercise.weightType, 14)}
								<span>{formatMuscleGroup(currentExercise.group)}</span>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-4 text-center mb-6">
								<div>
									<div className="flex flex-col items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("sets", 1)}
											className="h-12 w-full p-0"
										>
											<ChevronUp className="!w-8 !h-8" strokeWidth={2} />
										</Button>
										<div className="text-2xl font-bold">
											{exerciseValues[currentExercise.id]?.sets ||
												currentExercise.sets}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("sets", -1)}
											className="h-12 w-full p-0"
										>
											<ChevronDown className="!w-8 !h-8" strokeWidth={2} />
										</Button>
									</div>
									<div className="text-sm text-gray-600 mt-2">Sets</div>
								</div>
								<div>
									<div className="flex flex-col items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("reps", 1)}
											className="h-12 w-full p-0"
										>
											<ChevronUp className="!w-8 !h-8" strokeWidth={2} />
										</Button>
										<div className="text-2xl font-bold">
											{exerciseValues[currentExercise.id]?.reps ||
												currentExercise.reps}
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("reps", -1)}
											className="h-12 w-full p-0"
										>
											<ChevronDown className="!w-8 !h-8" strokeWidth={2} />
										</Button>
									</div>
									<div className="text-sm text-gray-600 mt-2">Reps</div>
								</div>
								<div>
									<div className="flex flex-col items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("weight", 1)}
											className="h-12 w-full p-0"
										>
											<ChevronUp className="!w-8 !h-8" strokeWidth={2} />
										</Button>
										<div className="text-2xl font-bold">
											{exerciseValues[currentExercise.id]?.weight ||
												currentExercise.weight}
											<small className="text-sm font-normal">kg</small>
										</div>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("weight", -1)}
											className="h-12 w-full p-0"
										>
											<ChevronDown className="!w-8 !h-8" strokeWidth={2} />
										</Button>
									</div>
									<div className="text-sm text-gray-600 mt-2">Weight</div>
								</div>
							</div>
							{(() => {
								const isCompleted = session.completedExercises.some(
									(c) => c.exerciseId === currentExercise.id,
								);
								const isLastExercise =
									session.currentExerciseIndex === exercises.length - 1;

								return isCompleted ? (
									<Button onClick={updateExercise} className="w-full" size="lg">
										<Edit size={20} />
										Update Exercise
									</Button>
								) : (
									<Button
										onClick={completeExercise}
										className="w-full"
										size="lg"
									>
										<CheckCircle size={20} />
										{isLastExercise ? "Complete Workout" : "Complete Exercise"}
									</Button>
								);
							})()}
						</CardContent>
					</Card>

					{/* Exercise Timeline */}
					<Card className="mb-4">
						<CardHeader>
							<CardTitle className="text-lg">Progress</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{exercises.map((exercise, index) => {
									const isCompleted = session.completedExercises.some(
										(c) => c.exerciseId === exercise.id,
									);
									const isCurrent = index === session.currentExerciseIndex;
									const isPassed = index < session.currentExerciseIndex;

									if (isCompleted) {
										const completed = session.completedExercises.find(
											(c) => c.exerciseId === exercise.id,
										);
										const duration = completed
											? Math.round(
													(completed.endTime.getTime() -
														completed.startTime.getTime()) /
														1000,
												)
											: 0;
										return (
											<div
												key={`completed-${exercise.id}`}
												className="flex items-center gap-3"
											>
												<div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
												<div
													className="flex-1 p-2 bg-green-50 rounded border-l-2 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
													onClick={() => goToExercise(index)}
													onKeyDown={(e) =>
														e.key === "Enter" && goToExercise(index)
													}
													role="button"
													tabIndex={0}
												>
													<div className="font-medium text-green-800">
														{exercise.name}
													</div>
													<div className="text-xs text-green-600">
														{formatMuscleGroup(exercise.group)} •{" "}
														{completed?.sets}×{completed?.reps} @{" "}
														{completed?.weight}kg • {duration}s
													</div>
												</div>
											</div>
										);
									}

									if (isCurrent) {
										return (
											<div
												key={`current-${exercise.id}`}
												className="flex items-center gap-3"
											>
												<div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
												<div
													className="flex-1 p-3 bg-blue-50 rounded border-l-4 border-blue-500 cursor-pointer hover:bg-blue-100 transition-colors"
													onClick={() => goToExercise(index)}
													onKeyDown={(e) =>
														e.key === "Enter" && goToExercise(index)
													}
													role="button"
													tabIndex={0}
												>
													<div className="font-bold text-blue-800">
														{exercise.name}
													</div>
													<div className="text-sm text-blue-600">
														{formatMuscleGroup(exercise.group)} • Current
														Exercise
													</div>
												</div>
											</div>
										);
									}

									if (isPassed) {
										return (
											<div
												key={`passed-${exercise.id}`}
												className="flex items-center gap-3"
											>
												<div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
												<div
													className="flex-1 p-2 bg-yellow-50 rounded border-l-2 border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
													onClick={() => goToExercise(index)}
													onKeyDown={(e) =>
														e.key === "Enter" && goToExercise(index)
													}
													role="button"
													tabIndex={0}
												>
													<div className="font-medium text-yellow-800">
														{exercise.name}
													</div>
													<div className="text-xs text-yellow-600">
														{formatMuscleGroup(exercise.group)} • Skipped
													</div>
												</div>
											</div>
										);
									}

									return (
										<div
											key={`next-${exercise.id}`}
											className="flex items-center gap-3"
										>
											<div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></div>
											<div
												className="flex-1 p-2 bg-gray-50 rounded border-l-2 border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
												onClick={() => goToExercise(index)}
												onKeyDown={(e) =>
													e.key === "Enter" && goToExercise(index)
												}
												role="button"
												tabIndex={0}
											>
												<div className="font-medium text-gray-700">
													{exercise.name}
												</div>
												<div className="text-xs text-gray-500">
													{formatMuscleGroup(exercise.group)} • {exercise.sets}×
													{exercise.reps} @ {exercise.weight}kg
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
