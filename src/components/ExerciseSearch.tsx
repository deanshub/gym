import { Info, Play, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { ExerciseSearchResult } from "../lib/exercisedb";
import { exerciseDB } from "../lib/exercisedb";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";

interface ExerciseSearchProps {
	onSelectExercise: (exercise: ExerciseSearchResult) => void;
	selectedMuscleGroup?: string;
}

export function ExerciseSearch({
	onSelectExercise,
	selectedMuscleGroup,
}: ExerciseSearchProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const [exercises, setExercises] = useState<ExerciseSearchResult[]>([]);
	const [loading, setLoading] = useState(false);
	const [selectedExercise, setSelectedExercise] =
		useState<ExerciseSearchResult | null>(null);

	const loadPopularExercises = useCallback(async () => {
		setLoading(true);
		try {
			// Load some popular exercises
			const results = await exerciseDB.searchExercises("", 10);
			setExercises(results);
		} catch (error) {
			console.error("Error loading exercises:", error);
		} finally {
			setLoading(false);
		}
	}, []);

	const loadExercisesByMuscleGroup = useCallback(async () => {
		if (!selectedMuscleGroup) return;

		setLoading(true);
		try {
			// Map muscle group to body part for ExerciseDB
			const bodyPartMap: Record<string, string> = {
				CHEST: "chest",
				LATS: "back",
				MIDDLE_TRAPS: "back",
				LOWER_BACK: "back",
				FRONT_SHOULDERS: "shoulders",
				REAR_SHOULDERS: "shoulders",
				BICEPS: "upper arms",
				TRICEPS: "upper arms",
				FOREARMS: "lower arms",
				ABDOMINALS: "waist",
				OBLIQUES: "waist",
				QUADS: "upper legs",
				HAMSTRINGS: "upper legs",
				GLUTES: "upper legs",
				CALVES: "lower legs",
			};

			const bodyPart = bodyPartMap[selectedMuscleGroup];
			if (bodyPart) {
				const results = await exerciseDB.getExercisesByBodyPart(bodyPart);
				setExercises(results);
			}
		} catch (error) {
			console.error("Error loading exercises by muscle group:", error);
		} finally {
			setLoading(false);
		}
	}, [selectedMuscleGroup]);

	useEffect(() => {
		if (selectedMuscleGroup) {
			loadExercisesByMuscleGroup();
		} else {
			loadPopularExercises();
		}
	}, [selectedMuscleGroup, loadExercisesByMuscleGroup, loadPopularExercises]);

	const handleSearch = async () => {
		if (!searchQuery.trim()) {
			loadPopularExercises();
			return;
		}

		setLoading(true);
		try {
			const results = await exerciseDB.searchExercises(searchQuery, 20);
			setExercises(results);
		} catch (error) {
			console.error("Error searching exercises:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleSelectExercise = (exercise: ExerciseSearchResult) => {
		setSelectedExercise(exercise);
		onSelectExercise(exercise);
	};

	return (
		<div className="space-y-4">
			<div className="flex gap-2">
				<div className="relative flex-1">
					<Search
						className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
						size={16}
					/>
					<Input
						placeholder="Search exercises..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSearch()}
						className="pl-10"
					/>
				</div>
				<Button onClick={handleSearch} disabled={loading}>
					Search
				</Button>
			</div>

			{loading && (
				<div className="text-center py-8 text-gray-500">
					Loading exercises...
				</div>
			)}

			<div className="grid gap-4 max-h-96 overflow-y-auto">
				{exercises.map((exercise) => (
					<Card
						key={exercise.id}
						className={`cursor-pointer transition-colors hover:bg-gray-50 ${
							selectedExercise?.id === exercise.id ? "ring-2 ring-blue-500" : ""
						}`}
						onClick={() => handleSelectExercise(exercise)}
					>
						<CardHeader className="pb-2">
							<div className="flex items-start justify-between">
								<CardTitle className="text-sm font-medium">
									{exercise.name}
								</CardTitle>
								<div className="flex gap-1">
									<Badge variant="secondary" className="text-xs">
										{exercise.equipment}
									</Badge>
									<Badge variant="outline" className="text-xs">
										{exercise.target}
									</Badge>
								</div>
							</div>
						</CardHeader>
						<CardContent className="pt-0">
							<div className="flex gap-3">
								<div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
									{exercise.gifUrl ? (
										<img
											src={exercise.gifUrl}
											alt={exercise.name}
											className="w-full h-full object-cover rounded"
											onError={(e) => {
												e.currentTarget.style.display = "none";
												const sibling = e.currentTarget
													.nextElementSibling as HTMLElement;
												if (sibling) sibling.style.display = "flex";
											}}
										/>
									) : null}
									<div
										className="w-full h-full flex items-center justify-center text-gray-400"
										style={{ display: exercise.gifUrl ? "none" : "flex" }}
									>
										<Play size={20} />
									</div>
								</div>
								<div className="flex-1 min-w-0">
									<p className="text-xs text-gray-600 line-clamp-3">
										{exercise.instructions.length > 100
											? `${exercise.instructions.substring(0, 100)}...`
											: exercise.instructions}
									</p>
									{exercise.secondaryMuscles.length > 0 && (
										<div className="mt-2">
											<span className="text-xs text-gray-500">Secondary: </span>
											<span className="text-xs text-gray-600">
												{exercise.secondaryMuscles.join(", ")}
											</span>
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{exercises.length === 0 && !loading && (
				<div className="text-center py-8 text-gray-500">
					<Info size={24} className="mx-auto mb-2" />
					<p>No exercises found. Try a different search term.</p>
				</div>
			)}
		</div>
	);
}
