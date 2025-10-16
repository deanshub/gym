export interface ExerciseDBExercise {
	id: string;
	name: string;
	bodyPart: string;
	equipment: string;
	gifUrl: string;
	target: string;
	secondaryMuscles: string[];
	instructions: string[];
}

export interface ExerciseSearchResult {
	id: string;
	name: string;
	bodyPart: string;
	equipment: string;
	gifUrl: string;
	target: string;
	secondaryMuscles: string[];
	instructions: string;
}

// Map ExerciseDB targets to our MuscleGroup enum
const TARGET_MAPPING: Record<string, string> = {
	abductors: "GLUTES",
	abs: "ABDOMINALS",
	adductors: "GLUTES",
	biceps: "BICEPS",
	calves: "CALVES",
	"cardiovascular system": "ABDOMINALS",
	delts: "FRONT_SHOULDERS",
	forearms: "FOREARMS",
	glutes: "GLUTES",
	hamstrings: "HAMSTRINGS",
	lats: "LATS",
	"levator scapulae": "NECK",
	pectorals: "CHEST",
	quads: "QUADS",
	"serratus anterior": "CHEST",
	spine: "LOWER_BACK",
	traps: "MIDDLE_TRAPS",
	triceps: "TRICEPS",
	"upper back": "MIDDLE_TRAPS",
};

export class ExerciseDBService {
	async searchExercises(
		query: string,
		limit = 20,
	): Promise<ExerciseSearchResult[]> {
		try {
			// For demo purposes, we'll use a mock response since we don't have API key
			// In production, uncomment the line below:
			// const exercises = await this.fetchFromAPI(`/exercises/name/${encodeURIComponent(query)}?limit=${limit}`);

			// Mock data for demonstration
			const exercises = this.getMockExercises()
				.filter((ex) => ex.name.toLowerCase().includes(query.toLowerCase()))
				.slice(0, limit);

			return exercises.map((exercise) => ({
				id: exercise.id,
				name: exercise.name,
				bodyPart: exercise.bodyPart,
				equipment: exercise.equipment,
				gifUrl: exercise.gifUrl,
				target: exercise.target,
				secondaryMuscles: exercise.secondaryMuscles,
				instructions: exercise.instructions.join(" "),
			}));
		} catch (error) {
			console.error("Error searching exercises:", error);
			return [];
		}
	}

	async getExercisesByBodyPart(
		bodyPart: string,
	): Promise<ExerciseSearchResult[]> {
		try {
			// For demo purposes, we'll use a mock response
			const exercises = this.getMockExercises().filter(
				(ex) => ex.bodyPart.toLowerCase() === bodyPart.toLowerCase(),
			);

			return exercises.map((exercise) => ({
				id: exercise.id,
				name: exercise.name,
				bodyPart: exercise.bodyPart,
				equipment: exercise.equipment,
				gifUrl: exercise.gifUrl,
				target: exercise.target,
				secondaryMuscles: exercise.secondaryMuscles,
				instructions: exercise.instructions.join(" "),
			}));
		} catch (error) {
			console.error("Error fetching exercises by body part:", error);
			return [];
		}
	}

	mapToMuscleGroup(target: string): string | null {
		return TARGET_MAPPING[target.toLowerCase()] || null;
	}

