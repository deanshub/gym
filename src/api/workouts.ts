import { getCurrentUserId } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const workoutsRoutes = {
	// Get all workouts
	"/workouts": {
		async GET(req: Request) {
			const userId = getCurrentUserId(req);
			const workouts = await prisma.workout.findMany({
				where: { userId },
				include: {
					program: true,
					exercisePerformances: {
						include: {
							exercise: true,
						},
					},
				},
				orderBy: { startTime: "desc" },
			});
			return Response.json(workouts);
		},

		async POST(req: Request) {
			const userId = getCurrentUserId(req);
			const { id, programId, startTime } = await req.json();

			// Verify program belongs to user
			const program = await prisma.program.findFirst({
				where: { id: programId, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			const workoutId =
				id ??
				`workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const start = new Date(startTime);

			// Guard against a client id that belongs to another user before we
			// upsert (upsert can only key on the unique id, not scope by userId).
			const existing = await prisma.workout.findUnique({
				where: { id: workoutId },
			});
			if (existing && existing.userId !== userId) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}

			// Upsert (not create) so replaying a queued offline create is idempotent.
			const workout = await prisma.workout.upsert({
				where: { id: workoutId },
				create: { id: workoutId, programId, userId, startTime: start },
				update: { programId, startTime: start },
			});

			return Response.json(workout);
		},
	},

	// Update workout
	"/workouts/:id": {
		async PUT(req: {
			params: { id: string };
			json: () => Promise<{ endTime?: string }>;
		}) {
			const { endTime } = await req.json();
			const id = req.params.id;

			// Check if workout exists
			const existingWorkout = await prisma.workout.findUnique({
				where: { id },
			});
			if (!existingWorkout) {
				return Response.json({ error: "Workout not found" }, { status: 404 });
			}

			const workout = await prisma.workout.update({
				where: { id },
				data: {
					...(endTime && { endTime: new Date(endTime) }),
				},
			});

			return Response.json(workout);
		},

		async DELETE(req: Request & { params: { id: string } }) {
			const userId = getCurrentUserId(req);
			const id = req.params.id;

			// deleteMany (scoped by userId) is idempotent and cascades to the
			// workout's exercise performances (onDelete: Cascade). Replaying a queued
			// offline delete on an already-gone workout is a no-op, not a 500.
			await prisma.workout.deleteMany({ where: { id, userId } });

			return Response.json({ success: true });
		},
	},
};
