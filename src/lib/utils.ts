import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatMuscleGroup(muscleGroup: string): string {
	return muscleGroup
		.replace(/_/g, " ")
		.toLowerCase()
		.replace(/\b\w/g, (l) => l.toUpperCase());
}
