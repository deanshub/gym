import webpush from "web-push";
import { prisma } from "./prisma";

// Configure web-push with VAPID keys
webpush.setVapidDetails(
	"mailto:your-email@example.com",
	process.env.VAPID_PUBLIC_KEY || "",
	process.env.VAPID_PRIVATE_KEY || "",
);

export async function sendWorkoutReminder(userId: string, message: string) {
	try {
		const subscription = await prisma.pushSubscription.findUnique({
			where: { userId },
		});

		if (!subscription) {
			console.log(`No push subscription found for user ${userId}`);
			return;
		}

		const pushSubscription = {
			endpoint: subscription.endpoint,
			keys: {
				p256dh: subscription.p256dh,
				auth: subscription.auth,
			},
		};

		await webpush.sendNotification(pushSubscription, message);
		console.log(`Push notification sent to user ${userId}`);
	} catch (error) {
		console.error("Error sending push notification:", error);
	}
}

export async function scheduleWorkoutReminders() {
	const now = new Date();
	const currentDay = now
		.toLocaleDateString("en-US", { weekday: "long" })
		.toUpperCase();
	const currentTime = now.toTimeString().slice(0, 5); // HH:MM format

	const reminders = await prisma.reminder.findMany({
		where: {
			time: currentTime,
		},
	});

	for (const reminder of reminders) {
		const reminderDays = reminder.days ? reminder.days.split(",") : [];
		if (reminderDays.includes(currentDay)) {
			await sendWorkoutReminder(reminder.userId, "Time for your workout! 💪");
		}
	}
}
