import { prisma } from "../lib/prisma";

export const exercisePerformancesRoutes = {
	// Get all exercise performances with relations
	"/exercise-performances": {
		async GET() {
			const performances = await prisma.exercisePerformance.findMany({
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
			const { workoutId, exerciseId, sets, reps, weight, startTime, endTime } =
				await req.json();

			// Validate foreign keys exist
			const [workout, exercise] = await Promise.all([
				prisma.workout.findUnique({ where: { id: workoutId } }),
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
