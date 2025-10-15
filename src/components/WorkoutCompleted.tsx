import type { Program } from "@prisma/client";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface WorkoutCompletedProps {
	program: Program;
	startTime: Date;
	endTime: Date;
	completedExercises: Array<{
		exerciseId: string;
		startTime: Date;
		endTime: Date;
		sets: number;
		reps: number;
		weight: number;
	}>;
}

export function WorkoutCompleted({
	program,
	startTime,
	endTime,
	completedExercises,
}: WorkoutCompletedProps) {
	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

	return (
		<div className="text-center space-y-6">
			<div className="text-6xl">🎉</div>
			<h1 className="text-3xl font-bold text-green-600">Congratulations!</h1>
			<p className="text-xl text-gray-700">You completed your workout!</p>

			<Card className="max-w-md mx-auto">
				<CardHeader>
					<CardTitle>Workout Summary</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex justify-between">
						<span>Program:</span>
						<span className="font-medium">{program.name}</span>
					</div>
					<div className="flex justify-between">
						<span>Duration:</span>
						<span className="font-medium">{formatTime(duration)}</span>
					</div>
					<div className="flex justify-between">
						<span>Exercises:</span>
						<span className="font-medium">{completedExercises.length}</span>
					</div>
					<div className="flex justify-between">
						<span>Total Sets:</span>
						<span className="font-medium">
							{completedExercises.reduce((sum, ex) => sum + ex.sets, 0)}
						</span>
					</div>
					<div className="flex justify-between">
						<span>Total Reps:</span>
						<span className="font-medium">
							{completedExercises.reduce(
								(sum, ex) => sum + ex.sets * ex.reps,
								0,
							)}
						</span>
					</div>
				</CardContent>
			</Card>

			<Button
				onClick={() => {
					window.location.href = "/";
				}}
				size="lg"
				className="w-full max-w-md"
			>
				Back to Home
			</Button>
		</div>
	);
}
