"use client";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Navbar/logo";
import { useScroll } from "@/components/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/Navbar/mobile-nav";
import { Link } from "react-router-dom";
import { User } from "lucide-react";

export const navLinks = [
	{
		label: "Features",
		href: "#features",
	},
	{
		label: "Testimonials",
		href: "#testimonials",
	},
	{
		label: "FAQs",
		href: "#FAQS",
	},
	{
		label: "About Us",
		href: "#about",
	},
];

export function Header() {
	const scrolled = useScroll(10);

	return (
		<header
			className={cn("sticky top-0 z-50 w-full border-transparent border-b", {
				"border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50":
					scrolled,
			})}
		>
			<nav className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
				<a
					className="rounded-md p-2 hover:bg-muted dark:hover:bg-muted/50"
					href="#"
				>
					<Logo className="h-4" />
				</a>
				<div className="hidden items-center gap-2 md:flex">
					{navLinks.map((link) => (
						<Button asChild key={link.label} size="sm" variant="ghost">
							<a href={link.href}>{link.label}</a>
						</Button>
					))}
					{/* Login Button */}
					<Button asChild size="sm" variant="ghost">
						<Link to="/login" className="flex items-center gap-1">
							<User size={16} />
							Login
						</Link>
					</Button>
					<Button asChild size="sm">
						<Link to="/signup">Get Started</Link>
					</Button>
				</div>
				<MobileNav />
			</nav>
		</header>
	);
}
