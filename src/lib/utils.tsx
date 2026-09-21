import type { Exercise } from "@prisma/client";
import { $Enums } from "@prisma/client";
import type { ClassValue } from "clsx";
import { clsx } from "clsx";
import { Anvil, Dumbbell, HandFist, Weight } from "lucide-react";
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

/** Parse a program's comma-separated `muscleGroupOrder` into a clean list. */
export function parseGroupOrder(order: string | null | undefined): string[] {
	if (!order) return [];
	return order
		.split(",")
		.map((g) => g.trim())
		.filter(Boolean);
}

/**
 * Order the muscle groups that are actually present by the program's saved
 * `order`. Groups not in `order` (e.g. a newly added group) keep their
 * first-seen position from `present` and sort after the listed ones. This is
 * the single source of truth for group order across the app.
 */
export function orderMuscleGroups(
	present: string[],
	order: string[],
): string[] {
	const rank = new Map(order.map((g, i) => [g, i]));
	return [...present].sort((a, b) => {
		const ra = rank.get(a);
		const rb = rank.get(b);
		// Both listed: by saved order. One listed: it comes first. Neither:
		// preserve original (first-seen) order via a stable-sort fallback.
		if (ra !== undefined && rb !== undefined) return ra - rb;
		if (ra !== undefined) return -1;
		if (rb !== undefined) return 1;
		return present.indexOf(a) - present.indexOf(b);
	});
}

/**
 * Flatten exercises into a single list ordered by the program's muscle-group
 * order (groups sorted via {@link orderMuscleGroups}, exercises within a group
 * kept in their existing order). Drives the workout sequence.
 */
export function sortExercisesByGroupOrder(
	exercises: Exercise[],
	order: string | null | undefined,
): Exercise[] {
	const present: string[] = [];
	const byGroup = new Map<string, Exercise[]>();
	for (const exercise of exercises) {
		const group = exercise.group;
		if (!byGroup.has(group)) {
			byGroup.set(group, []);
			present.push(group);
		}
		byGroup.get(group)?.push(exercise);
	}
	return orderMuscleGroups(present, parseGroupOrder(order)).flatMap(
		(group) => byGroup.get(group) ?? [],
	);
}

export function getWeightTypeIcon(weightType: $Enums.WeightType, size = 16) {
	switch (weightType) {
		case $Enums.WeightType.BODYWEIGHT:
			return <HandFist size={size} />;
		case $Enums.WeightType.PER_SIDE:
			return <Anvil size={size} />;
		case $Enums.WeightType.TOTAL_WEIGHT:
			return <Weight size={size} />;
		case $Enums.WeightType.SINGLE_WEIGHT:
			return <Dumbbell size={size} />;
	}
}
