import type { Exercise, Program } from "@prisma/client";
import { $Enums } from "@prisma/client";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { ProgramWithExercises } from "@/types";
import type { ExerciseSearchResult } from "../lib/exercisedb";
import { exerciseDB } from "../lib/exercisedb";
import { getWeightTypeIcon } from "../lib/utils";
import { ExerciseSearch } from "./ExerciseSearch";
import { MuscleAnatomy } from "./MuscleAnatomy";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ProgramFormProps {
	program: ProgramWithExercises | null;
	mode: "create" | "rename" | "exercises";
	wizardStep?: 1 | 2 | 3;
	onSave: (program: Program) => void;
	onAddExercise: (
		programId: string,
		exercise: Pick<
			Exercise,
			"name" | "sets" | "reps" | "weight" | "group" | "weightType"
		>,
	) => void;
	onMuscleGroupChange?: (hasSelection: boolean) => void;
	onExerciseChange?: (hasSelection: boolean) => void;
}

export interface ProgramFormRef {
	submitExercise: () => void;
	canProceedToStep2: () => boolean;
	canProceedToStep3: () => boolean;
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
			onExerciseChange,
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
		const [selectedExerciseDB, setSelectedExerciseDB] =
			useState<ExerciseSearchResult | null>(null);
		const [useCustomExercise, setUseCustomExercise] = useState(false);

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
			if (program && sets && reps && weight && muscleGroup) {
				const exerciseData = {
					name: selectedExerciseDB?.name || exerciseName,
					sets: parseInt(sets, 10),
					reps: parseInt(reps, 10),
					weight: parseFloat(weight),
					group: muscleGroup as $Enums.MuscleGroup,
					weightType,
					// ExerciseDB fields
					exerciseDbId: selectedExerciseDB?.id,
					instructions: selectedExerciseDB?.instructions,
					gifUrl: selectedExerciseDB?.gifUrl,
					equipment: selectedExerciseDB?.equipment,
					target: selectedExerciseDB?.target,
					bodyPart: selectedExerciseDB?.bodyPart,
					secondaryMuscles: selectedExerciseDB?.secondaryMuscles
						? JSON.stringify(selectedExerciseDB.secondaryMuscles)
						: null,
				};

				onAddExercise(program.id, exerciseData);

				// Reset form
				setExerciseName("");
				setSets("");
				setReps("");
				setWeight("");
				setWeightType("TOTAL_WEIGHT");
				setMuscleGroup(undefined);
				setSelectedExerciseDB(null);
				setUseCustomExercise(false);
			}
		};

		const handleMuscleSelect = (muscle: $Enums.MuscleGroup) => {
			setMuscleGroup(muscle);
			onMuscleGroupChange?.(!!muscle);
		};

		const handleExerciseSelect = (exercise: ExerciseSearchResult) => {
			setSelectedExerciseDB(exercise);
			setExerciseName(exercise.name);
			onExerciseChange?.(true);

			// Auto-map muscle group if possible
			const mappedMuscleGroup = exerciseDB.mapToMuscleGroup(exercise.target);
			if (
				mappedMuscleGroup &&
				Object.values($Enums.MuscleGroup).includes(
					mappedMuscleGroup as $Enums.MuscleGroup,
				)
			) {
				setMuscleGroup(mappedMuscleGroup as $Enums.MuscleGroup);
			}
		};

		useImperativeHandle(ref, () => ({
			submitExercise: handleAddExercise,
			canProceedToStep2: () => !!muscleGroup,
			canProceedToStep3: () => {
				if (useCustomExercise) {
					return !!exerciseName.trim();
				}
				return !!selectedExerciseDB;
			},
		}));

		const handleSave = () => {
			if (name) {
				onSave({
					id: program?.id || Date.now().toString(),
					name,
					createdAt: program?.createdAt || new Date(),
					updatedAt: new Date(),
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
					) : wizardStep === 2 ? (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Choose Exercise</h3>
							<div className="flex gap-2 mb-4">
								<Button
									type="button"
									variant={!useCustomExercise ? "default" : "outline"}
									onClick={() => setUseCustomExercise(false)}
									size="sm"
								>
									Browse Exercises
								</Button>
								<Button
									type="button"
									variant={useCustomExercise ? "default" : "outline"}
									onClick={() => setUseCustomExercise(true)}
									size="sm"
								>
									Custom Exercise
								</Button>
							</div>

							{useCustomExercise ? (
								<Input
									placeholder="Exercise name"
									value={exerciseName}
									onChange={(e) => {
										setExerciseName(e.target.value);
										onExerciseChange?.(!!e.target.value.trim());
									}}
								/>
							) : (
								<ExerciseSearch
									onSelectExercise={handleExerciseSelect}
									selectedMuscleGroup={muscleGroup}
								/>
							)}
						</div>
					) : (
						<div className="space-y-4">
							<h3 className="text-lg font-semibold">Add Exercise Details</h3>
							<div className="space-y-4">
								{selectedExerciseDB && (
									<div className="p-3 bg-blue-50 rounded-lg">
										<h4 className="font-medium text-blue-900">
											{selectedExerciseDB.name}
										</h4>
										<p className="text-sm text-blue-700 mt-1">
											{selectedExerciseDB.instructions.length > 150
												? `${selectedExerciseDB.instructions.substring(0, 150)}...`
												: selectedExerciseDB.instructions}
										</p>
									</div>
								)}
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
