import {
	BarChart3,
	BicepsFlexed,
	Calendar,
	Dumbbell,
	Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
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
		const baseClasses = "p-2 min-h-[44px] flex items-center gap-2";
		const activeClasses = "text-primary font-semibold";
		const inactiveClasses = "text-gray-700 hover:text-gray-900";

		return `${baseClasses} ${isActive(path) ? activeClasses : inactiveClasses}`;
	};

	return (
		<nav className="w-full bg-white shadow-sm border-b">
			<div className="container mx-auto px-2">
				<div className="flex justify-between items-center h-16">
					<Link
						to="/"
						className="text-xl font-bold bg-primary w-10 h-10 rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] mr-2"
					>
						<BicepsFlexed size={24} className="text-white" />
					</Link>

					<NavigationMenu className="flex">
						<NavigationMenuList className="flex space-x-4">
							<NavigationMenuItem>
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
							<NavigationMenuItem>
								<NavigationMenuLink asChild>
									<Link
										to="/programs"
										className={getLinkClassName("/programs")}
									>
										<Calendar
											size={16}
											fill={isActive("/programs") ? "currentColor" : "none"}
										/>
										Programs
									</Link>
								</NavigationMenuLink>
							</NavigationMenuItem>
							<NavigationMenuItem>
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
							<NavigationMenuItem>
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
			</div>
		</nav>
	);
}
