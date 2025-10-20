import type { Exercise, Program } from "@prisma/client";
import { $Enums } from "@prisma/client";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { ProgramWithExercises } from "@/types";
import { getWeightTypeIcon } from "../lib/utils";
import { MuscleAnatomy } from "./MuscleAnatomy";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ProgramFormProps {
	program: ProgramWithExercises | null;
	mode: "create" | "rename" | "exercises";
	wizardStep?: 1 | 2;
	onSave: (
		program: Omit<Program, "userId" | "createdAt" | "updatedAt">,
	) => void;
	onAddExercise: (
		programId: string,
		exercise: Pick<
			Exercise,
			"name" | "sets" | "reps" | "weight" | "group" | "weightType"
		>,
	) => void;
	onMuscleGroupChange?: (hasSelection: boolean) => void;
}

export interface ProgramFormRef {
	submitExercise: () => void;
	canProceedToStep2: () => boolean;
}

export const ProgramForm = forwardRef<ProgramFormRef, ProgramFormProps>(
	(
		{
			program,
			mode,
			wizardStep = 1,
			onSave,
			onAddExercise,
			onMuscleGroupChange,
		},
		ref,
	) => {
		const [name, setName] = useState(program?.name || "");
		const [exerciseName, setExerciseName] = useState("");
		const [sets, setSets] = useState("");
		const [reps, setReps] = useState("");
		const [weight, setWeight] = useState("");
		const [weightType, setWeightType] =
			useState<$Enums.WeightType>("TOTAL_WEIGHT");
		const [muscleGroup, setMuscleGroup] = useState<
			$Enums.MuscleGroup | undefined
		>();

		const cycleWeightType = () => {
			const types = Object.values($Enums.WeightType);
			const currentIndex = types.indexOf(weightType);
			const nextIndex = (currentIndex + 1) % types.length;
			setWeightType(types[nextIndex]);
		};

		const getWeightTypeIconLocal = () => {
			return getWeightTypeIcon(weightType, 16);
		};

		const handleAddExercise = () => {
			if (program && exerciseName && sets && reps && weight && muscleGroup) {
				onAddExercise(program.id, {
					name: exerciseName,
					sets: parseInt(sets, 10),
					reps: parseInt(reps, 10),
					weight: parseFloat(weight),
					group: muscleGroup as $Enums.MuscleGroup,
					weightType,
				});

				setExerciseName("");
				setSets("");
				setReps("");
				setWeight("");
				setWeightType("TOTAL_WEIGHT");
				setMuscleGroup(undefined);
			}
		};

		const handleMuscleSelect = (muscle: $Enums.MuscleGroup) => {
			setMuscleGroup(muscle);
			onMuscleGroupChange?.(!!muscle);
		};

		useImperativeHandle(ref, () => ({
			submitExercise: handleAddExercise,
			canProceedToStep2: () => !!muscleGroup,
		}));

		const handleSave = () => {
			if (name) {
				onSave({
					id: program?.id || Date.now().toString(),
					name,
				});
			}
		};

		if (mode === "exercises" && program) {
			return (
				<div className="">
					{wizardStep === 1 ? (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">
								Select Muscle Group for Exercise
							</h3>
							<MuscleAnatomy
								selectedMuscles={muscleGroup ? [muscleGroup] : []}
								onMuscleSelect={handleMuscleSelect}
							/>
						</div>
					) : (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Add Exercise Details</h3>
							<div className="space-y-4">
								<Input
									placeholder="Exercise name"
									value={exerciseName}
									onChange={(e) => setExerciseName(e.target.value)}
								/>
								<div className="grid grid-cols-2 gap-4">
									<Input
										placeholder="Sets"
										type="number"
										value={sets}
										onChange={(e) => setSets(e.target.value)}
									/>
									<Input
										placeholder="Reps"
										type="number"
										value={reps}
										onChange={(e) => setReps(e.target.value)}
									/>
									<div className="flex gap-2 col-span-2 items-center">
										<Button
											type="button"
											variant="outline"
											size="lg"
											onClick={cycleWeightType}
											className="p-2 mx-2"
										>
											{getWeightTypeIconLocal()}
										</Button>
										<Input
											placeholder="Weight (kg)"
											type="number"
											step="0.5"
											value={weight}
											onChange={(e) => setWeight(e.target.value)}
											className="flex-1"
										/>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>
			);
		}

		return (
			<div className="space-y-4">
				<Input
					placeholder="Program name"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				<Button onClick={handleSave} className="w-full">
					{mode === "create" ? "Create Program" : "Save Changes"}
				</Button>
			</div>
		);
	},
);
