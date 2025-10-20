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
			const { programId, startTime } = await req.json();

			// Verify program belongs to user
			const program = await prisma.program.findFirst({
				where: { id: programId, userId },
			});

			if (!program) {
				return Response.json({ error: "Program not found" }, { status: 404 });
			}

			const workout = await prisma.workout.create({
				data: {
					id: `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					programId,
					userId,
					startTime: new Date(startTime),
				},
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
	},
};
