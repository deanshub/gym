import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { formatMuscleGroup, getWeightTypeIcon } from "../lib/utils";
import type { Exercise } from "../types";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "./ui/select";

interface AddExerciseDialogProps {
	/** Program the workout belongs to; its exercises are the pickable options. */
	programId: string | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAdd: (
		exercise: Exercise,
		values: { sets: number; reps: number; weight: number },
	) => void;
}

/**
 * Add a new exercise performance to a past workout. The exercise is chosen from
 * the workout's program; sets/reps/weight prefill from the exercise's template
 * values and stay editable.
 */
export function AddExerciseDialog({
	programId,
	open,
	onOpenChange,
	onAdd,
}: AddExerciseDialogProps) {
	const { data: exercises = [] } = useSWR<Exercise[]>(
		open && programId ? `/api/programs/${programId}/exercises` : null,
	);

	const [exerciseId, setExerciseId] = useState("");
	const [sets, setSets] = useState("");
	const [reps, setReps] = useState("");
	const [weight, setWeight] = useState("");

	// Reset the form each time the dialog opens for a (potentially) new workout.
	useEffect(() => {
		if (!open) return;
		setExerciseId("");
		setSets("");
		setReps("");
		setWeight("");
	}, [open]);

	const selected = exercises.find((e) => e.id === exerciseId) ?? null;

	// Prefill the fields from the chosen exercise's template values.
	const handleSelect = (id: string) => {
		setExerciseId(id);
		const exercise = exercises.find((e) => e.id === id);
		if (exercise) {
			setSets(String(exercise.sets));
			setReps(String(exercise.reps));
			setWeight(String(exercise.weight));
		}
	};

	const canAdd = Boolean(selected && sets && reps && weight);

	const handleAdd = () => {
		if (!selected || !canAdd) return;
		onAdd(selected, {
			sets: parseInt(sets, 10),
			reps: parseInt(reps, 10),
			weight: parseFloat(weight),
		});
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" />
						Add Exercise
					</DialogTitle>
					<DialogDescription>
						Add an exercise you forgot to log to this workout.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3">
					<div className="space-y-1">
						<Label htmlFor="add-exercise">Exercise</Label>
						<Select value={exerciseId} onValueChange={handleSelect}>
							<SelectTrigger id="add-exercise" className="w-full">
								<SelectValue placeholder="Choose an exercise" />
							</SelectTrigger>
							<SelectContent>
								{exercises.map((exercise) => (
									<SelectItem key={exercise.id} value={exercise.id}>
										<span className="flex items-center gap-1.5">
											{getWeightTypeIcon(exercise.weightType, 14)}
											{exercise.name}
											<span className="text-muted-foreground">
												· {formatMuscleGroup(exercise.group)}
											</span>
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{programId && exercises.length === 0 && (
							<p className="text-xs text-muted-foreground">
								This program has no exercises to add.
							</p>
						)}
					</div>

					<div className="grid grid-cols-3 gap-3">
						<div className="space-y-1">
							<Label htmlFor="add-sets">Sets</Label>
							<Input
								id="add-sets"
								type="number"
								inputMode="numeric"
								value={sets}
								onChange={(e) => setSets(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="add-reps">Reps</Label>
							<Input
								id="add-reps"
								type="number"
								inputMode="numeric"
								value={reps}
								onChange={(e) => setReps(e.target.value)}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="add-weight">Weight</Label>
							<Input
								id="add-weight"
								type="number"
								step="0.5"
								inputMode="decimal"
								value={weight}
								onChange={(e) => setWeight(e.target.value)}
							/>
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button onClick={handleAdd} disabled={!canAdd} className="w-full">
						<Plus size={16} />
						Add Exercise
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
