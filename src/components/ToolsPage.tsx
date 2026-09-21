import type { $Enums } from "@prisma/client";
import {
	Bell,
	Camera,
	Clock,
	Dumbbell,
	PersonStanding,
	Scale,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import useSWR, { useSWRConfig } from "swr";
import { MuscleAnatomy } from "./MuscleAnatomy";
import { ProgressPhotos } from "./ProgressPhotos";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { WeightUpdate } from "./WeightUpdate";
import { WorkoutHistory } from "./WorkoutHistory";

interface ReminderSettings {
	days: string[];
	time: string;
}

export function ToolsPage() {
	const { mutate } = useSWRConfig();
	const { tool } = useParams<{ tool: string }>();
	const [selectedMuscle, setSelectedMuscle] =
		useState<$Enums.MuscleGroup | null>(null);
	const { data: savedReminders } = useSWR<ReminderSettings>("/api/reminders");
	const [reminders, setReminders] = useState<ReminderSettings>({
		days: [],
		time: "08:00",
	});

	const activeTab = tool || "weight";

	useEffect(() => {
		if (savedReminders) {
			setReminders(savedReminders);
		}
	}, [savedReminders]);

	const handleMuscleSelect = (muscle: $Enums.MuscleGroup) => {
		setSelectedMuscle((prev) => (prev === muscle ? null : muscle));
	};

	const clearSelection = () => {
		setSelectedMuscle(null);
	};

	const handleDayToggle = (day: string) => {
		setReminders((prev) => ({
			...prev,
			days: prev.days.includes(day.toUpperCase())
				? prev.days.filter((d) => d !== day.toUpperCase())
				: [...prev.days, day.toUpperCase()],
		}));
	};

	const handleTimeChange = (time: string) => {
		setReminders((prev) => ({ ...prev, time }));
	};

	const saveReminders = async () => {
		console.log("Save reminders clicked", reminders);
		toast.info("Saving reminders...");

		try {
			console.log("Saving reminder settings...");
			// Save reminder settings
			const response = await fetch("/api/reminders", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(reminders),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}
			console.log("Reminder settings saved");

			// Try to subscribe to push notifications (optional)
			if ("serviceWorker" in navigator && "PushManager" in window) {
				try {
					console.log("Setting up push notifications...");

					// The service worker is registered at app startup (frontend.tsx);
					// fall back to registering it here if it isn't ready yet.
					let registration = await navigator.serviceWorker.getRegistration();
					if (!registration) {
						console.log("No existing registration, registering now...");
						registration = await navigator.serviceWorker.register("/sw.js");
					}
					console.log("Service worker registration:", registration);

					// Get VAPID public key from server
					console.log("Fetching VAPID key...");
					const vapidResponse = await fetch("/api/reminders/vapid-key");
					if (!vapidResponse.ok) {
						throw new Error(`VAPID fetch failed: ${vapidResponse.status}`);
					}
					const { publicKey } = await vapidResponse.json();
					console.log("Got VAPID key:", `${publicKey?.substring(0, 20)}...`);

					console.log("Creating push subscription...");
					const subscription = await registration.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: urlBase64ToUint8Array(publicKey),
					});
					console.log("Push subscription created:", subscription);

					console.log("Saving push subscription...");
					const subscribeResponse = await fetch("/api/reminders/subscribe", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ subscription }),
					});
					if (!subscribeResponse.ok) {
						throw new Error(`Subscribe failed: ${subscribeResponse.status}`);
					}
					console.log("Push subscription saved");
				} catch (pushError) {
					console.warn("Push notifications setup failed:", pushError);
				}
			}

			mutate("/api/reminders");
			console.log("About to show success toast");
			toast.success("Reminders saved successfully!");
		} catch (error) {
			console.error("Failed to save reminders:", error);
			toast.error("Failed to save reminders");
		}
	};

	const urlBase64ToUint8Array = (base64String: string) => {
		const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
		const base64 = (base64String + padding)
			.replace(/-/g, "+")
			.replace(/_/g, "/");

		const rawData = window.atob(base64);
		const outputArray = new Uint8Array(rawData.length);

		for (let i = 0; i < rawData.length; ++i) {
			outputArray[i] = rawData.charCodeAt(i);
		}
		return outputArray;
	};

	const days = [
		{ key: "sunday", label: "Sunday" },
		{ key: "monday", label: "Monday" },
		{ key: "tuesday", label: "Tuesday" },
		{ key: "wednesday", label: "Wednesday" },
		{ key: "thursday", label: "Thursday" },
		{ key: "friday", label: "Friday" },
		{ key: "saturday", label: "Saturday" },
	];

	return (
		<div className="flex-1 p-4 pt-0">
			<Tabs value={activeTab} className="w-full">
				<TabsList className="flex w-full justify-between">
					<TabsTrigger value="weight" asChild>
						<Link to="/tools/weight" className="!px-1">
							<Scale className="!h-4 !w-4" />
							Weight
						</Link>
					</TabsTrigger>
					<TabsTrigger value="anatomy" asChild>
						<Link to="/tools/anatomy" className="!px-1">
							<PersonStanding className="!h-4 !w-4" />
							Anatomy
						</Link>
					</TabsTrigger>
					<TabsTrigger value="photos" asChild>
						<Link to="/tools/photos" className="!px-1">
							<Camera className="!h-4 !w-4" />
							Photos
						</Link>
					</TabsTrigger>
					<TabsTrigger value="reminders" asChild>
						<Link to="/tools/reminders" className="!px-1">
							<Bell className="!h-4 !w-4" />
							Reminders
						</Link>
					</TabsTrigger>
					<TabsTrigger value="workouts" asChild>
						<Link to="/tools/workouts" className="!px-1">
							<Dumbbell className="!h-4 !w-4" />
							Workouts
						</Link>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="weight" className="space-y-4">
					<WeightUpdate />
				</TabsContent>

				<TabsContent value="anatomy" className="space-y-4">
					<div className="flex justify-center">
						<MuscleAnatomy
							selectedMuscles={selectedMuscle ? [selectedMuscle] : []}
							onMuscleSelect={handleMuscleSelect}
							multiSelect={false}
						/>
					</div>

					{selectedMuscle && (
						<div className="p-4 bg-blue-50 rounded-lg">
							<div className="flex justify-between items-center">
								<h3 className="font-semibold text-blue-900">
									Selected Muscle:{" "}
									{selectedMuscle
										.replace(/_/g, " ")
										.replace(/\b\w/g, (l) => l.toUpperCase())}
								</h3>
								<button
									type="button"
									onClick={clearSelection}
									className="text-sm text-blue-600 hover:text-blue-800"
								>
									Clear
								</button>
							</div>
						</div>
					)}
				</TabsContent>

				<TabsContent value="photos" className="space-y-4">
					<ProgressPhotos />
				</TabsContent>

				<TabsContent value="reminders" className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Bell className="h-5 w-5" />
								Workout Reminders
							</CardTitle>
						</CardHeader>
						<CardContent className="space-y-6">
							<div>
								<Label className="text-base font-medium mb-3 block">
									Days of the Week
								</Label>
								<div className="grid grid-cols-1 gap-3">
									{days.map((day) => (
										<div
											key={day.key}
											className="flex items-center justify-between p-3 border rounded-lg"
										>
											<Label htmlFor={day.key} className="font-medium">
												{day.label}
											</Label>
											<Switch
												id={day.key}
												checked={reminders.days.includes(day.key.toUpperCase())}
												onCheckedChange={() => handleDayToggle(day.key)}
											/>
										</div>
									))}
								</div>
							</div>

							<div>
								<Label
									htmlFor="time"
									className="text-base font-medium mb-3 block flex items-center gap-2"
								>
									<Clock className="h-4 w-4" />
									Reminder Time
								</Label>
								<Input
									id="time"
									type="time"
									value={reminders.time}
									onChange={(e) => handleTimeChange(e.target.value)}
									className="w-full"
								/>
							</div>

							<Button className="w-full" onClick={saveReminders}>
								<Bell className="mr-2 h-4 w-4" />
								Save Reminders
							</Button>

							<Button
								variant="outline"
								className="w-full"
								onClick={() => {
									if (Notification.permission === "granted") {
										new Notification("Test Notification", {
											body: "This is a test workout reminder!",
											icon: "/logo-96697w9z.png",
										});
									} else {
										toast.error("Notification permission not granted");
									}
								}}
							>
								Test Notification
							</Button>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="workouts" className="space-y-4">
					<WorkoutHistory />
				</TabsContent>
			</Tabs>
		</div>
	);
}
