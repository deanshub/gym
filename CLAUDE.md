---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

# Gym tracker

A mobile-first, offline-first PWA for tracking workout programs, exercises,
workouts, exercise performances, weight logs, progress photos, and reminders.
Bun runtime + `Bun.serve` routes, React 19 + react-router-dom v7, SWR for data
fetching, Prisma + SQLite, Tailwind v4, Biome for lint/format.

See `PROJECT_RULES.md` for the authoritative code conventions (all shared types
in `src/types.ts`, Lucide icons on every button, mobile-first 44px tap targets,
date-fns for dates, one component per file, SWR for fetching).

## Commands

- `bun run dev` — dev server with HMR (`prisma generate` + `bun --hot src/index.tsx`).
- `bun run start` — production (`NODE_ENV=production bun src/index.tsx`). Serves via
  on-the-fly HTML bundling — **not** the `dist/` artifact.
- `bun run build` — bundle to `dist/` (also copies `public/` → `dist/`).
- `bun run test` — **vitest** (jsdom). See Testing below.
- `bun run lint` / `bun run lint:fix` — Biome check (fix does not run on `lint`).
- `bun run typecheck` — `tsc --noEmit`.
- `bun run ci` — prisma generate → lint → typecheck → test → build. Run before finishing.

## Architecture

- **Server**: `src/index.tsx` — `Bun.serve` with `routes`; API handlers live in
  `src/api/*`. Auth is a `auth-token=<userId>` cookie; `getCurrentUserId(req)`
  (`src/lib/auth.ts`) throws a 401 `Response`.
- **Client boot**: `src/frontend.tsx` hydrates the SWR cache, starts the sync
  engine, and registers the service worker; `src/index.html` is the entrypoint.
- **Offline-first** (3 layers):
  1. `public/sw.js` — app-shell caching so the app boots with no network. Served
     at `/sw.js` (route in `src/index.tsx`, root scope).
  2. `src/lib/swr-config.tsx` — SWR cache provider backed by IndexedDB
     (`src/lib/offline-db.ts`), so reads survive reload and work offline.
  3. `src/lib/offline-sync.ts` — write queue. Mutations go through `apiMutate`
     (optimistic; queued in IndexedDB when offline) and replay FIFO on reconnect,
     driven by `online`/`visibilitychange` events plus an exponential-backoff
     retry. NOT SW Background Sync (iOS Safari lacks it).
- **Offline data model**: all Prisma ids are client-settable `String @id`;
  create handlers `upsert` on a client-generated id (`newId()`) so queued replays
  are idempotent. Conflict policy: last-write-wins by `updatedAt`. When adding a
  page that reads a per-id endpoint, make sure that endpoint is cached somewhere
  the user visits online first, or derive from an already-cached list.

## Bun runtime

Default to Bun, not Node.js:

- `bun <file>` instead of `node`/`ts-node`; `bun install`; `bun run <script>`.
- Bun auto-loads `.env` — don't use `dotenv`. (`.env` is gitignored; never commit it.)
- APIs: `Bun.serve()` (not express), `bun:sqlite` (not better-sqlite3), `Bun.sql`
  for Postgres, built-in `WebSocket` (not `ws`), `Bun.file` over `node:fs`,
  `` Bun.$`…` `` over execa.
- Frontend: HTML imports with `Bun.serve()` (not vite). HTML files import `.tsx`
  and `<link>` stylesheets directly; Bun bundles them.

## Testing

This project uses **vitest** (jsdom environment), not `bun test`. Run tests with
`bun run test` (which runs `vitest --run`). Use `fake-indexeddb/auto` for tests
that touch the offline layer.

```ts#src/lib/example.test.ts
import { describe, expect, it } from "vitest";

describe("example", () => {
  it("works", () => {
    expect(1).toBe(1);
  });
});
```

For Bun API details, read the docs in `node_modules/bun-types/docs/**.md`.
