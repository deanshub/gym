import { prisma } from "../lib/prisma";

export const workoutsRoutes = {
	// Create workout
	"/workouts": {
		async POST(req: Request) {
			const { id, programId, startTime } = await req.json();

			const workout = await prisma.workout.create({
				data: {
					id,
					programId,
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
