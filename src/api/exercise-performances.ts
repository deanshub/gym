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

			const performance = await prisma.exercisePerformance.create({
				data: {
					id,
					workoutId,
					exerciseId,
					sets,
					reps,
					weight,
					startTime: new Date(startTime),
					endTime: new Date(endTime),
				},
			});

			return Response.json(performance);
		},
	},
};
