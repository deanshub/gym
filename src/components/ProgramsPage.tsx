import type { Exercise, Program } from "@prisma/client";
import { DiamondPlus, Edit, Plus, Target, Trash2 } from "lucide-react";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import type { ProgramWithExercises } from "../types";
import { EmptyState } from "./EmptyState";
import { ProgramExercises } from "./ProgramExercises";
import { ProgramForm } from "./ProgramForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export function ProgramsPage() {
	const { data: programs = [] } = useSWR<Program[]>("/api/programs");
	const [editingProgram, setEditingProgram] =
		useState<ProgramWithExercises | null>(null);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [dialogMode, setDialogMode] = useState<
		"create" | "rename" | "exercises"
	>("create");

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

	const updateProgram = async (updatedProgram: Program) => {
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
		exercise: Pick<Exercise, "name" | "sets" | "reps" | "weight">,
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
						program={editingProgram}
						mode={dialogMode}
						onSave={(program) => {
							if (dialogMode === "create") {
								addProgram(program.name);
							} else {
								updateProgram(program);
							}
							setIsDialogOpen(false);
							setEditingProgram(null);
						}}
						onAddExercise={addExercise}
						onDeleteExercise={deleteExercise}
					/>
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
						<h2 className="text-xl font-bold">Programs</h2>
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
											>
												<DiamondPlus size={14} />
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
