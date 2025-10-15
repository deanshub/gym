import type { Exercise, Program } from "@prisma/client";

export type { Exercise, Program };
export type ProgramWithExercises = Program & { exercises: Exercise[] };
