import { $Enums } from "@prisma/client";
import { Link2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getWeightTypeIcon } from "../lib/utils";
import type { EditableExercise, Exercise } from "../types";
import { MuscleAnatomy } from "./MuscleAnatomy";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";

interface ExerciseEditDialogProps {
	exercise: Exercise | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (exercise: EditableExercise) => void;
}

export function ExerciseEditDialog({
	exercise,
	open,
	onOpenChange,
	onSave,
}: ExerciseEditDialogProps) {
	const [name, setName] = useState("");
	const [sets, setSets] = useState("");
	const [reps, setReps] = useState("");
	const [weight, setWeight] = useState("");
	const [link, setLink] = useState("");
	const [weightType, setWeightType] =
		useState<$Enums.WeightType>("TOTAL_WEIGHT");
	const [group, setGroup] = useState<$Enums.MuscleGroup | undefined>();

	// Reset the form whenever a different exercise is opened for editing.
	useEffect(() => {
		if (!exercise) return;
		setName(exercise.name);
		setSets(String(exercise.sets));
		setReps(String(exercise.reps));
		setWeight(String(exercise.weight));
		setLink(exercise.link ?? "");
		setWeightType(exercise.weightType);
		setGroup(exercise.group);
	}, [exercise]);

	const cycleWeightType = () => {
		const types = Object.values($Enums.WeightType);
		const nextIndex = (types.indexOf(weightType) + 1) % types.length;
		setWeightType(types[nextIndex]);
	};

	const canSave = Boolean(name && sets && reps && weight && group);

	const handleSave = () => {
		if (!exercise || !canSave || !group) return;
		onSave({
			id: exercise.id,
			name: name.trim(),
			sets: parseInt(sets, 10),
			reps: parseInt(reps, 10),
			weight: parseFloat(weight),
			group,
			weightType,
			link: link.trim() ? link.trim() : null,
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Exercise</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<Input
						placeholder="Exercise name"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<div className="relative">
						<Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
						<Input
							placeholder="Reference link (optional)"
							type="url"
							inputMode="url"
							value={link}
							onChange={(e) => setLink(e.target.value)}
							className="pl-9"
						/>
					</div>
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
								{getWeightTypeIcon(weightType, 16)}
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
					<div className="space-y-2">
						<h4 className="text-sm font-medium text-gray-700">Muscle group</h4>
						<MuscleAnatomy
							selectedMuscles={group ? [group] : []}
							onMuscleSelect={setGroup}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave} disabled={!canSave} className="w-full">
						<Save size={16} />
						Save Changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
