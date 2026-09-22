import type { Exercise, Program } from "@prisma/client";
import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useSWR from "swr";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface ProgramCardProps {
	program: Program;
}

export function ProgramCard({ program }: ProgramCardProps) {
	const navigate = useNavigate();
	const { data: exercises = [] } = useSWR<Exercise[]>(
		`/api/programs/${program.id}/exercises`,
	);
	const hasExercises = exercises.length > 0;

	// Navigate client-side (not window.location) so starting a workout never
	// re-fetches the app shell from the server. A hard navigation reboots the SPA
	// and white-screens when the server is unreachable; an in-app route change
	// keeps the warm SWR cache and lets ActiveWorkoutPage resolve everything the
	// home screen already cached, working fully offline.
	const startWorkout = () => {
		navigate(`/workout/${program.id}`);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{program.name}</CardTitle>
			</CardHeader>
			<CardContent>
				<Button
					onClick={startWorkout}
					className="w-full"
					disabled={!hasExercises}
				>
					<Play size={16} />
					{hasExercises ? "Start Workout" : "No Exercises"}
				</Button>
			</CardContent>
		</Card>
	);
}
