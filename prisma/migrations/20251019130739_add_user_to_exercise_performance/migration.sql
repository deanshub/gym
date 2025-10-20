/*
  Warnings:

  - Added the required column `user_id` to the `exercise_performances` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_exercise_performances" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "workout_id" TEXT NOT NULL,
    "exercise_id" TEXT NOT NULL,
    "sets" INTEGER NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" REAL NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "exercise_performances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exercise_performances_workout_id_fkey" FOREIGN KEY ("workout_id") REFERENCES "workouts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "exercise_performances_exercise_id_fkey" FOREIGN KEY ("exercise_id") REFERENCES "exercises" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_exercise_performances" ("created_at", "end_time", "exercise_id", "id", "reps", "sets", "start_time", "updated_at", "weight", "workout_id") SELECT "created_at", "end_time", "exercise_id", "id", "reps", "sets", "start_time", "updated_at", "weight", "workout_id" FROM "exercise_performances";
DROP TABLE "exercise_performances";
ALTER TABLE "new_exercise_performances" RENAME TO "exercise_performances";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
