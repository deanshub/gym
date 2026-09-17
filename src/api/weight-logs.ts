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
			const { id, weight } = await req.json();
			const logId =
				id ?? `weight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
			const parsedWeight = parseFloat(weight);

			// Guard against a client id owned by another user before upserting.
			const existing = await prisma.weightLog.findUnique({
				where: { id: logId },
			});
			if (existing && existing.userId !== userId) {
				return Response.json({ error: "Forbidden" }, { status: 403 });
			}

			// Upsert so replaying a queued offline create is idempotent.
			const weightLog = await prisma.weightLog.upsert({
				where: { id: logId },
				create: { id: logId, userId, weight: parsedWeight },
				update: { weight: parsedWeight },
			});

			return Response.json(weightLog);
		},
	},
};
