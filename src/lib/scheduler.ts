import cron, { type ScheduledTask } from "node-cron";
import { prisma } from "./prisma";
import { sendWorkoutReminder } from "./push-notifications";

const scheduledJobs = new Map<string, ScheduledTask>();

export async function scheduleUserReminders() {
	// Clear existing jobs
	scheduledJobs.forEach((job) => {
		job.destroy();
	});
	scheduledJobs.clear();

	// Get all reminders
	const reminders = await prisma.reminder.findMany();

	for (const reminder of reminders) {
		const reminderDays = reminder.days ? reminder.days.split(",") : [];
		const [hours, minutes] = reminder.time.split(":");

		for (const day of reminderDays) {
			const dayNumber = getDayNumber(day);
			const cronExpression = `${minutes} ${hours} * * ${dayNumber}`;

			const job = cron.schedule(cronExpression, async () => {
				await sendWorkoutReminder(reminder.userId, "Time for your workout! 💪");
			});

			scheduledJobs.set(`${reminder.userId}-${day}`, job);
		}
	}

	console.log(`Scheduled ${scheduledJobs.size} workout reminders`);
}

function getDayNumber(day: string): number {
	const days = {
		SUNDAY: 0,
		MONDAY: 1,
		TUESDAY: 2,
		WEDNESDAY: 3,
		THURSDAY: 4,
		FRIDAY: 5,
		SATURDAY: 6,
	};
	return days[day as keyof typeof days] || 0;
}

// Initial schedule
scheduleUserReminders();

console.log("Workout reminder scheduler started with node-cron");
