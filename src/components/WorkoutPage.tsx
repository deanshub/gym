import { CheckCircle, Play, Square } from "lucide-react";
import { useState } from "react";
import useSWR from "swr";
import type { Exercise, Program } from "../types/program";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface WorkoutSession {
	programId: string;
	currentExerciseIndex: number;
	startTime: Date;
	exerciseStartTime: Date | null;
	completedExercises: Array<{
		exerciseId: string;
		startTime: Date;
		endTime: Date;
	}>;
}

export function WorkoutPage() {
	const { data: programs = [] } = useSWR<Program[]>("/api/programs");
	const [session, setSession] = useState<WorkoutSession | null>(null);
	const [currentProgram, setCurrentProgram] = useState<Program | null>(null);

	const { data: exercises = [] } = useSWR<Exercise[]>(
		session ? `/api/programs/${session.programId}` : null,
	);

	const startWorkout = (program: Program) => {
		const now = new Date();
		setCurrentProgram(program);
		setSession({
			programId: program.id,
			currentExerciseIndex: 0,
			startTime: now,
			exerciseStartTime: now,
			completedExercises: [],
		});
	};

	const completeExercise = () => {
		if (!session || !exercises.length) return;

		const now = new Date();
		const currentExercise = exercises[session.currentExerciseIndex];

		const updatedSession = {
			...session,
			completedExercises: [
				...session.completedExercises,
				{
					exerciseId: currentExercise.id,
					startTime: session.exerciseStartTime || now,
					endTime: now,
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
			// Workout complete
			setSession(null);
			setCurrentProgram(null);
		}
	};

	const stopWorkout = () => {
		setSession(null);
		setCurrentProgram(null);
	};

	if (!session) {
		return (
			<div className="flex-1 p-4">
				<h2 className="text-xl font-bold mb-4">Start Workout</h2>
				<div className="grid gap-4">
					{programs.map((program) => (
						<Card key={program.id}>
							<CardHeader>
								<CardTitle>{program.name}</CardTitle>
							</CardHeader>
							<CardContent>
								<Button
									onClick={() => startWorkout(program)}
									className="w-full"
								>
									<Play size={16} />
									Start Workout
								</Button>
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		);
	}

	if (!exercises.length) {
		return (
			<div className="flex-1 p-4">
				<p>Loading exercises...</p>
			</div>
		);
	}

	const currentExercise = exercises[session.currentExerciseIndex];
	const progress =
		((session.currentExerciseIndex + 1) / exercises.length) * 100;

	return (
		<div className="flex-1 p-4">
			<div className="flex justify-between items-center mb-4">
				<h2 className="text-xl font-bold">{currentProgram?.name}</h2>
				<Button variant="outline" onClick={stopWorkout}>
					<Square size={16} />
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
							<div className="text-2xl font-bold">{currentExercise.sets}</div>
							<div className="text-sm text-gray-600">Sets</div>
						</div>
						<div>
							<div className="text-2xl font-bold">{currentExercise.reps}</div>
							<div className="text-sm text-gray-600">Reps</div>
						</div>
						<div>
							<div className="text-2xl font-bold">
								{currentExercise.weight}kg
							</div>
							<div className="text-sm text-gray-600">Weight</div>
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
							{session.completedExercises.map((completed) => {
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
										key={completed.exerciseId}
										className="flex justify-between items-center p-2 bg-gray-50 rounded"
									>
										<span>{exercise?.name}</span>
										<span className="text-sm text-gray-600">{duration}s</span>
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
