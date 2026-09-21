import type { Exercise, Program } from "@prisma/client";
import {
	CheckCircle,
	ChevronDown,
	ChevronLeft,
	ChevronRight,
	ChevronUp,
	Edit,
	ExternalLink,
	Flag,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import useSWR from "swr";
import { apiMutate, newId } from "../lib/offline-sync";
import {
	formatMuscleGroup,
	getWeightTypeIcon,
	sortExercisesByGroupOrder,
} from "../lib/utils";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { WorkoutCompleted } from "./WorkoutCompleted";

interface WorkoutSession {
	workoutId: string;
	currentExerciseIndex: number;
	startTime: Date;
	exerciseStartTime: Date | null;
	completedExercises: Array<{
		exerciseId: string;
		performanceId: string;
		startTime: Date;
		endTime: Date;
		sets: number;
		reps: number;
		weight: number;
	}>;
	workoutCompleted?: boolean;
	workoutEndTime?: Date;
}

export function ActiveWorkoutPage() {
	const { programId } = useParams<{ programId: string }>();
	const { data: program, error: programError } = useSWR<Program>(
		`/api/programs/${programId}`,
	);
	// The program-detail endpoint above isn't cached for offline use (only the
	// programs list and each program's exercises are, via the home/programs
	// screens), so fall back to the cached list to resolve the program offline.
	const { data: programs, error: programsError } =
		useSWR<Program[]>("/api/programs");
	const { data: rawExercises = [], error: exercisesError } = useSWR<Exercise[]>(
		`/api/programs/${programId}/exercises`,
	);

	const resolvedProgram =
		program ?? programs?.find((p) => p.id === programId) ?? null;

	// Order exercises by the program's muscle-group order so the workout follows
	// the sequence the user arranged on the Programs page. Everything below drives
	// the flow off this ordered list.
	const exercises = useMemo(
		() =>
			sortExercisesByGroupOrder(
				rawExercises,
				resolvedProgram?.muscleGroupOrder ?? null,
			),
		[rawExercises, resolvedProgram],
	);

	const [session, setSession] = useState<WorkoutSession>(() => {
		const now = new Date();
		return {
			workoutId: newId("workout"),
			currentExerciseIndex: 0,
			startTime: now,
			exerciseStartTime: now,
			completedExercises: [],
		};
	});

	const [elapsedTime, setElapsedTime] = useState(0);
	const [editDialog, setEditDialog] = useState<{
		open: boolean;
		field: "sets" | "reps" | "weight" | null;
		value: string;
	}>({ open: false, field: null, value: "" });

	// Timer effect
	useEffect(() => {
		const interval = setInterval(() => {
			setElapsedTime(
				Math.floor((Date.now() - session.startTime.getTime()) / 1000),
			);
		}, 1000);
		return () => clearInterval(interval);
	}, [session.startTime]);

	const [exerciseValues, setExerciseValues] = useState<
		Record<string, { sets: number; reps: number; weight: number }>
	>({});

	// Create workout session on component mount. The workout carries our
	// client-generated id, so the server upserts on it and we never need to
	// reconcile a server-assigned id — which keeps this working offline.
	useEffect(() => {
		if (programId) {
			void apiMutate("/api/workouts", {
				method: "POST",
				body: {
					id: session.workoutId,
					programId,
					startTime: session.startTime.toISOString(),
				},
			});
		}
	}, [programId, session.workoutId, session.startTime]);

	// Initialize exercise values when exercises load
	useEffect(() => {
		if (exercises.length > 0) {
			const initialValues: Record<
				string,
				{ sets: number; reps: number; weight: number }
			> = {};
			exercises.forEach((exercise) => {
				initialValues[exercise.id] = {
					sets: exercise.sets,
					reps: exercise.reps,
					weight: exercise.weight,
				};
			});
			setExerciseValues(initialValues);
		}
	}, [exercises]);

	const updateValue = (field: "sets" | "reps" | "weight", delta: number) => {
		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		setExerciseValues((prev) => ({
			...prev,
			[currentExercise.id]: {
				...prev[currentExercise.id],
				[field]: Math.max(0, (prev[currentExercise.id]?.[field] || 0) + delta),
			},
		}));
	};

	const openEditDialog = (field: "sets" | "reps" | "weight") => {
		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		const currentValue = exerciseValues[currentExercise.id]?.[field] || 0;
		setEditDialog({
			open: true,
			field,
			value: currentValue.toString(),
		});
	};

	const saveEditValue = () => {
		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise || !editDialog.field) return;

		const newValue = Math.max(0, Number(editDialog.value) || 0);
		const field = editDialog.field;
		setExerciseValues((prev) => ({
			...prev,
			[currentExercise.id]: {
				...prev[currentExercise.id],
				[field]: newValue,
			},
		}));

		setEditDialog({ open: false, field: null, value: "" });
	};

	const goToPreviousExercise = () => {
		if (session.currentExerciseIndex > 0) {
			setSession((prev) => ({
				...prev,
				currentExerciseIndex: prev.currentExerciseIndex - 1,
			}));
		}
	};

	const goToNextExercise = () => {
		if (session.currentExerciseIndex < exercises.length - 1) {
			setSession((prev) => ({
				...prev,
				currentExerciseIndex: prev.currentExerciseIndex + 1,
			}));
		}
	};

	const goToExercise = (index: number) => {
		if (index >= 0 && index < exercises.length) {
			setSession((prev) => ({
				...prev,
				currentExerciseIndex: index,
			}));
		}
	};

	/**
	 * The next exercise still needing work, searching forward from `fromIndex` and
	 * wrapping around. Because the user jumps between exercises by gym availability,
	 * completing one advances to the next *incomplete* one (which may be an earlier,
	 * skipped exercise) rather than blindly to the next index. Returns `fromIndex`
	 * if nothing is left incomplete.
	 */
	const findNextIncompleteIndex = (
		fromIndex: number,
		completedIds: Set<string>,
	) => {
		for (let step = 1; step <= exercises.length; step++) {
			const idx = (fromIndex + step) % exercises.length;
			if (!completedIds.has(exercises[idx].id)) return idx;
		}
		return fromIndex;
	};

	const updateExercise = async () => {
		if (!exercises.length) return;

		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		const completed = session.completedExercises.find(
			(c) => c.exerciseId === currentExercise.id,
		);
		if (!completed) return;

		const updatedPerformance = {
			sets: exerciseValues[currentExercise.id]?.sets || currentExercise.sets,
			reps: exerciseValues[currentExercise.id]?.reps || currentExercise.reps,
			weight:
				exerciseValues[currentExercise.id]?.weight || currentExercise.weight,
		};

		// Update local state optimistically (also advances to the next exercise)
		// so the flow works identically online and offline.
		setSession((prev) => ({
			...prev,
			completedExercises: prev.completedExercises.map((c) =>
				c.exerciseId === currentExercise.id
					? { ...c, ...updatedPerformance }
					: c,
			),
			currentExerciseIndex:
				prev.currentExerciseIndex < exercises.length - 1
					? prev.currentExerciseIndex + 1
					: prev.currentExerciseIndex,
		}));

		try {
			await apiMutate(`/api/exercise-performances/${completed.performanceId}`, {
				method: "PUT",
				body: { workoutId: session.workoutId, ...updatedPerformance },
			});
		} catch (error) {
			console.error("Error updating exercise:", error);
		}
	};

	const completeExercise = async () => {
		if (!exercises.length) return;

		const now = new Date();
		const currentExercise = exercises[session.currentExerciseIndex];
		if (!currentExercise) return;

		// Client-generated id so the performance can be created offline and its
		// queued replay stays idempotent (server upserts on this id).
		const performanceId = newId("performance");
		const performance = {
			exerciseId: currentExercise.id,
			startTime: session.exerciseStartTime || now,
			endTime: now,
			sets: exerciseValues[currentExercise.id]?.sets || currentExercise.sets,
			reps: exerciseValues[currentExercise.id]?.reps || currentExercise.reps,
			weight:
				exerciseValues[currentExercise.id]?.weight || currentExercise.weight,
		};

		const completedExercises = [
			...session.completedExercises,
			{ ...performance, performanceId },
		];
		const updatedSession = { ...session, completedExercises };

		// The workout finishes only when *every* exercise is done — not merely
		// because we're on the last one by index. The user moves between exercises
		// by gym availability, so completing the last-indexed exercise may still
		// leave earlier ones skipped, and force-ending there would strand them.
		const completedIds = new Set(completedExercises.map((c) => c.exerciseId));
		const isWorkoutComplete = exercises.every((e) => completedIds.has(e.id));

		// Advance the UI optimistically, then persist (queues when offline).
		if (!isWorkoutComplete) {
			setSession({
				...updatedSession,
				currentExerciseIndex: findNextIncompleteIndex(
					session.currentExerciseIndex,
					completedIds,
				),
				exerciseStartTime: now,
			});
		} else {
			setSession({
				...updatedSession,
				workoutCompleted: true,
				workoutEndTime: now,
			});
		}

		await apiMutate("/api/exercise-performances", {
			method: "POST",
			body: {
				id: performanceId,
				workoutId: session.workoutId,
				exerciseId: performance.exerciseId,
				sets: performance.sets,
				reps: performance.reps,
				weight: performance.weight,
				startTime: performance.startTime.toISOString(),
				endTime: performance.endTime.toISOString(),
			},
		});

		if (isWorkoutComplete) {
			// Workout complete - set the end time (FIFO queue keeps this after the
			// performance create above).
			await apiMutate(`/api/workouts/${session.workoutId}`, {
				method: "PUT",
				body: { endTime: now.toISOString() },
			});
		}
	};

	// Finish the workout as-is, keeping whatever's been completed and skipping the
	// rest. Shows the completion summary (like a natural finish) rather than bailing
	// to the home screen, so an early finish is still a logged, celebrated workout.
	const finishWorkout = async () => {
		const now = new Date();
		setSession((prev) => ({
			...prev,
			workoutCompleted: true,
			workoutEndTime: now,
		}));
		await apiMutate(`/api/workouts/${session.workoutId}`, {
			method: "PUT",
			body: { endTime: now.toISOString() },
		});
	};

	const hasData = Boolean(resolvedProgram) && exercises.length > 0;
	const loadError = programError ?? programsError ?? exercisesError;

	// First load: nothing cached yet and nothing has failed — show the spinner.
	if (!hasData && !loadError) {
		return (
			<div className="flex-1 p-4">
				<p>Loading workout...</p>
			</div>
		);
	}

	// Data genuinely unavailable (offline with nothing cached, a fetch failure, or
	// an empty program). Hand off to the route ErrorBoundary for a proper fallback.
	if (!hasData) {
		throw new Error(
			typeof navigator !== "undefined" && !navigator.onLine
				? "This workout isn't available offline yet. Open it once while online so it's saved for offline use."
				: !resolvedProgram
					? "We couldn't load this program."
					: "This program has no exercises yet.",
		);
	}

	// Past the guards above, both are guaranteed present.
	const activeProgram = resolvedProgram as Program;
	const currentExercise = exercises[session.currentExerciseIndex];
	if (!currentExercise) return null;

	const progress =
		((session.currentExerciseIndex + 1) / exercises.length) * 100;

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, "0")}`;
	};

	return (
		<div className="flex-1 p-4">
			<Dialog
				open={editDialog.open}
				onOpenChange={(open) => setEditDialog({ open, field: null, value: "" })}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Edit {editDialog.field}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<Input
							type="number"
							value={editDialog.value}
							onChange={(e) =>
								setEditDialog((prev) => ({ ...prev, value: e.target.value }))
							}
							placeholder={`Enter ${editDialog.field}`}
							min="0"
							autoFocus
							onKeyDown={(e) => e.key === "Enter" && saveEditValue()}
						/>
						<div className="flex gap-2">
							<Button
								variant="outline"
								onClick={() =>
									setEditDialog({ open: false, field: null, value: "" })
								}
								className="flex-1"
							>
								Cancel
							</Button>
							<Button onClick={saveEditValue} className="flex-1">
								Save
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{session.workoutCompleted ? (
				<WorkoutCompleted
					program={activeProgram}
					startTime={session.startTime}
					endTime={session.workoutEndTime || new Date()}
					completedExercises={session.completedExercises}
				/>
			) : (
				<>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-bold">{activeProgram.name}</h2>
						<div className="text-lg font-mono">{formatTime(elapsedTime)}</div>
						<Button variant="outline" onClick={finishWorkout}>
							<Flag />
							Finish Workout
						</Button>
					</div>

					<div className="mb-4">
						<div className="flex justify-between text-sm text-gray-600 mb-1">
							<span>
								Exercise {session.currentExerciseIndex + 1} of{" "}
								{exercises.length}
							</span>
							<span>{Math.round(progress)}%</span>
						</div>
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-primary h-2 rounded-full transition-all"
								style={{ width: `${progress}%` }}
							/>
						</div>
					</div>

					<div className="flex gap-2 mb-4">
						<Button
							variant="outline"
							onClick={goToPreviousExercise}
							disabled={session.currentExerciseIndex === 0}
							className="flex-1 h-11"
						>
							<ChevronLeft size={16} />
							Previous
						</Button>
						<Button
							variant="outline"
							onClick={goToNextExercise}
							disabled={session.currentExerciseIndex === exercises.length - 1}
							className="flex-1 h-11"
						>
							Next
							<ChevronRight size={16} />
						</Button>
					</div>

					<Card className="mb-6">
						<CardHeader>
							<CardTitle className="text-2xl">
								{currentExercise.link ? (
									<a
										href={currentExercise.link}
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 hover:underline"
									>
										{currentExercise.name}
										<ExternalLink size={16} className="shrink-0" />
									</a>
								) : (
									currentExercise.name
								)}
							</CardTitle>
							<div className="flex items-center gap-2 text-sm text-blue-600 font-medium">
								{getWeightTypeIcon(currentExercise.weightType, 14)}
								<span>{formatMuscleGroup(currentExercise.group)}</span>
							</div>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-3 gap-4 text-center mb-6">
								<div>
									<div className="flex flex-col items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("sets", 1)}
											className="h-12 w-full p-0"
										>
											<ChevronUp className="!w-8 !h-8" strokeWidth={2} />
										</Button>
										<button
											type="button"
											onClick={() => openEditDialog("sets")}
											className="text-2xl font-bold hover:bg-gray-100 px-2 py-1 rounded transition-colors"
										>
											{exerciseValues[currentExercise.id]?.sets ||
												currentExercise.sets}
										</button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("sets", -1)}
											className="h-12 w-full p-0"
										>
											<ChevronDown className="!w-8 !h-8" strokeWidth={2} />
										</Button>
									</div>
									<div className="text-sm text-gray-600 mt-2">Sets</div>
								</div>
								<div>
									<div className="flex flex-col items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("reps", 1)}
											className="h-12 w-full p-0"
										>
											<ChevronUp className="!w-8 !h-8" strokeWidth={2} />
										</Button>
										<button
											type="button"
											onClick={() => openEditDialog("reps")}
											className="text-2xl font-bold hover:bg-gray-100 px-2 py-1 rounded transition-colors"
										>
											{exerciseValues[currentExercise.id]?.reps ||
												currentExercise.reps}
										</button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("reps", -1)}
											className="h-12 w-full p-0"
										>
											<ChevronDown className="!w-8 !h-8" strokeWidth={2} />
										</Button>
									</div>
									<div className="text-sm text-gray-600 mt-2">Reps</div>
								</div>
								<div>
									<div className="flex flex-col items-center gap-1">
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("weight", 1)}
											className="h-12 w-full p-0"
										>
											<ChevronUp className="!w-8 !h-8" strokeWidth={2} />
										</Button>
										<button
											type="button"
											onClick={() => openEditDialog("weight")}
											className="text-2xl font-bold hover:bg-gray-100 px-2 py-1 rounded transition-colors"
										>
											{exerciseValues[currentExercise.id]?.weight ||
												currentExercise.weight}
											<small className="text-sm font-normal">kg</small>
										</button>
										<Button
											variant="ghost"
											size="sm"
											onClick={() => updateValue("weight", -1)}
											className="h-12 w-full p-0"
										>
											<ChevronDown className="!w-8 !h-8" strokeWidth={2} />
										</Button>
									</div>
									<div className="text-sm text-gray-600 mt-2">Weight</div>
								</div>
							</div>
							{(() => {
								const completedIds = new Set(
									session.completedExercises.map((c) => c.exerciseId),
								);
								const isCompleted = completedIds.has(currentExercise.id);
								// This is the last one to finish only when every *other*
								// exercise is already done — so completing it ends the workout.
								const isFinalRemaining = exercises.every(
									(e) => e.id === currentExercise.id || completedIds.has(e.id),
								);

								return isCompleted ? (
									<Button onClick={updateExercise} className="w-full" size="lg">
										<Edit size={20} />
										Update Exercise
									</Button>
								) : (
									<Button
										onClick={completeExercise}
										className="w-full"
										size="lg"
									>
										<CheckCircle size={20} />
										{isFinalRemaining
											? "Complete Workout"
											: "Complete Exercise"}
									</Button>
								);
							})()}
						</CardContent>
					</Card>

					{/* Exercise Timeline */}
					<Card className="mb-4">
						<CardHeader>
							<CardTitle className="text-lg">Progress</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-3">
								{exercises.map((exercise, index) => {
									const isCompleted = session.completedExercises.some(
										(c) => c.exerciseId === exercise.id,
									);
									const isCurrent = index === session.currentExerciseIndex;
									const isPassed = index < session.currentExerciseIndex;

									if (isCompleted) {
										const completed = session.completedExercises.find(
											(c) => c.exerciseId === exercise.id,
										);
										const duration = completed
											? Math.round(
													(completed.endTime.getTime() -
														completed.startTime.getTime()) /
														1000,
												)
											: 0;
										return (
											<div
												key={`completed-${exercise.id}`}
												className="flex items-center gap-3"
											>
												<div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0"></div>
												<div
													className="flex-1 p-2 bg-green-50 rounded border-l-2 border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
													onClick={() => goToExercise(index)}
													onKeyDown={(e) =>
														e.key === "Enter" && goToExercise(index)
													}
													role="button"
													tabIndex={0}
												>
													<div className="font-medium text-green-800">
														{exercise.name}
													</div>
													<div className="text-xs text-green-600">
														{formatMuscleGroup(exercise.group)} •{" "}
														{completed?.sets}×{completed?.reps} @{" "}
														{completed?.weight}kg • {duration}s
													</div>
												</div>
											</div>
										);
									}

									if (isCurrent) {
										return (
											<div
												key={`current-${exercise.id}`}
												className="flex items-center gap-3"
											>
												<div className="w-4 h-4 bg-blue-500 rounded-full flex-shrink-0 animate-pulse"></div>
												<div
													className="flex-1 p-3 bg-blue-50 rounded border-l-4 border-blue-500 cursor-pointer hover:bg-blue-100 transition-colors"
													onClick={() => goToExercise(index)}
													onKeyDown={(e) =>
														e.key === "Enter" && goToExercise(index)
													}
													role="button"
													tabIndex={0}
												>
													<div className="font-bold text-blue-800">
														{exercise.name}
													</div>
													<div className="text-sm text-blue-600">
														{formatMuscleGroup(exercise.group)} • Current
														Exercise
													</div>
												</div>
											</div>
										);
									}

									if (isPassed) {
										return (
											<div
												key={`passed-${exercise.id}`}
												className="flex items-center gap-3"
											>
												<div className="w-3 h-3 bg-yellow-500 rounded-full flex-shrink-0"></div>
												<div
													className="flex-1 p-2 bg-yellow-50 rounded border-l-2 border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors"
													onClick={() => goToExercise(index)}
													onKeyDown={(e) =>
														e.key === "Enter" && goToExercise(index)
													}
													role="button"
													tabIndex={0}
												>
													<div className="font-medium text-yellow-800">
														{exercise.name}
													</div>
													<div className="text-xs text-yellow-600">
														{formatMuscleGroup(exercise.group)} • Skipped
													</div>
												</div>
											</div>
										);
									}

									return (
										<div
											key={`next-${exercise.id}`}
											className="flex items-center gap-3"
										>
											<div className="w-2 h-2 bg-gray-300 rounded-full flex-shrink-0"></div>
											<div
												className="flex-1 p-2 bg-gray-50 rounded border-l-2 border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors"
												onClick={() => goToExercise(index)}
												onKeyDown={(e) =>
													e.key === "Enter" && goToExercise(index)
												}
												role="button"
												tabIndex={0}
											>
												<div className="font-medium text-gray-700">
													{exercise.name}
												</div>
												<div className="text-xs text-gray-500">
													{formatMuscleGroup(exercise.group)} • {exercise.sets}×
													{exercise.reps} @ {exercise.weight}kg
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</CardContent>
					</Card>
				</>
			)}
		</div>
	);
}
