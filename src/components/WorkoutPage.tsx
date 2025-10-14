import { Dumbbell } from "lucide-react";
import { Suspense } from "react";
import useSWR from "swr";
import type { Program } from "../types";
import { EmptyState } from "./EmptyState";
import { ProgramCard } from "./ProgramCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function WorkoutPage() {
	const { data: programs = [] } = useSWR<Program[]>("/api/programs");

	if (programs.length === 0) {
		return (
			<div className="flex-1 p-4">
				<EmptyState
					icon={Dumbbell}
					title="No Programs Available"
					description="Create your first workout program to start training"
					actionLabel="Go to Programs"
					onAction={() => {
						window.location.href = "/programs";
					}}
				/>
			</div>
		);
	}

	return (
		<div className="flex-1 p-4">
			<h2 className="text-xl font-bold mb-4">Start Workout</h2>
			<div className="grid gap-4">
				{programs.map((program) => (
					<Suspense
						key={program.id}
						fallback={
							<Card>
								<CardHeader>
									<CardTitle>{program.name}</CardTitle>
								</CardHeader>
								<CardContent>
									<Button className="w-full" disabled>
										Loading...
									</Button>
								</CardContent>
							</Card>
						}
					>
						<ProgramCard program={program} />
					</Suspense>
				))}
			</div>
		</div>
	);
}
