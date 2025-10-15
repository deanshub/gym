import { PrismaClient, $Enums } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create sample programs
  const aUpperBodyProgram = await prisma.program.create({
    data: {
      id: 'program_a_upper_body',
      name: 'A upper body',
    },
  });

  const bLowerBodyProgram = await prisma.program.create({
    data: {
      id: 'program_b_lower_body',
      name: 'B lower body',
    },
  });

  // Create exercises for Push Day
  await prisma.exercise.createMany({
    data: [
      {
        id: 'exercise_abs_a',
        programId: aUpperBodyProgram.id,
        name: 'Abs',
        group: $Enums.MuscleGroup.ABDOMINALS,
        weightType: $Enums.WeightType.BODYWEIGHT,
        sets: 3,
        reps: 10,
        weight: 0,
      },
      {
        id: 'exercise_shoulder_press',
        programId: aUpperBodyProgram.id,
        name: 'Bench Press',
        group: $Enums.MuscleGroup.CHEST,
        weightType: $Enums.WeightType.TOTAL_WEIGHT,
        sets: 3,
        reps: 8,
        weight: 17.5,
      },
      {
        id: 'exercise_push_ups',
        programId: aUpperBodyProgram.id,
        name: 'Pec Fly',
        group: $Enums.MuscleGroup.CHEST,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 10,
      },
      {
        id: 'exercise_dumbbell_incline_bench_press',
        programId: aUpperBodyProgram.id,
        name: 'Dumbbell Incline Bench Press',
        group: $Enums.MuscleGroup.CHEST,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 10,
      },
      {
        id: 'exercise_bench_dips',
        programId: aUpperBodyProgram.id,
        name: 'Bench Dips',
        group: $Enums.MuscleGroup.TRICEPS,
        weightType: $Enums.WeightType.BODYWEIGHT,
        sets: 3,
        reps: 8,
        weight: 0,
      },
      {
        id: 'exercise_dumbbell_single_arm_row',
        programId: aUpperBodyProgram.id,
        name: 'Dumbbell Single Arm Row',
        group: $Enums.MuscleGroup.LATS,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 4,
        reps: 10,
        weight: 7,
      },
      {
        id: 'exercise_barbell_overhead_press',
        programId: aUpperBodyProgram.id,
        name: 'Barbell Overhead Press',
        group: $Enums.MuscleGroup.FRONT_SHOULDERS,
        weightType: $Enums.WeightType.TOTAL_WEIGHT,
        sets: 3,
        reps: 8,
        weight: 17,
      },
      {
        id: 'exercise_dumbbell_front_raise',
        programId: aUpperBodyProgram.id,
        name: 'Dumbbell Front Raise',
        group: $Enums.MuscleGroup.FRONT_SHOULDERS,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 5,
      },
      {
        id: 'exercise_dumbbell_lateral_raise',
        programId: aUpperBodyProgram.id,
        name: 'Dumbbell Lateral Raise',
        group: $Enums.MuscleGroup.REAR_SHOULDERS,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 5,
      },
    ],
  });

  // Create exercises for Pull Day
  await prisma.exercise.createMany({
    data: [
      {
        id: 'exercise_abs_b',
        programId: bLowerBodyProgram.id,
        name: 'Abs',
        group: $Enums.MuscleGroup.ABDOMINALS,
        weightType: $Enums.WeightType.BODYWEIGHT,
        sets: 3,
        reps: 10,
        weight: 0,
      },
      {
        id: 'exercise_squats',
        programId: bLowerBodyProgram.id,
        name: 'Squats',
        group: $Enums.MuscleGroup.QUADS,
        weightType: $Enums.WeightType.TOTAL_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 22.5,
      },
      {
        id: 'exercise_dumbbell_standing_calf_raises',
        programId: bLowerBodyProgram.id,
        name: 'Dumbbell Standing Calf Raises',
        group: $Enums.MuscleGroup.CALVES,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 20,
        weight: 15,
      },
      {
        id: 'exercise_deadlifts',
        programId: bLowerBodyProgram.id,
        name: 'Deadlifts',
        group: $Enums.MuscleGroup.GLUTES,
        weightType: $Enums.WeightType.TOTAL_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 22.5,
      },
      {
        id: 'exercise_pull_ups',
        programId: bLowerBodyProgram.id,
        name: 'Pull Ups',
        group: $Enums.MuscleGroup.LATS,
        weightType: $Enums.WeightType.BODYWEIGHT,
        sets: 3,
        reps: 5,
        weight: 0,
      },
      {
        id: 'exercise_dumbbell_single_arm_skull_crushers',
        programId: bLowerBodyProgram.id,
        name: 'Single Dumbbell Skull Crushers',
        group: $Enums.MuscleGroup.TRICEPS,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 15,
      },
      {
        id: 'exercise_barbell_curl',
        programId: bLowerBodyProgram.id,
        name: 'Barbell Curl',
        group: $Enums.MuscleGroup.BICEPS,
        weightType: $Enums.WeightType.TOTAL_WEIGHT,
        sets: 3,
        reps: 10,
        weight: 20,
      },
      {
        id: 'exercise_dumbbell_hammer_curl',
        programId: bLowerBodyProgram.id,
        name: 'Dumbbell Hammer Curl',
        group: $Enums.MuscleGroup.BICEPS,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 8,
        weight: 10,
      },
      {
        id: 'exercise_dumbbell_single_arm_preacher_curl',
        programId: bLowerBodyProgram.id,
        name: 'Dumbbell Single Arm Preacher Curl',
        group: $Enums.MuscleGroup.FOREARMS,
        weightType: $Enums.WeightType.SINGLE_WEIGHT,
        sets: 3,
        reps: 8,
        weight: 10,
      },
    ],
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
