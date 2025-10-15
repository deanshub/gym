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
