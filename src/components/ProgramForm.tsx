import type { $Enums, Exercise, Program } from "@prisma/client";
import { forwardRef, useImperativeHandle, useState } from "react";
import type { ProgramWithExercises } from "@/types";
import { MuscleAnatomy } from "./MuscleAnatomy";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface ProgramFormProps {
	program: ProgramWithExercises | null;
	mode: "create" | "rename" | "exercises";
	wizardStep?: 1 | 2;
	onSave: (program: Program) => void;
	onAddExercise: (
		programId: string,
		exercise: Pick<Exercise, "name" | "sets" | "reps" | "weight" | "group">,
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
		const [muscleGroup, setMuscleGroup] = useState<
			$Enums.MuscleGroup | undefined
		>();
		const handleAddExercise = () => {
			if (program && exerciseName && sets && reps && weight && muscleGroup) {
				onAddExercise(program.id, {
					name: exerciseName,
					sets: parseInt(sets, 10),
					reps: parseInt(reps, 10),
					weight: parseFloat(weight),
					group: muscleGroup as $Enums.MuscleGroup,
				});
				setExerciseName("");
				setSets("");
				setReps("");
				setWeight("");
				setMuscleGroup(undefined);
			}
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
					createdAt: program?.createdAt || new Date(),
					updatedAt: new Date(),
				});
			}
		};

		const handleMuscleSelect = (muscle: $Enums.MuscleGroup) => {
			setMuscleGroup(muscle);
			onMuscleGroupChange?.(!!muscle);
		};

		if (mode === "exercises" && program) {
			return (
				<div className="">
					<h4 className="font-medium">Add Exercise to {program.name}</h4>

					{wizardStep === 1 ? (
						<div className="space-y-4">
							<div className="text-sm text-gray-600">
								Step 1 of 2: Choose muscle group
							</div>
							<div className="border rounded-lg p-4 bg-gray-50 min-h-[400px] flex items-center justify-center">
								<MuscleAnatomy
									selectedMuscles={muscleGroup ? [muscleGroup] : []}
									onMuscleSelect={handleMuscleSelect}
									multiSelect={false}
								/>
							</div>
						</div>
					) : (
						<div className="space-y-4">
							<div className="text-sm text-gray-600">
								Step 2 of 2: Exercise details
							</div>

							<div className="space-y-4">
								<div className="p-3 bg-blue-50 rounded-lg">
									<div className="text-sm font-medium text-blue-900">
										Muscle Group:{" "}
										{muscleGroup
											?.replace(/_/g, " ")
											.replace(/\b\w/g, (l) => l.toUpperCase())}
									</div>
								</div>

								<div className="grid grid-cols-1 gap-4">
									<Input
										placeholder="Exercise name"
										value={exerciseName}
										onChange={(e) => setExerciseName(e.target.value)}
									/>
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
									<Input
										placeholder="Weight (kg)"
										type="number"
										step="0.5"
										value={weight}
										onChange={(e) => setWeight(e.target.value)}
									/>
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
					{mode === "create" ? "Create Program" : "Update Name"}
				</Button>
			</div>
		);
	},
);
