import { CloudOff, RefreshCw, ServerOff } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getSyncState, subscribeSync } from "../lib/offline-sync";

/**
 * Compact connectivity/pending indicator for the nav bar. Shows nothing when the
 * server is reachable with an empty queue; an "Offline" badge when the device has
 * no network; a "Server unreachable" badge when the device is online but the
 * server isn't responding; and a pending-count badge while queued changes wait to
 * sync.
 */
export function SyncStatus() {
	const { online, serverReachable, pending } = useSyncExternalStore(
		subscribeSync,
		getSyncState,
		getSyncState,
	);

	// No network at all takes precedence over "unreachable".
	if (!online) {
		return (
			<span className="flex items-center gap-1 text-xs text-amber-600">
				<CloudOff size={14} />
				Offline{pending > 0 ? ` · ${pending}` : ""}
			</span>
		);
	}

	// Online, but the server isn't answering — behaves offline but for a different
	// reason, so name it distinctly.
	if (!serverReachable) {
		return (
			<span className="flex items-center gap-1 text-xs text-red-600">
				<ServerOff size={14} />
				Server unreachable{pending > 0 ? ` · ${pending}` : ""}
			</span>
		);
	}

	if (pending > 0) {
		return (
			<span className="flex items-center gap-1 text-xs text-blue-600">
				<RefreshCw size={14} className="animate-spin" />
				Syncing {pending}
			</span>
		);
	}

	return null;
}
