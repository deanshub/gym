import type { Exercise, Program } from "@prisma/client";
import { $Enums } from "@prisma/client";
import { Dumbbell, Trash2 } from "lucide-react";
import { useState } from "react";
import type { ProgramWithExercises } from "@/types";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

const MUSCLE_GROUPS = Object.values($Enums.MuscleGroup);

interface ProgramFormProps {
	program: ProgramWithExercises | null;
	mode: "create" | "rename" | "exercises";
	onSave: (program: Program) => void;
	onAddExercise: (
		programId: string,
		exercise: Pick<Exercise, "name" | "sets" | "reps" | "weight" | "group">,
	) => void;
	onDeleteExercise: (programId: string, exerciseId: string) => void;
}

export function ProgramForm({
	program,
	mode,
	onSave,
	onAddExercise,
	onDeleteExercise,
}: ProgramFormProps) {
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
			<div className="space-y-4">
				<h4 className="font-medium">Add Exercise to {program.name}</h4>
				<div className="grid grid-cols-2 gap-2">
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
						value={weight}
						onChange={(e) => setWeight(e.target.value)}
					/>
					<Select
						value={muscleGroup}
						onValueChange={(value) =>
							setMuscleGroup(value as $Enums.MuscleGroup)
						}
					>
						<SelectTrigger>
							<SelectValue placeholder="Select muscle group" />
						</SelectTrigger>
						<SelectContent>
							{MUSCLE_GROUPS.map((group) => (
								<SelectItem key={group} value={group}>
									{group
										.replace(/_/g, " ")
										.toLowerCase()
										.replace(/\b\w/g, (l) => l.toUpperCase())}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Button onClick={handleAddExercise} className="w-full">
					<Dumbbell size={16} />
					Add Exercise
				</Button>

				{program.exercises.length > 0 && (
					<div className="space-y-2">
						<h4 className="font-medium">Current Exercises</h4>
						{program.exercises.map((exercise) => (
							<div
								key={exercise.id}
								className="flex justify-between items-center p-2 bg-gray-50 rounded"
							>
								<span>{exercise.name}</span>
								<div className="flex gap-4 text-sm text-gray-600">
									<span>{exercise.sets} sets</span>
									<span>{exercise.reps} reps</span>
									<span>{exercise.weight}kg</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onDeleteExercise(program.id, exercise.id)}
									>
										<Trash2 size={12} />
									</Button>
								</div>
							</div>
						))}
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
}
