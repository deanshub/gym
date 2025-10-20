import type { ReactNode } from "react";
import { SWRConfig } from "swr";

const fetcher = async (url: string) => {
	const res = await fetch(url);

	// If unauthorized, clear localStorage and reload page
	if (res.status === 401) {
		localStorage.removeItem("gym-user");
		window.location.reload();
		return;
	}

	if (!res.ok) {
		throw new Error(`HTTP ${res.status}`);
	}

	return res.json();
};

export function SWRProvider({ children }: { children: ReactNode }) {
	return (
		<SWRConfig
			value={{
				fetcher,
				onError: (error) => {
					console.error("SWR Error:", error);
				},
				shouldRetryOnError: false,
			}}
		>
			{children}
		</SWRConfig>
	);
}
