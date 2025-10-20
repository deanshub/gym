import { getCurrentUserId } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const weightLogsRoutes = {
	// Get all weight logs
	"/weight-logs": {
		async GET(req: Request) {
			const userId = getCurrentUserId(req);
			const weightLogs = await prisma.weightLog.findMany({
				where: { userId },
				orderBy: { createdAt: "desc" },
			});

			return Response.json(weightLogs);
		},

		async POST(req: Request) {
			const userId = getCurrentUserId(req);
			const { weight } = await req.json();
			const id = `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

			const weightLog = await prisma.weightLog.create({
				data: { id, userId, weight: parseFloat(weight) },
			});

			return Response.json(weightLog);
		},
	},
};
