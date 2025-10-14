import type { EmptyStateProps } from "../types";
import { Button } from "./ui/button";

export function EmptyState({
	icon: Icon,
	title,
	description,
	actionLabel,
	onAction,
}: EmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center p-8 text-center">
			<Icon size={64} className="text-gray-400 mb-4" />
			<h3 className="text-lg font-semibold mb-2">{title}</h3>
			<p className="text-gray-600 mb-6 max-w-sm">{description}</p>
			<Button onClick={onAction}>
				<Icon size={16} />
				{actionLabel}
			</Button>
		</div>
	);
}
