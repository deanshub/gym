import type { $Enums } from "@prisma/client";
import { getCurrentUserId } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const programsRoutes = {
	// Get all programs without exercises
	"/programs": {
		async GET(req: Request) {
			const userId = getCurrentUserId(req);
			const programs = await prisma.program.findMany({
				where: { userId },
				orderBy: { createdAt: "asc" },
			});

			return Response.json(programs);
		},

		async POST(req: Request) {
			const userId = getCurrentUserId(req);
			const { id, name } = await req.json();
			const programId =
				id ??
				`program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Guard against a client id owned by another user before upserting.
			const existing = await prisma.program.findUnique({
				where: { id: programId },
			});
			if (existing && existing.userId !== userId) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}

			// Upsert so replaying a queued offline create is idempotent.
			const program = await prisma.program.upsert({
				where: { id: programId },
				create: { id: programId, name, userId },
				update: { name },
			});

			return Response.json(program);
		},
	},

	// Get program details
	"/programs/:id": {
		async GET(req: Request & { params: { id: string } }) {
			const userId = getCurrentUserId(req);
			const id = req.params.id;
			const program = await prisma.program.findFirst({
				where: { id, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			return Response.json(program);
		},
		async PUT(
			req: Request & {
				params: { id: string };
			},
		) {
			const userId = getCurrentUserId(req);
			const { name } = await req.json();
			const id = req.params.id;

			const program = await prisma.program.findFirst({
				where: { id, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			await prisma.program.update({
				where: { id },
				data: { name },
			});

			return Response.json({ success: true });
		},

		async DELETE(req: Request & { params: { id: string } }) {
			const userId = getCurrentUserId(req);
			const id = req.params.id;

			const program = await prisma.program.findFirst({
				where: { id, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			await prisma.program.delete({
				where: { id },
			});

			return Response.json({ success: true });
		},
	},

	// Get program exercises
	"/programs/:id/exercises": {
		async GET(req: Request & { params: { id: string } }) {
			const userId = getCurrentUserId(req);
			const id = req.params.id;

			// Verify program belongs to user
			const program = await prisma.program.findFirst({
				where: { id, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			const exercises = await prisma.exercise.findMany({
				where: { programId: id },
				orderBy: { createdAt: "asc" },
			});

			return Response.json(exercises);
		},

		async POST(
			req: Request & {
				params: { id: string };
			},
		) {
			const userId = getCurrentUserId(req);
			const { id, name, sets, reps, weight, group, weightType } =
				await req.json();
			const programId = req.params.id;

			// Verify program belongs to user
			const program = await prisma.program.findFirst({
				where: { id: programId, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			const exerciseId =
				id ??
				`exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			// Upsert so replaying a queued offline create is idempotent. Ownership
			// is already enforced via the parent program check above.
			const exercise = await prisma.exercise.upsert({
				where: { id: exerciseId },
				create: {
					id: exerciseId,
					programId,
					name,
					sets,
					reps,
					weight,
					group: group as $Enums.MuscleGroup,
					weightType: weightType as $Enums.WeightType,
				},
				update: {
					name,
					sets,
					reps,
					weight,
					group: group as $Enums.MuscleGroup,
					weightType: weightType as $Enums.WeightType,
				},
			});

			return Response.json(exercise);
		},
	},

	// Delete exercise
	"/exercises/:id": {
		async DELETE(req: Request & { params: { id: string } }) {
			const userId = getCurrentUserId(req);
			const id = req.params.id;

			// Verify exercise belongs to user's program
			const exercise = await prisma.exercise.findFirst({
				where: {
					id,
					program: { userId },
				},
			});

			if (!exercise) {
				return Response.json({ error: "Exercise not found" }, { status: 404 });
			}

			await prisma.exercise.delete({
				where: { id },
			});

			return Response.json({ success: true });
		},
	},
};
