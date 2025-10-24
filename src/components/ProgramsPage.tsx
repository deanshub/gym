import type { Exercise, Program } from "@prisma/client";
import { Dumbbell, Edit, Plus, Target, Trash2, Zap } from "lucide-react";
import { useRef, useState } from "react";
import useSWR, { mutate } from "swr";
import type { ProgramWithExercises } from "../types";
import { ProgramExercises } from "./ProgramExercises";
import type { ProgramFormRef } from "./ProgramForm";
import { ProgramForm } from "./ProgramForm";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader } from "./ui/card";
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
		<div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader className="space-y-3">
						<DialogTitle>
							{dialogMode === "create" && "Add Program"}
							{dialogMode === "rename" && "Rename Program"}
							{dialogMode === "exercises" && "Add Exercises"}
						</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
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
					</div>
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

			{/* Hero Section */}
			{/* <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
				<div className="absolute inset-0 bg-black/20" />
				<div className="relative px-6 py-16">
					<div className="mx-auto max-w-4xl text-center">
						<div className="flex justify-center mb-4">
							<Sparkles className="h-12 w-12 text-yellow-300" />
						</div>
						<h1 className="text-4xl font-bold mb-4">Your Workout Programs</h1>
						<p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
							Build strength, track progress, and achieve your fitness goals
							with personalized workout programs
						</p>
						<Button
							size="lg"
							className="bg-white text-blue-600 hover:bg-blue-50 font-semibold px-8 py-3"
							onClick={() => openDialog("create")}
						>
							<Plus className="mr-2 h-5 w-5" />
							Create New Program
						</Button>
					</div>
				</div>
			</div> */}

			<div className="px-6 py-4">
				<div className="mx-auto max-w-6xl">
					{safePrograms.length === 0 ? (
						<div className="text-center py-16">
							<div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
								<Target className="h-12 w-12 text-white" />
							</div>
							<h3 className="text-2xl font-semibold text-gray-900 mb-4">
								Ready to Start Your Journey?
							</h3>
							<p className="text-gray-600 mb-8 max-w-md mx-auto">
								Create your first workout program and take the first step
								towards your fitness goals. Every champion started with a single
								workout.
							</p>
							<Button
								size="lg"
								onClick={() => openDialog("create")}
								className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
							>
								<Zap className="mr-2 h-5 w-5" />
								Get Started
							</Button>
						</div>
					) : (
						<>
							<div className="flex items-center justify-between pb-4">
								<div>
									<h2 className="text-2xl font-bold text-gray-900">
										My Programs
									</h2>
									<p className="text-gray-600">
										{safePrograms.length} program
										{safePrograms.length !== 1 ? "s" : ""} ready for action
									</p>
								</div>
								<Button
									onClick={() => openDialog("create")}
									className="bg-primary text-primary-foreground hover:bg-primary/90"
								>
									<Plus className="mr-2 h-4 w-4" />
									Add Program
								</Button>
							</div>

							<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
								{safePrograms.map((program) => (
									<Card
										key={program.id}
										className="group hover:shadow-lg transition-all duration-200 border-0 shadow-md bg-white/80 backdrop-blur-sm py-4 gap-0"
									>
										<CardHeader>
											<div className="flex items-start justify-between">
												<div className="flex-1">
													<h3 className="font-semibold text-lg text-gray-900 mb-2">
														{program.name}
													</h3>
												</div>
											</div>
										</CardHeader>
										<CardContent className="pt-0">
											<ProgramExercises
												programId={program.id}
												onDeleteExercise={deleteExercise}
											/>
											<div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
												<Button
													variant="outline"
													size="sm"
													onClick={() => openDialog("rename", program)}
													className="flex-1"
												>
													<Edit className="mr-1 h-4 w-4" />
													Rename
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => openDialog("exercises", program)}
													className="flex-1"
												>
													<Plus className="mr-1 h-4 w-4" />
													Add Exercise
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() => deleteProgram(program.id)}
													className="text-red-600 hover:text-red-700 hover:bg-red-50"
												>
													<Trash2 className="h-4 w-4" />
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						</>
					)}
				</div>
			</div>
		</div>
	);
}
