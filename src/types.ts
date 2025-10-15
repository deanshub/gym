import type { Exercise, Program } from "@prisma/client";

export type ProgramWithExercises = Program & { exercises: Exercise[] };

export interface WorkoutSession {
	currentExerciseIndex: number;
	startTime: Date;
	exerciseStartTime: Date | null;
	completedExercises: Array<{
		exerciseId: string;
		startTime: Date;
		endTime: Date;
	}>;
}
