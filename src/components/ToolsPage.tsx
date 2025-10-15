import type { $Enums } from "@prisma/client";
import { useState } from "react";
import { MuscleAnatomy } from "./MuscleAnatomy";

export function ToolsPage() {
	const [selectedMuscle, setSelectedMuscle] =
		useState<$Enums.MuscleGroup | null>(null);

	const handleMuscleSelect = (muscle: $Enums.MuscleGroup) => {
		setSelectedMuscle((prev) => (prev === muscle ? null : muscle));
	};

	const clearSelection = () => {
		setSelectedMuscle(null);
	};

	return (
		<div className="flex-1 p-4">
			<h2 className="text-xl font-bold mb-4">Interactive Muscle Anatomy</h2>

			<div className="flex justify-center mb-4">
				<MuscleAnatomy
					selectedMuscles={selectedMuscle ? [selectedMuscle] : []}
					onMuscleSelect={handleMuscleSelect}
					multiSelect={false}
				/>
			</div>

			{selectedMuscle && (
				<div className="mt-4 p-4 bg-blue-50 rounded-lg">
					<div className="flex justify-between items-center mb-2">
						<h3 className="font-semibold text-blue-900">
							Selected Muscle:{" "}
							{selectedMuscle
								.replace(/_/g, " ")
								.replace(/\b\w/g, (l) => l.toUpperCase())}
						</h3>
						<button
							type="button"
							onClick={clearSelection}
							className="text-sm text-blue-600 hover:text-blue-800"
						>
							Clear
						</button>
					</div>
				</div>
			)}
		</div>
	);
}