	private getMockExercises(): ExerciseDBExercise[] {
		return [
			{
				id: "0001",
				name: "3/4 sit-up",
				bodyPart: "waist",
				equipment: "body weight",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/sit-up.gif",
				target: "abs",
				secondaryMuscles: ["hip flexors"],
				instructions: [
					"Lie flat on your back with your knees bent and feet flat on the ground.",
					"Place your hands behind your head with your elbows pointing outwards.",
					"Engaging your core, slowly lift your upper body off the ground, curling forward until your torso is at a 45-degree angle.",
					"Pause for a moment at the top, then slowly lower your upper body back down to the starting position.",
					"Repeat for the desired number of repetitions.",
				],
			},
			{
				id: "0002",
				name: "45° side bend",
				bodyPart: "waist",
				equipment: "body weight",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Standing-Side-Bend.gif",
				target: "abs",
				secondaryMuscles: ["obliques"],
				instructions: [
					"Stand with your feet shoulder-width apart and your hands on your hips.",
					"Keeping your back straight, slowly bend to one side, lowering your torso towards the ground.",
					"Hold for a moment, then return to the starting position.",
					"Repeat on the other side.",
				],
			},
			{
				id: "0003",
				name: "air bike",
				bodyPart: "waist",
				equipment: "body weight",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Bicycle-Crunch.gif",
				target: "abs",
				secondaryMuscles: ["hip flexors", "obliques"],
				instructions: [
					"Lie on your back with your hands behind your head and your legs lifted, knees bent at 90 degrees.",
					"Bring your right elbow towards your left knee while straightening your right leg.",
					"Switch sides, bringing your left elbow towards your right knee while straightening your left leg.",
					"Continue alternating sides in a pedaling motion.",
				],
			},
			{
				id: "0004",
				name: "barbell bench press",
				bodyPart: "chest",
				equipment: "barbell",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Bench-Press.gif",
				target: "pectorals",
				secondaryMuscles: ["anterior deltoid", "triceps"],
				instructions: [
					"Lie flat on a bench with your feet firmly planted on the ground.",
					"Grip the barbell with hands slightly wider than shoulder-width apart.",
					"Lower the barbell to your chest in a controlled manner.",
					"Press the barbell back up to the starting position, fully extending your arms.",
					"Repeat for the desired number of repetitions.",
				],
			},
			{
				id: "0005",
				name: "barbell squat",
				bodyPart: "upper legs",
				equipment: "barbell",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/BARBELL-SQUAT.gif",
				target: "quads",
				secondaryMuscles: ["glutes", "hamstrings", "calves"],
				instructions: [
					"Position the barbell on your upper back, resting it on your trapezius muscles.",
					"Stand with your feet shoulder-width apart, toes slightly pointed outward.",
					"Lower your body by bending at the hips and knees, keeping your chest up and back straight.",
					"Descend until your thighs are parallel to the ground or as low as comfortable.",
					"Push through your heels to return to the starting position.",
					"Repeat for the desired number of repetitions.",
				],
			},
			{
				id: "0006",
				name: "push-up",
				bodyPart: "chest",
				equipment: "body weight",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Push-up.gif",
				target: "pectorals",
				secondaryMuscles: ["triceps", "anterior deltoid"],
				instructions: [
					"Start in a plank position with hands slightly wider than shoulder-width apart.",
					"Lower your body until your chest nearly touches the floor.",
					"Push yourself back up to the starting position.",
					"Keep your body in a straight line throughout the movement.",
				],
			},
			{
				id: "0007",
				name: "pull-up",
				bodyPart: "back",
				equipment: "body weight",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Pull-up.gif",
				target: "lats",
				secondaryMuscles: ["biceps", "rhomboids"],
				instructions: [
					"Hang from a pull-up bar with an overhand grip, hands shoulder-width apart.",
					"Pull your body up until your chin clears the bar.",
					"Lower yourself back down with control.",
					"Repeat for the desired number of repetitions.",
				],
			},
			{
				id: "0008",
				name: "dumbbell bicep curl",
				bodyPart: "upper arms",
				equipment: "dumbbell",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Dumbbell-Bicep-Curl.gif",
				target: "biceps",
				secondaryMuscles: ["forearms"],
				instructions: [
					"Stand with feet shoulder-width apart, holding dumbbells at your sides.",
					"Keep your elbows close to your torso and curl the weights up.",
					"Squeeze your biceps at the top of the movement.",
					"Lower the weights back down with control.",
				],
			},
			{
				id: "0009",
				name: "plank",
				bodyPart: "waist",
				equipment: "body weight",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Plank.gif",
				target: "abs",
				secondaryMuscles: ["shoulders", "glutes"],
				instructions: [
					"Start in a push-up position but rest on your forearms instead of your hands.",
					"Keep your body in a straight line from head to heels.",
					"Engage your core and hold the position.",
					"Breathe normally throughout the hold.",
				],
			},
			{
				id: "0010",
				name: "deadlift",
				bodyPart: "back",
				equipment: "barbell",
				gifUrl: "https://fitnessprogramer.com/wp-content/uploads/2021/02/Barbell-Deadlift.gif",
				target: "glutes",
				secondaryMuscles: ["hamstrings", "lats", "traps"],
				instructions: [
					"Stand with feet hip-width apart, barbell over mid-foot.",
					"Bend at hips and knees to grip the bar with hands shoulder-width apart.",
					"Keep your chest up and back straight as you lift the bar.",
					"Drive through your heels and extend your hips and knees.",
					"Lower the bar back down with control.",
				],
			},
		];
	}
}

export const exerciseDB = new ExerciseDBService();
