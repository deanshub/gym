import type { LucideIcon } from "lucide-react";

export interface Exercise {
	id: string;
	name: string;
	sets: number;
	reps: number;
	weight: number;
}

export interface Program {
	id: string;
	name: string;
	exercises: Exercise[];
}

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

export interface EmptyStateProps {
	icon: LucideIcon;
	title: string;
	description: string;
	actionLabel: string;
	onAction: () => void;
}

export interface ProgramCardProps {
	program: Program;
}

export interface ProgramExercisesProps {
	programId: string;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
}

export interface ProgramFormProps {
	program: Program | null;
	mode: "create" | "rename" | "exercises";
	onSave: (program: Program) => void;
	onAddExercise: (programId: string, exercise: Omit<Exercise, "id">) => void;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
}
