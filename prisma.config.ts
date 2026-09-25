import { defineConfig } from "prisma/config";

// Replaces the deprecated `package.json#prisma` block (removed in Prisma 7).
// Bun auto-loads `.env`, so `DATABASE_URL` (referenced via `env()` in
// schema.prisma) is already in the environment — no `dotenv` import needed.
export default defineConfig({
	schema: "prisma/schema.prisma",
	migrations: {
		// Command run by `prisma db seed`. Was `package.json#prisma.seed`.
		seed: "bun run prisma/seed.ts",
	},
});
