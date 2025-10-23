import type { $Enums } from "@prisma/client";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MuscleAnatomy } from "./MuscleAnatomy";
import { ProgressPhotos } from "./ProgressPhotos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WeightUpdate } from "./WeightUpdate";

export function ToolsPage() {
	const { tool } = useParams<{ tool: string }>();
	const [selectedMuscle, setSelectedMuscle] =
		useState<$Enums.MuscleGroup | null>(null);

	const activeTab = tool || "weight";

	const handleMuscleSelect = (muscle: $Enums.MuscleGroup) => {
		setSelectedMuscle((prev) => (prev === muscle ? null : muscle));
	};

	const clearSelection = () => {
		setSelectedMuscle(null);
	};

	return (
		<div className="flex-1 p-4 pt-0">
			<Tabs value={activeTab} className="w-full">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="weight" asChild>
						<Link to="/tools/weight">Update Weight</Link>
					</TabsTrigger>
					<TabsTrigger value="anatomy" asChild>
						<Link to="/tools/anatomy">Muscle Anatomy</Link>
					</TabsTrigger>
					<TabsTrigger value="photos" asChild>
						<Link to="/tools/photos">Progress Photos</Link>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="weight" className="space-y-4">
					<WeightUpdate />
				</TabsContent>

				<TabsContent value="anatomy" className="space-y-4">
					<div className="flex justify-center">
						<MuscleAnatomy
							selectedMuscles={selectedMuscle ? [selectedMuscle] : []}
							onMuscleSelect={handleMuscleSelect}
							multiSelect={false}
						/>
					</div>

					{selectedMuscle && (
						<div className="p-4 bg-blue-50 rounded-lg">
							<div className="flex justify-between items-center">
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
				</TabsContent>

				<TabsContent value="photos" className="space-y-4">
					<ProgressPhotos />
				</TabsContent>
			</Tabs>
		</div>
	);
}
