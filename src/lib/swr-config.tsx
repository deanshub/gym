import type { ReactNode } from "react";
import { SWRConfig } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SWRProvider({ children }: { children: ReactNode }) {
	return (
		<SWRConfig
			value={{
				fetcher,
				suspense: true,
			}}
		>
			{children}
		</SWRConfig>
	);
}
