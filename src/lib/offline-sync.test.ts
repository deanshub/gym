import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import {
	dequeueMutation,
	enqueueMutation,
	queueCount,
	readQueue,
} from "./offline-db";
import { newId, nextRetryDelay, shouldDropAfterReplay } from "./offline-sync";

async function drainQueue() {
	for (const item of await readQueue()) {
		if (item.key !== undefined) await dequeueMutation(item.key);
	}
}

describe("newId", () => {
	it("uses the given prefix and is unique across calls", () => {
		const a = newId("workout");
		const b = newId("workout");
		expect(a.startsWith("workout_")).toBe(true);
		expect(a).not.toBe(b);
	});
});

describe("shouldDropAfterReplay", () => {
	it("drops on success and permanent client errors, keeps on server errors", () => {
		expect(shouldDropAfterReplay(200)).toBe(true);
		expect(shouldDropAfterReplay(204)).toBe(true);
		expect(shouldDropAfterReplay(404)).toBe(true); // already-deleted etc.
		expect(shouldDropAfterReplay(409)).toBe(true);
		expect(shouldDropAfterReplay(403)).toBe(true); // genuinely forbidden — permanent
		expect(shouldDropAfterReplay(500)).toBe(false); // transient — retry later
		expect(shouldDropAfterReplay(503)).toBe(false);
	});

	it("keeps a 401 so an expired session never discards queued writes", () => {
		// A 401 means "log back in", not "this write is invalid" — the mutation
		// must survive the re-login and replay with the new session cookie.
		expect(shouldDropAfterReplay(401)).toBe(false);
	});
});

describe("nextRetryDelay", () => {
	it("doubles the backoff and caps it at five minutes", () => {
		expect(nextRetryDelay(30_000)).toBe(60_000);
		expect(nextRetryDelay(60_000)).toBe(120_000);
		expect(nextRetryDelay(120_000)).toBe(240_000);
		// Past the cap it stays at the 5-minute ceiling.
		expect(nextRetryDelay(240_000)).toBe(300_000);
		expect(nextRetryDelay(300_000)).toBe(300_000);
	});

	it("snaps a sub-base delay up to the first real interval", () => {
		expect(nextRetryDelay(0)).toBe(60_000);
	});
});

describe("mutation queue", () => {
	beforeEach(drainQueue);

	it("enqueues and counts pending mutations", async () => {
		expect(await queueCount()).toBe(0);
		await enqueueMutation({
			url: "/api/weight-logs",
			method: "POST",
			body: { id: "weight_1", weight: 80 },
			createdAt: 1,
		});
		expect(await queueCount()).toBe(1);
	});

	it("reads back in FIFO order and dequeues by key", async () => {
		await enqueueMutation({
			url: "/api/workouts",
			method: "POST",
			body: { id: "workout_1" },
			createdAt: 1,
		});
		await enqueueMutation({
			url: "/api/exercise-performances",
			method: "POST",
			body: { id: "perf_1", workoutId: "workout_1" },
			createdAt: 2,
		});

		const queue = await readQueue();
		expect(queue.map((m) => m.url)).toEqual([
			"/api/workouts",
			"/api/exercise-performances",
		]);

		// The workout create must come before the performance that references it,
		// so replaying FIFO preserves referential integrity.
		expect(queue[0]?.body).toMatchObject({ id: "workout_1" });
		expect(queue[1]?.body).toMatchObject({ workoutId: "workout_1" });

		const firstKey = queue[0]?.key;
		if (firstKey !== undefined) await dequeueMutation(firstKey);
		expect(await queueCount()).toBe(1);
		expect((await readQueue())[0]?.url).toBe("/api/exercise-performances");
	});
});
