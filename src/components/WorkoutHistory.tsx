import { differenceInMinutes, format } from "date-fns";
import { ChevronDown, ChevronUp, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { apiMutate, newId } from "../lib/offline-sync";
import { formatMuscleGroup, getWeightTypeIcon } from "../lib/utils";
import type {
	Exercise,
	PerformanceWithExercise,
	WorkoutWithDetails,
} from "../types";
import { AddExerciseDialog } from "./AddExerciseDialog";
import { PerformanceEditDialog } from "./PerformanceEditDialog";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

const WORKOUTS_KEY = "/api/workouts";

// The workout list can grow unbounded; render a page at a time so the DOM stays
// light and the tab opens instantly. "Show more" reveals the next batch.
const PAGE_SIZE = 10;

/**
 * Browse past workouts and fix logged data: edit an exercise's sets/reps/weight,
 * remove a mis-logged exercise, or delete a whole workout. All edits go through
 * `apiMutate` (optimistic, offline-queued) and update the shared `/api/workouts`
 * SWR cache so the statistics charts stay consistent.
 */
export function WorkoutHistory() {
	const { data: workouts = [], isLoading } =
		useSWR<WorkoutWithDetails[]>(WORKOUTS_KEY);
	const { mutate } = useSWRConfig();

	const [expandedId, setExpandedId] = useState<string | null>(null);
	const [editPerf, setEditPerf] = useState<PerformanceWithExercise | null>(
		null,
	);
	const [editOpen, setEditOpen] = useState(false);
	const [workoutToDelete, setWorkoutToDelete] =
		useState<WorkoutWithDetails | null>(null);
	const [perfToDelete, setPerfToDelete] =
		useState<PerformanceWithExercise | null>(null);
	const [addToWorkout, setAddToWorkout] = useState<WorkoutWithDetails | null>(
		null,
	);
	const [addOpen, setAddOpen] = useState(false);
	const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

	const addPerformance = async (
		workout: WorkoutWithDetails,
		exercise: Exercise,
		values: { sets: number; reps: number; weight: number },
	) => {
		const performanceId = newId("performance");
		// A retroactively-added exercise has no real timing, so anchor it to the
		// workout's start so it sorts inside the session.
		const start = new Date(workout.startTime).toISOString();
		const optimistic: PerformanceWithExercise = {
			id: performanceId,
			userId: "",
			workoutId: workout.id,
			exerciseId: exercise.id,
			sets: values.sets,
			reps: values.reps,
			weight: values.weight,
			startTime: new Date(start),
			endTime: new Date(start),
			createdAt: new Date(),
			updatedAt: new Date(),
			exercise,
		};
		mutate<WorkoutWithDetails[]>(
			WORKOUTS_KEY,
			(current = []) =>
				current.map((w) =>
					w.id === workout.id
						? {
								...w,
								exercisePerformances: [...w.exercisePerformances, optimistic],
							}
						: w,
				),
			false,
		);
		try {
			await apiMutate("/api/exercise-performances", {
				method: "POST",
				body: {
					id: performanceId,
					workoutId: workout.id,
					exerciseId: exercise.id,
					sets: values.sets,
					reps: values.reps,
					weight: values.weight,
					startTime: start,
					endTime: start,
				},
			});
			toast.success("Exercise added");
		} catch {
			toast.error("Failed to add exercise");
			mutate(WORKOUTS_KEY); // revalidate to roll back the optimistic insert
		}
	};

	const savePerformance = async (
		perf: PerformanceWithExercise,
		values: { sets: number; reps: number; weight: number },
	) => {
		mutate<WorkoutWithDetails[]>(
			WORKOUTS_KEY,
			(current = []) =>
				current.map((w) => ({
					...w,
					exercisePerformances: w.exercisePerformances.map((p) =>
						p.id === perf.id ? { ...p, ...values } : p,
					),
				})),
			false,
		);
		try {
			await apiMutate(`/api/exercise-performances/${perf.id}`, {
				method: "PUT",
				body: values,
			});
			toast.success("Exercise updated");
		} catch {
			toast.error("Failed to update exercise");
			mutate(WORKOUTS_KEY); // revalidate to roll back the optimistic change
		}
	};

	const deletePerformance = async (perf: PerformanceWithExercise) => {
		mutate<WorkoutWithDetails[]>(
			WORKOUTS_KEY,
			(current = []) =>
				current.map((w) => ({
					...w,
					exercisePerformances: w.exercisePerformances.filter(
						(p) => p.id !== perf.id,
					),
				})),
			false,
		);
		try {
			await apiMutate(`/api/exercise-performances/${perf.id}`, {
				method: "DELETE",
			});
			toast.success("Exercise removed");
		} catch {
			toast.error("Failed to remove exercise");
			mutate(WORKOUTS_KEY);
		}
	};

	const deleteWorkout = async (workout: WorkoutWithDetails) => {
		mutate<WorkoutWithDetails[]>(
			WORKOUTS_KEY,
			(current = []) => current.filter((w) => w.id !== workout.id),
			false,
		);
		try {
			await apiMutate(`/api/workouts/${workout.id}`, { method: "DELETE" });
			toast.success("Workout deleted");
		} catch {
			toast.error("Failed to delete workout");
			mutate(WORKOUTS_KEY);
		}
	};

	const confirmDelete = async () => {
		if (workoutToDelete) {
			const target = workoutToDelete;
			setWorkoutToDelete(null);
			await deleteWorkout(target);
		} else if (perfToDelete) {
			const target = perfToDelete;
			setPerfToDelete(null);
			await deletePerformance(target);
		}
	};

	const deletingWorkout = workoutToDelete !== null;
	const confirmOpen = workoutToDelete !== null || perfToDelete !== null;

	return (
		<div className="space-y-3">
			{isLoading && (
				<p className="text-sm text-muted-foreground">Loading workouts…</p>
			)}

			{!isLoading && workouts.length === 0 && (
				<div className="py-8 text-center text-sm text-muted-foreground">
					No workouts recorded yet.
				</div>
			)}

			{workouts.slice(0, visibleCount).map((workout) => {
				const expanded = expandedId === workout.id;
				const perfs = [...workout.exercisePerformances].sort(
					(a, b) =>
						new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
				);
				const duration = workout.endTime
					? differenceInMinutes(
							new Date(workout.endTime),
							new Date(workout.startTime),
						)
					: null;

				return (
					<Card key={workout.id}>
						<CardHeader>
							<button
								type="button"
								onClick={() => setExpandedId(expanded ? null : workout.id)}
								className="flex min-h-11 w-full items-start justify-between gap-2 text-left"
							>
								<div className="min-w-0">
									<CardTitle className="text-base">
										{workout.program.name}
									</CardTitle>
									<p className="text-sm text-muted-foreground">
										{format(
											new Date(workout.startTime),
											"EEE, MMM d, yyyy · HH:mm",
										)}
									</p>
									<p className="mt-1 text-xs text-muted-foreground">
										{perfs.length} exercise{perfs.length === 1 ? "" : "s"}
										{duration !== null ? ` · ${duration} min` : ""}
									</p>
								</div>
								{expanded ? (
									<ChevronUp className="h-5 w-5 shrink-0" />
								) : (
									<ChevronDown className="h-5 w-5 shrink-0" />
								)}
							</button>
						</CardHeader>

						{expanded && (
							<CardContent className="space-y-2">
								{perfs.length === 0 && (
									<p className="text-sm text-muted-foreground">
										No exercises logged in this workout.
									</p>
								)}

								{perfs.map((perf) => (
									<div
										key={perf.id}
										className="flex items-center justify-between gap-2 rounded-lg border p-2"
									>
										<div className="min-w-0">
											<div className="flex items-center gap-1.5 font-medium">
												{getWeightTypeIcon(perf.exercise.weightType, 14)}
												<span className="truncate">{perf.exercise.name}</span>
											</div>
											<p className="text-xs text-muted-foreground">
												{formatMuscleGroup(perf.exercise.group)} · {perf.sets} ×{" "}
												{perf.reps} @ {perf.weight} kg
											</p>
										</div>
										<div className="flex shrink-0 items-center gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-11 w-11"
												aria-label={`Edit ${perf.exercise.name}`}
												onClick={() => {
													setEditPerf(perf);
													setEditOpen(true);
												}}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-11 w-11 text-red-600"
												aria-label={`Remove ${perf.exercise.name}`}
												onClick={() => setPerfToDelete(perf)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</div>
								))}

								<Button
									variant="outline"
									className="w-full"
									onClick={() => {
										setAddToWorkout(workout);
										setAddOpen(true);
									}}
								>
									<Plus className="h-4 w-4" />
									Add Exercise
								</Button>

								<Button
									variant="outline"
									className="w-full text-red-600"
									onClick={() => setWorkoutToDelete(workout)}
								>
									<Trash2 className="h-4 w-4" />
									Delete Workout
								</Button>
							</CardContent>
						)}
					</Card>
				);
			})}

			{workouts.length > visibleCount && (
				<Button
					variant="outline"
					className="w-full"
					onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
				>
					<Plus className="h-4 w-4" />
					Show more ({workouts.length - visibleCount} left)
				</Button>
			)}

			<PerformanceEditDialog
				performance={editPerf}
				open={editOpen}
				onOpenChange={setEditOpen}
				onSave={(values) => editPerf && savePerformance(editPerf, values)}
			/>

			<AddExerciseDialog
				programId={addToWorkout?.programId ?? null}
				open={addOpen}
				onOpenChange={setAddOpen}
				onAdd={(exercise, values) =>
					addToWorkout && addPerformance(addToWorkout, exercise, values)
				}
			/>

			<Dialog
				open={confirmOpen}
				onOpenChange={(open) => {
					if (!open) {
						setWorkoutToDelete(null);
						setPerfToDelete(null);
					}
				}}
			>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>
							{deletingWorkout ? "Delete workout?" : "Remove exercise?"}
						</DialogTitle>
						<DialogDescription>
							{deletingWorkout
								? "This permanently deletes the workout and every exercise logged in it."
								: "This permanently removes this exercise from the workout."}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="flex-row gap-2">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => {
								setWorkoutToDelete(null);
								setPerfToDelete(null);
							}}
						>
							<X className="h-4 w-4" />
							Cancel
						</Button>
						<Button
							variant="destructive"
							className="flex-1"
							onClick={confirmDelete}
						>
							<Trash2 className="h-4 w-4" />
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
