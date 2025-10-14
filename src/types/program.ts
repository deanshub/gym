export interface Exercise {
	id: string;
	name: string;
	sets: number;
	reps: number;
	weight: number;
}

export interface Program {
	id: string;
	name: string;
	exercises: Exercise[];
}
