import {
	CircleCheckIcon,
	InfoIcon,
	Loader2Icon,
	OctagonXIcon,
	TriangleAlertIcon,
} from "lucide-react";
import type { ToasterProps } from "sonner";
import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
	return (
		<Sonner
			richColors
			className="toaster group"
			icons={{
				success: <CircleCheckIcon className="size-4" />,
				info: <InfoIcon className="size-4" />,
				warning: <TriangleAlertIcon className="size-4" />,
				error: <OctagonXIcon className="size-4" />,
				loading: <Loader2Icon className="size-4 animate-spin" />,
			}}
			{...props}
		/>
	);
};

export { Toaster };
