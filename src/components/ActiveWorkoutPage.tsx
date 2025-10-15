import type { Exercise, Program } from "@prisma/client";
import { CheckCircle, ChevronDown, ChevronUp, TimerOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { formatMuscleGroup } from "../lib/utils";
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

	const [currentExerciseValues, setCurrentExerciseValues] = useState({
		sets: 0,
		reps: 0,
		weight: 0,
	});

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

	// Update current exercise values when exercise changes
	useEffect(() => {
		if (exercises.length > 0) {
			const currentExercise = exercises[session.currentExerciseIndex];
			if (currentExercise) {
				setCurrentExerciseValues({
					sets: currentExercise.sets,
					reps: currentExercise.reps,
					weight: currentExercise.weight,
				});
			}
		}
	}, [exercises, session.currentExerciseIndex]);

	const updateValue = (field: "sets" | "reps" | "weight", delta: number) => {
		setCurrentExerciseValues((prev) => ({
			...prev,
			[field]: Math.max(0, prev[field] + delta),
		}));
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
			sets: currentExerciseValues.sets,
			reps: currentExerciseValues.reps,
			weight: currentExerciseValues.weight,
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

		const updatedSession = {
			...session,
			completedExercises: [...session.completedExercises, performance],
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
					endTime={session.workoutEndTime!}
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
						Exercise {session.currentExerciseIndex + 1} of {exercises.length}
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

			<Card className="mb-6">
				<CardHeader>
					<CardTitle className="text-2xl">{currentExercise.name}</CardTitle>
					<p className="text-sm text-blue-600 font-medium">
						{formatMuscleGroup(currentExercise.group)}
					</p>
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
									{currentExerciseValues.sets}
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
									{currentExerciseValues.reps}
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
									{currentExerciseValues.weight}
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
					<Button onClick={completeExercise} className="w-full" size="lg">
						<CheckCircle size={20} />
						Complete Exercise
					</Button>
				</CardContent>
			</Card>

			{/* Exercise Timeline */}
			<Card className="mb-4">
				<CardHeader>
					<CardTitle className="text-lg">Progress</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{/* Completed exercises */}
						{session.completedExercises.map((completed) => {
							const exercise = exercises.find(
								(e) => e.id === completed.exerciseId,
							);
							const duration = Math.round(
								(completed.endTime.getTime() - completed.startTime.getTime()) /
									1000,
							);
							return (
								<div
									key={`completed-${completed.exerciseId}-${completed.startTime.getTime()}`}
									className="flex items-center gap-3"
								>
									<div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
									<div className="flex-1 p-2 bg-green-50 rounded border-l-2 border-green-200">
										<div className="font-medium text-green-800">
											{exercise?.name}
										</div>
										<div className="text-xs text-green-600">
											{formatMuscleGroup(exercise?.group || "")} •{" "}
											{completed.sets}×{completed.reps} @ {completed.weight}kg •{" "}
											{duration}s
										</div>
									</div>
								</div>
							);
						})}

						{/* Current exercise */}
						<div className="flex items-center gap-3">
							<div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
							<div className="flex-1 p-3 bg-blue-50 rounded border-l-4 border-blue-500">
								<div className="font-bold text-blue-800">
									{currentExercise.name}
								</div>
								<div className="text-sm text-blue-600">
									{formatMuscleGroup(currentExercise.group)} • Current Exercise
								</div>
							</div>
						</div>

						{/* Next exercises */}
						{exercises
							.slice(session.currentExerciseIndex + 1)
							.map((exercise) => (
								<div
									key={`next-${exercise.id}`}
									className="flex items-center gap-3"
								>
									<div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></div>
									<div className="flex-1 p-2 bg-gray-50 rounded border-l-2 border-gray-200">
										<div className="font-medium text-gray-700">
											{exercise.name}
										</div>
										<div className="text-xs text-gray-500">
											{formatMuscleGroup(exercise.group)} • {exercise.sets}×
											{exercise.reps} @ {exercise.weight}kg
										</div>
									</div>
								</div>
							))}
					</div>
				</CardContent>
			</Card>
			</>
			)}
		</div>
	);
}
