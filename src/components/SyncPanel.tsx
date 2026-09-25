import { format, formatDistanceToNow } from "date-fns";
import {
	AlertTriangle,
	CheckCircle2,
	CloudOff,
	Info,
	RefreshCw,
	ServerOff,
} from "lucide-react";
import { useState, useSyncExternalStore } from "react";
import { getSyncState, subscribeSync, syncNow } from "../lib/offline-sync";
import type { SyncLogEntry } from "../types";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

/** How many log lines to show before the "Show all" toggle. */
const RECENT_LOG = 6;

/** Icon + color for a single log line, keyed by its level. */
function LogIcon({ level }: { level: SyncLogEntry["level"] }) {
	if (level === "success")
		return (
			<CheckCircle2 size={14} className="mt-0.5 shrink-0 text-green-600" />
		);
	if (level === "error")
		return <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />;
	return <Info size={14} className="mt-0.5 shrink-0 text-gray-400" />;
}

/**
 * Manual sync control + activity log for the workout page. The nav's SyncStatus
 * badge can sit at "Syncing…" indefinitely when a queued write keeps failing
 * (e.g. a 5xx poison item blocking the FIFO queue); this panel lets the user
 * force a fresh attempt and shows exactly which request is stuck and why.
 */
export function SyncPanel() {
	const { online, serverReachable, pending, syncing, lastSyncAt, log } =
		useSyncExternalStore(subscribeSync, getSyncState, getSyncState);
	const [showAll, setShowAll] = useState(false);

	const hasError = log.some((e) => e.level === "error");

	// A single status line describing where sync stands right now.
	let statusIcon = <CheckCircle2 size={16} className="text-green-600" />;
	let statusText = "Up to date";
	let statusClass = "text-green-700";
	if (!online) {
		statusIcon = <CloudOff size={16} className="text-amber-600" />;
		statusText = "Offline — changes will sync when you reconnect";
		statusClass = "text-amber-700";
	} else if (!serverReachable) {
		statusIcon = <ServerOff size={16} className="text-red-600" />;
		statusText = "Server unreachable";
		statusClass = "text-red-700";
	} else if (syncing) {
		statusIcon = <RefreshCw size={16} className="animate-spin text-blue-600" />;
		statusText = "Syncing…";
		statusClass = "text-blue-700";
	} else if (pending > 0) {
		statusIcon = <RefreshCw size={16} className="text-blue-600" />;
		statusText = `${pending} change${pending === 1 ? "" : "s"} waiting to sync`;
		statusClass = "text-blue-700";
	} else if (lastSyncAt) {
		statusText = `Synced ${formatDistanceToNow(lastSyncAt, { addSuffix: true })}`;
	}

	const visible = showAll ? log : log.slice(-RECENT_LOG);

	return (
		<Card className="mt-4">
			<CardHeader>
				<div className="flex items-center justify-between gap-3">
					<CardTitle className="text-base">Sync</CardTitle>
					<Button
						variant="outline"
						size="sm"
						onClick={() => void syncNow()}
						disabled={syncing || !online}
						className="h-11"
					>
						<RefreshCw size={16} className={syncing ? "animate-spin" : ""} />
						{syncing ? "Syncing…" : "Sync now"}
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div className={`flex items-center gap-2 text-sm ${statusClass}`}>
					{statusIcon}
					<span>{statusText}</span>
				</div>

				{log.length > 0 && (
					<div className="mt-3">
						<div className="max-h-48 overflow-y-auto rounded-md border bg-gray-50 p-2">
							<ul className="space-y-1">
								{visible.map((entry) => (
									<li
										key={`${entry.time}-${entry.message}`}
										className="flex items-start gap-2 text-xs"
									>
										<LogIcon level={entry.level} />
										<span className="font-mono text-gray-400 tabular-nums">
											{format(entry.time, "HH:mm:ss")}
										</span>
										<span
											className={
												entry.level === "error"
													? "text-red-700"
													: "text-gray-700"
											}
										>
											{entry.message}
										</span>
									</li>
								))}
							</ul>
						</div>
						{log.length > RECENT_LOG && (
							<button
								type="button"
								onClick={() => setShowAll((v) => !v)}
								className="mt-2 text-xs text-blue-600 hover:underline"
							>
								{showAll ? "Show less" : `Show all ${log.length}`}
							</button>
						)}
					</div>
				)}

				{hasError && !syncing && (
					<p className="mt-3 text-xs text-gray-500">
						A change failed to sync. It stays queued and retries automatically —
						tap <span className="font-medium">Sync now</span> to try again, or
						check the log above for the request that's stuck.
					</p>
				)}
			</CardContent>
		</Card>
	);
}
