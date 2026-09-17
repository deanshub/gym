import { scheduleUserReminders } from "@/lib/scheduler";
import { getCurrentUserId } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const remindersRoutes = {
	"/reminders": {
		async GET(req: Request) {
			const userId = getCurrentUserId(req);
			const reminders = await prisma.reminder.findFirst({
				where: { userId },
			});

			return Response.json(
				reminders || {
					days: [],
					time: "08:00",
				},
			);
		},

		async POST(req: Request) {
			const userId = getCurrentUserId(req);
			const { days, time } = await req.json();

			const reminder = await prisma.reminder.upsert({
				where: { userId },
				update: { days, time },
				create: {
					id: `reminder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					userId,
					days,
					time,
				},
			});

			await scheduleUserReminders();

			return Response.json(reminder);
		},
	},

	"/reminders/vapid-key": {
		async GET() {
			return Response.json({
				publicKey: process.env.VAPID_PUBLIC_KEY || "",
			});
		},
	},

	"/reminders/subscribe": {
		async POST(req: Request) {
			const userId = getCurrentUserId(req);
			const { subscription } = await req.json();

			await prisma.pushSubscription.upsert({
				where: { userId },
				update: {
					endpoint: subscription.endpoint,
					p256dh: subscription.keys.p256dh,
					auth: subscription.keys.auth,
				},
				create: {
					id: `push_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					userId,
					endpoint: subscription.endpoint,
					p256dh: subscription.keys.p256dh,
					auth: subscription.keys.auth,
				},
			});

			return Response.json({ success: true });
		},
	},
};
