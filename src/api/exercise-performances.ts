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
			const { workoutId, exerciseId, sets, reps, weight, startTime, endTime } =
				await req.json();

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

			const performance = await prisma.exercisePerformance.create({
				data: {
					id: `performance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					userId,
					workoutId,
					exerciseId,
					sets,
					reps,
					weight,
					startTime: new Date(startTime),
					endTime: new Date(endTime),
				},
			});

			// Update exercise template with performed values
			await prisma.exercise.update({
				where: { id: exerciseId },
				data: { sets, reps, weight },
			});

			return Response.json(performance);
		},
	},
};
