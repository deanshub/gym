import { BarChart3, Calendar, Dumbbell, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { twMerge } from "tailwind-merge";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "./ui/navigation-menu";

export function Navigation() {
	const location = useLocation();

	const isActive = (path: string) => {
		if (path === "/") {
			return (
				location.pathname === "/" || location.pathname.startsWith("/workout")
			);
		}
		return location.pathname === path;
	};

	const getLinkClassName = (path: string) => {
		return twMerge(
			"py-2 px-4 min-h-[44px] flex items-center gap-2 text-sm flex-1 justify-center",
			isActive(path)
				? "text-primary font-semibold"
				: "text-gray-700 hover:text-gray-900",
		);
	};

	return (
		<nav className="sticky top-0 z-50 w-full bg-white shadow-sm border-b">
			<div className="px-2">
				<NavigationMenu className="w-full max-w-none">
					<NavigationMenuList className="flex w-full">
						<NavigationMenuItem className="flex-1">
							<NavigationMenuLink asChild>
								<Link to="/" className={getLinkClassName("/")}>
									<Dumbbell
										size={16}
										fill={isActive("/") ? "currentColor" : "none"}
									/>
									Workout
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem className="flex-1">
							<NavigationMenuLink asChild>
								<Link to="/programs" className={getLinkClassName("/programs")}>
									<Calendar
										size={16}
										fill={isActive("/programs") ? "currentColor" : "none"}
									/>
									Programs
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem className="flex-1">
							<NavigationMenuLink asChild>
								<Link
									to="/statistics"
									className={getLinkClassName("/statistics")}
								>
									<BarChart3
										size={16}
										fill={isActive("/statistics") ? "currentColor" : "none"}
									/>
									Statistics
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
						<NavigationMenuItem className="flex-1">
							<NavigationMenuLink asChild>
								<Link to="/tools" className={getLinkClassName("/tools")}>
									<Settings
										size={16}
										fill={isActive("/tools") ? "currentColor" : "none"}
									/>
									Tools
								</Link>
							</NavigationMenuLink>
						</NavigationMenuItem>
					</NavigationMenuList>
				</NavigationMenu>
			</div>
		</nav>
	);
}
