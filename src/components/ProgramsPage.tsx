import type { Exercise, Program } from "@prisma/client";
import { Dumbbell, Edit, Plus, Target, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import type { ProgramWithExercises } from "../types";
import { EmptyState } from "./EmptyState";
import { ProgramExercises } from "./ProgramExercises";
import type { ProgramFormRef } from "./ProgramForm";
import { ProgramForm } from "./ProgramForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "./ui/dialog";

export function ProgramsPage() {
	const { data: programs = [] } = useSWR<Program[]>("/api/programs");
	const [editingProgram, setEditingProgram] =
		useState<ProgramWithExercises | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<
		"create" | "rename" | "exercises"
	>("create");
	const [wizardStep, setWizardStep] = useState<1 | 2>(1);
	const [hasMuscleSelection, setHasMuscleSelection] = useState(false);
	const formRef = useRef<ProgramFormRef>(null);

	// Ensure programs is always an array
	const safePrograms = Array.isArray(programs) ? programs : [];

	const addProgram = async (name: string) => {
		const response = await fetch("/api/programs", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name }),
		});
		const newProgram = await response.json();
		mutate(
			"/api/programs",
			[...safePrograms, { ...newProgram, exercises: [] }],
			false,
		);
	};

	const updateProgram = async (
		updatedProgram: Omit<Program, "userId" | "createdAt" | "updatedAt">,
	) => {
		await fetch(`/api/programs/${updatedProgram.id}`, {
			method: "PUT",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name: updatedProgram.name }),
		});
		mutate(
			"/api/programs",
			safePrograms.map((p) =>
				p.id === updatedProgram.id ? updatedProgram : p,
			),
			false,
		);
	};

	const deleteProgram = async (id: string) => {
		await fetch(`/api/programs/${id}`, { method: "DELETE" });
		mutate(
			"/api/programs",
			safePrograms.filter((p) => p.id !== id),
			false,
		);
	};

	const addExercise = async (
		programId: string,
		exercise: Pick<
			Exercise,
			"name" | "sets" | "reps" | "weight" | "group" | "weightType"
		>,
	) => {
		const response = await fetch(`/api/programs/${programId}/exercises`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(exercise),
		});
		const newExercise = await response.json();

		// Update exercises cache
		mutate(
			`/api/programs/${programId}/exercises`,
			(currentExercises: Exercise[] = []) => [...currentExercises, newExercise],
			false,
		);

		if (editingProgram?.id === programId) {
			setEditingProgram({
				...editingProgram,
				exercises: [...(editingProgram.exercises || []), newExercise],
			});
		}
	};

	const deleteExercise = async (programId: string, exerciseId: string) => {
		await fetch(`/api/exercises/${exerciseId}`, { method: "DELETE" });

		// Update exercises cache
		mutate(
			`/api/programs/${programId}`,
			(currentExercises: Exercise[] = []) =>
				currentExercises.filter((e) => e.id !== exerciseId),
			false,
		);

		if (editingProgram?.id === programId) {
			setEditingProgram({
				...editingProgram,
				exercises: (editingProgram.exercises || []).filter(
					(e) => e.id !== exerciseId,
				),
			});
		}
	};

	const openDialog = (
		mode: "create" | "rename" | "exercises",
		program?: Program,
	) => {
		setDialogMode(mode);
		if (mode === "exercises" && program) {
			setEditingProgram({ ...program, exercises: [] });
			setWizardStep(1);
			setHasMuscleSelection(false);
		} else {
			setEditingProgram(program ? { ...program, exercises: [] } : null);
		}
		setIsDialogOpen(true);
	};

	return (
		<div className="flex-1 p-4">
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>
							{dialogMode === "create" && "Add Program"}
							{dialogMode === "rename" && "Rename Program"}
							{dialogMode === "exercises" && "Add Exercises"}
						</DialogTitle>
					</DialogHeader>
					<ProgramForm
						ref={formRef}
						program={editingProgram}
						mode={dialogMode}
						wizardStep={wizardStep}
						onSave={(program) => {
							if (dialogMode === "create") {
								addProgram(program.name);
							} else {
								updateProgram(program);
							}
							setIsDialogOpen(false);
							setEditingProgram(null);
						}}
						onAddExercise={(programId, exercise) => {
							addExercise(programId, exercise);
							setWizardStep(1);
							setHasMuscleSelection(false);
						}}
						onMuscleGroupChange={setHasMuscleSelection}
					/>
					{dialogMode === "exercises" && (
						<DialogFooter>
							{wizardStep === 1 ? (
								<div className="flex justify-end w-full">
									<Button
										onClick={() => setWizardStep(2)}
										disabled={!hasMuscleSelection}
									>
										Next: Exercise Details
									</Button>
								</div>
							) : (
								<div className="flex justify-between w-full">
									<Button variant="outline" onClick={() => setWizardStep(1)}>
										Back
									</Button>
									<Button
										onClick={() => {
											formRef.current?.submitExercise();
										}}
									>
										<Dumbbell size={16} />
										Add Exercise
									</Button>
								</div>
							)}
						</DialogFooter>
					)}
				</DialogContent>
			</Dialog>

			{safePrograms.length === 0 ? (
				<EmptyState
					icon={Target}
					title="No Programs Yet"
					description="Create your first workout program to get started with your fitness journey"
					actionLabel="Add Program"
					onAction={() => openDialog("create")}
				/>
			) : (
				<>
					<div className="flex justify-between items-center mb-4">
						<span />
						<Button onClick={() => openDialog("create")}>
							<Plus size={16} />
							Add Program
						</Button>
					</div>

					<div className="grid gap-4">
						{safePrograms.map((program) => (
							<Card key={program.id}>
								<CardHeader>
									<div className="flex justify-between items-center">
										<CardTitle>{program.name}</CardTitle>
										<div className="flex gap-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => openDialog("rename", program)}
											>
												<Edit size={14} />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => openDialog("exercises", program)}
												className="relative w-12 flex items-center justify-center"
											>
												<Plus size={14} />
												<Dumbbell size={14} />
											</Button>
											<Button
												variant="outline"
												size="sm"
												onClick={() => deleteProgram(program.id)}
											>
												<Trash2 size={14} />
											</Button>
										</div>
									</div>
								</CardHeader>
								<CardContent>
									<ProgramExercises
										programId={program.id}
										onDeleteExercise={deleteExercise}
									/>
								</CardContent>
							</Card>
						))}
					</div>
				</>
			)}
		</div>
	);
}
