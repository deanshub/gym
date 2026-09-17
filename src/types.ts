import type { Exercise, Program } from "@prisma/client";

export type { Exercise, Program };
export type ProgramWithExercises = Program & { exercises: Exercise[] };

/** Exercise fields supplied when creating one (id is generated client-side). */
export type NewExerciseInput = Pick<
	Exercise,
	"name" | "sets" | "reps" | "weight" | "group" | "weightType" | "link"
>;

/** Exercise fields the user can edit from the programs page. */
export type EditableExercise = Pick<
	Exercise,
	"id" | "name" | "sets" | "reps" | "weight" | "group" | "weightType" | "link"
>;

/** HTTP methods that mutate server state and can be queued while offline. */
export type MutationMethod = "POST" | "PUT" | "DELETE";

/**
 * A mutation that could not be sent (device offline / network error) and is
 * persisted to IndexedDB to be replayed, in FIFO order, once back online.
 */
export interface QueuedMutation {
	/** Auto-increment key assigned by IndexedDB; absent until stored. */
	key?: number;
	url: string;
	method: MutationMethod;
	/** JSON body, already includes a client-generated `id` for creates. */
	body?: unknown;
	/** Epoch ms when the mutation was enqueued (used only for ordering/debug). */
	createdAt: number;
}

/** A single persisted SWR cache entry: the request key and its last data. */
export type CacheEntry = [string, { data: unknown }];

/** Snapshot of the sync engine consumed by the UI via useSyncExternalStore. */
export interface SyncState {
	/** `navigator.onLine`: whether the device has network connectivity at all. */
	online: boolean;
	/**
	 * Whether the server is actually responding. Distinct from `online`: the
	 * device can be on a network (`online === true`) while the server is down or
	 * unreachable, in which case requests fail/time out. Set from real fetch
	 * outcomes — any HTTP response means reachable; a network error or timeout
	 * while online means unreachable.
	 */
	serverReachable: boolean;
	/** Number of mutations still waiting to be flushed. */
	pending: number;
}
