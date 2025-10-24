import type { Program } from "@prisma/client";
import { Dumbbell, Zap } from "lucide-react";
import { Suspense } from "react";
import useSWR from "swr";
import { ProgramCard } from "./ProgramCard";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function WorkoutPage() {
	const { data: programs = [] } = useSWR<Program[]>("/api/programs");

	if (programs.length === 0) {
		return (
			<div className="flex-1 p-4">
				<div className="text-center py-16">
					<div className="mx-auto w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mb-6">
						<Dumbbell className="h-12 w-12 text-white" />
					</div>
					<h3 className="text-2xl font-semibold text-gray-900 mb-4">
						Ready to Train?
					</h3>
					<p className="text-gray-600 mb-8 max-w-md mx-auto">
						You need workout programs to start training. Create your first
						program and begin your fitness transformation today.
					</p>
					<Button
						size="lg"
						onClick={() => {
							window.location.href = "/programs";
						}}
						className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
					>
						<Zap className="mr-2 h-5 w-5" />
						Create Programs
					</Button>
				</div>
			</div>
		);
	}

	return (
		<div className="flex-1 p-4">
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
