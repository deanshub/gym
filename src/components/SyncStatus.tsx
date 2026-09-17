import { CloudOff, RefreshCw } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getSyncState, subscribeSync } from "../lib/offline-sync";

/**
 * Compact offline/pending indicator for the nav bar. Shows nothing when online
 * with an empty queue; an "Offline" badge when disconnected; and a pending-count
 * badge while queued changes are waiting to sync.
 */
export function SyncStatus() {
	const { online, pending } = useSyncExternalStore(
		subscribeSync,
		getSyncState,
		getSyncState,
	);

	if (online && pending === 0) return null;

	if (!online) {
		return (
			<span className="flex items-center gap-1 text-xs text-amber-600">
				<CloudOff size={14} />
				Offline{pending > 0 ? ` · ${pending}` : ""}
			</span>
		);
	}

	return (
		<span className="flex items-center gap-1 text-xs text-blue-600">
			<RefreshCw size={14} className="animate-spin" />
			Syncing {pending}
		</span>
	);
}
