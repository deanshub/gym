import { BarChart3, Calendar, Dumbbell, Settings, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import {
	NavigationMenu,
	NavigationMenuItem,
	NavigationMenuLink,
	NavigationMenuList,
} from "./ui/navigation-menu";

export function Navigation() {
	return (
		<nav className="w-full bg-white shadow-sm border-b">
			<div className="container mx-auto px-2">
				<div className="flex justify-between items-center h-16">
					<Link
						to="/"
						className="text-xl font-bold bg-red-400 w-12 h-12 rounded-full flex items-center justify-center min-h-[44px] min-w-[44px] mr-2"
					>
						<Zap size={20} className="text-white" />
					</Link>

					<NavigationMenu className="flex">
						<NavigationMenuList className="flex space-x-4">
							<NavigationMenuItem>
								<NavigationMenuLink asChild>
									<Link
										to="/"
										className="p-2 text-gray-700 hover:text-gray-900 min-h-[44px] flex items-center gap-2"
									>
										<Dumbbell size={16} />
										Workout
									</Link>
								</NavigationMenuLink>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<NavigationMenuLink asChild>
									<Link
										to="/programs"
										className="p-2 text-gray-700 hover:text-gray-900 min-h-[44px] flex items-center gap-2"
									>
										<Calendar size={16} />
										Programs
									</Link>
								</NavigationMenuLink>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<NavigationMenuLink asChild>
									<Link
										to="/statistics"
										className="p-2 text-gray-700 hover:text-gray-900 min-h-[44px] flex items-center gap-2"
									>
										<BarChart3 size={16} />
										Statistics
									</Link>
								</NavigationMenuLink>
							</NavigationMenuItem>
							<NavigationMenuItem>
								<NavigationMenuLink asChild>
									<Link
										to="/tools"
										className="p-2 text-gray-700 hover:text-gray-900 min-h-[44px] flex items-center gap-2"
									>
										<Settings size={16} />
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
