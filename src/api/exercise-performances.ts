import { getCurrentUserId } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const exercisePerformancesRoutes = {
	// Get all exercise performances with relations
	"/exercise-performances": {
		async GET(req: Request) {
			const userId = getCurrentUserId(req);
			const performances = await prisma.exercisePerformance.findMany({
				where: { userId },
				include: {
					exercise: true,
					workout: {
						include: {
							program: true,
						},
					},
				},
				orderBy: { startTime: "desc" },
			});

			return Response.json(performances);
		},

		async POST(req: Request) {
			const userId = getCurrentUserId(req);
			const {
				id,
				workoutId,
				exerciseId,
				sets,
				reps,
				weight,
				startTime,
				endTime,
			} = await req.json();

			// Validate workout belongs to user and exercise exists
			const [workout, exercise] = await Promise.all([
				prisma.workout.findFirst({ where: { id: workoutId, userId } }),
				prisma.exercise.findUnique({ where: { id: exerciseId } }),
			]);

			if (!workout) {
				return Response.json({ error: "Workout not found" }, { status: 404 });
			}
			if (!exercise) {
				return Response.json({ error: "Exercise not found" }, { status: 404 });
			}

			const performanceId =
				id ??
				`performance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const start = new Date(startTime);
			const end = new Date(endTime);

			// Upsert so replaying a queued offline create is idempotent. Ownership
			// is enforced via the workout check above (workoutId scoped to userId).
			const performance = await prisma.exercisePerformance.upsert({
				where: { id: performanceId },
				create: {
					id: performanceId,
					userId,
					workoutId,
					exerciseId,
					sets,
					reps,
					weight,
					startTime: start,
					endTime: end,
				},
				update: { sets, reps, weight, startTime: start, endTime: end },
			});

			// Update exercise template with performed values
			await prisma.exercise.update({
				where: { id: exerciseId },
				data: { sets, reps, weight },
			});

			return Response.json(performance);
		},
	},

	"/exercise-performances/:performanceId": {
		async PUT(req: Request) {
			const userId = getCurrentUserId(req);
			const url = new URL(req.url);
			const performanceId = url.pathname.split("/").pop();
			const { sets, reps, weight } = await req.json();

			// Update the performance
			const updatedPerformance = await prisma.exercisePerformance.update({
				where: {
					id: performanceId,
					userId,
				},
				data: { sets, reps, weight },
			});

			return Response.json(updatedPerformance);
		},

		async DELETE(req: Request) {
			const userId = getCurrentUserId(req);
			const url = new URL(req.url);
			const performanceId = url.pathname.split("/").pop();

			// deleteMany (scoped by userId) is idempotent: deleting an already-gone
			// row is a no-op rather than a throw, so replaying a queued offline
			// delete never 500s and gets dropped from the queue on replay.
			await prisma.exercisePerformance.deleteMany({
				where: { id: performanceId, userId },
			});

			return Response.json({ success: true });
		},
	},
};
