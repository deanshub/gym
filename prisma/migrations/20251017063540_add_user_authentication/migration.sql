/*
  Warnings:

  - Added the required column `user_id` to the `programs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `progress_photos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `weight_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `workouts` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_programs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "programs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_programs" ("created_at", "id", "name", "updated_at") SELECT "created_at", "id", "name", "updated_at" FROM "programs";
DROP TABLE "programs";
ALTER TABLE "new_programs" RENAME TO "programs";
CREATE TABLE "new_progress_photos" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "progress_photos_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_progress_photos" ("created_at", "filename", "filepath", "id", "updated_at") SELECT "created_at", "filename", "filepath", "id", "updated_at" FROM "progress_photos";
DROP TABLE "progress_photos";
ALTER TABLE "new_progress_photos" RENAME TO "progress_photos";
CREATE TABLE "new_weight_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "weight_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_weight_logs" ("created_at", "id", "updated_at", "weight") SELECT "created_at", "id", "updated_at", "weight" FROM "weight_logs";
DROP TABLE "weight_logs";
ALTER TABLE "new_weight_logs" RENAME TO "weight_logs";
CREATE TABLE "new_workouts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "start_time" DATETIME NOT NULL,
    "end_time" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workouts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workouts_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_workouts" ("created_at", "end_time", "id", "program_id", "start_time", "updated_at") SELECT "created_at", "end_time", "id", "program_id", "start_time", "updated_at" FROM "workouts";
DROP TABLE "workouts";
ALTER TABLE "new_workouts" RENAME TO "workouts";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
