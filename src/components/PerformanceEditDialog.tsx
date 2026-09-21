import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { getWeightTypeIcon } from "../lib/utils";
import type { PerformanceWithExercise } from "../types";
import { Button } from "./ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface PerformanceEditDialogProps {
	performance: PerformanceWithExercise | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (values: { sets: number; reps: number; weight: number }) => void;
}

/** Edit the recorded sets/reps/weight of a single logged exercise performance. */
export function PerformanceEditDialog({
	performance,
	open,
	onOpenChange,
	onSave,
}: PerformanceEditDialogProps) {
	const [sets, setSets] = useState("");
	const [reps, setReps] = useState("");
	const [weight, setWeight] = useState("");

	// Reset the form whenever a different performance is opened for editing.
	useEffect(() => {
		if (!performance) return;
		setSets(String(performance.sets));
		setReps(String(performance.reps));
		setWeight(String(performance.weight));
	}, [performance]);

	const canSave = Boolean(sets && reps && weight);

	const handleSave = () => {
		if (!performance || !canSave) return;
		onSave({
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
						{performance &&
							getWeightTypeIcon(performance.exercise.weightType, 18)}
						{performance?.exercise.name ?? "Edit Performance"}
					</DialogTitle>
				</DialogHeader>
				<div className="grid grid-cols-3 gap-3">
					<div className="space-y-1">
						<Label htmlFor="perf-sets">Sets</Label>
						<Input
							id="perf-sets"
							type="number"
							inputMode="numeric"
							value={sets}
							onChange={(e) => setSets(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="perf-reps">Reps</Label>
						<Input
							id="perf-reps"
							type="number"
							inputMode="numeric"
							value={reps}
							onChange={(e) => setReps(e.target.value)}
						/>
					</div>
					<div className="space-y-1">
						<Label htmlFor="perf-weight">Weight</Label>
						<Input
							id="perf-weight"
							type="number"
							step="0.5"
							inputMode="decimal"
							value={weight}
							onChange={(e) => setWeight(e.target.value)}
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
