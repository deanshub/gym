import type { Exercise, Program } from "@prisma/client";
import { CheckCircle, ChevronDown, ChevronUp, TimerOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

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
		await fetch("/api/exercise-performances", {
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
			await fetch(`/api/workouts/${session.workoutId}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					endTime: now.toISOString(),
				}),
			});
			window.location.href = "/";
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

			{session.completedExercises.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Completed Exercises</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-2">
							{session.completedExercises.map((completed, index) => {
								const exercise = exercises.find(
									(e) => e.id === completed.exerciseId,
								);
								const duration = Math.round(
									(completed.endTime.getTime() -
										completed.startTime.getTime()) /
										1000,
								);
								return (
									<div
										key={`${completed.exerciseId}-${index}`}
										className="flex justify-between items-center p-2 bg-gray-50 rounded"
									>
										<span>{exercise?.name}</span>
										<span className="text-sm text-gray-600">
											{completed.sets}×{completed.reps} @ {completed.weight}kg (
											{duration}s)
										</span>
									</div>
								);
							})}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
