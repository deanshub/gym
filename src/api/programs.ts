import type { $Enums } from "@prisma/client";
import { prisma } from "../lib/prisma";

export const programsRoutes = {
	// Get all programs without exercises
	"/programs": {
		async GET() {
			const programs = await prisma.program.findMany({
				orderBy: { createdAt: "asc" },
			});

			return Response.json(programs);
		},

		async POST(req: Request) {
			const { name } = await req.json();
			const id = `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const program = await prisma.program.create({
				data: { id, name },
			});

			return Response.json(program);
		},
	},

	// Get program details
	"/programs/:id": {
		async GET(req: { params: { id: string } }) {
			const id = req.params.id;
			const program = await prisma.program.findUnique({
				where: { id },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			return Response.json(program);
		},
		async PUT(req: {
			params: { id: string };
			json: () => Promise<{ name: string }>;
		}) {
			const { name } = await req.json();
			const id = req.params.id;

			await prisma.program.update({
				where: { id },
				data: { name },
			});

			return Response.json({ success: true });
		},

		async DELETE(req: { params: { id: string } }) {
			const id = req.params.id;

			await prisma.program.delete({
				where: { id },
			});

			return Response.json({ success: true });
		},
	},

	// Get program exercises
	"/programs/:id/exercises": {
		async GET(req: { params: { id: string } }) {
			const id = req.params.id;
			const exercises = await prisma.exercise.findMany({
				where: { programId: id },
				orderBy: { createdAt: "asc" },
			});

			return Response.json(exercises);
		},

		async POST(req: {
			params: { id: string };
			json: () => Promise<{
				name: string;
				sets: number;
				reps: number;
				weight: number;
				group: string;
				weightType: string;
				// ExerciseDB fields
				exerciseDbId?: string;
				instructions?: string;
				gifUrl?: string;
				imageUrl?: string;
				equipment?: string;
				target?: string;
				bodyPart?: string;
				secondaryMuscles?: string;
			}>;
		}) {
			const {
				name,
				sets,
				reps,
				weight,
				group,
				weightType,
				exerciseDbId,
				instructions,
				gifUrl,
				imageUrl,
				equipment,
				target,
				bodyPart,
				secondaryMuscles,
			} = await req.json();
			const programId = req.params.id;
			const id = `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const exercise = await prisma.exercise.create({
				data: {
					id,
					programId,
					name,
					sets,
					reps,
					weight,
					group: group as $Enums.MuscleGroup,
					weightType: weightType as $Enums.WeightType,
					// ExerciseDB fields
					exerciseDbId,
					instructions,
					gifUrl,
					imageUrl,
					equipment,
					target,
					bodyPart,
					secondaryMuscles,
				},
			});

			return Response.json(exercise);
		},
	},

	// Delete exercise
	"/exercises/:id": {
		async DELETE(req: { params: { id: string } }) {
			const id = req.params.id;

			await prisma.exercise.delete({
				where: { id },
			});

			return Response.json({ success: true });
		},
	},
};
