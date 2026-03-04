import Logo from "@/components/ui/Navbar/logo";
import { Button } from "@/components/ui/SignUp/button";
import { ChevronLeft, Github } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export function AuthPage() {
const navigate = useNavigate();

const handleGoogleLogin = () => {
// Later you can add real Google OAuth here
navigate("/dashboard");
};

const handleGithubLogin = () => {
// Later you can add real GitHub OAuth here
navigate("/dashboard");
};
	return (
		<div className="relative w-full min-h-screen flex items-center justify-center px-8">

			{/* Back Button */}
			<Button asChild className="absolute top-6 left-6" variant="ghost">
				<Link to="/">
					<ChevronLeft className="mr-2 h-4 w-4" />
					Home
				</Link>
			</Button>

			{/* Auth Card */}
			<div className="w-full max-w-sm space-y-6">
				<Logo className="h-6" />

				<div className="space-y-1">
					<h1 className="text-2xl font-bold tracking-wide">
						Sign In or Join Now!
					</h1>
					<p className="text-muted-foreground text-sm">
						Login or create your account.
					</p>
				</div>

				<div className="space-y-3">
					<Button
						className="w-full cursor-pointer hover:bg-gray-500/10 hover:text-white"
						type="button"
						onClick={handleGoogleLogin}
						>
						<GoogleIcon className="mr-2 h-4 w-4" />
						Continue with Google
					</Button>

					<Button
						className="w-full cursor-pointer hover:bg-gray-500/10 hover:text-white"
						type="button"
						onClick={handleGithubLogin}
						>
						<Github className="mr-2 h-4 w-4" />
						Continue with GitHub
					</Button>
				</div>

				<p className="text-muted-foreground text-xs">
					By clicking continue, you agree to our{" "}
					<a
						className="underline underline-offset-4 hover:text-primary"
						href="#"
					>
						Terms of Service
					</a>{" "}
					and{" "}
					<a
						className="underline underline-offset-4 hover:text-primary"
						href="#"
					>
						Privacy Policy
					</a>
					.
				</p>
			</div>
		</div>
	);
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
	<svg fill="currentColor" viewBox="0 0 24 24" {...props}>
		<path d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.5-1.73 4.41-5.27 4.41-3.17 
    0-5.75-2.63-5.75-5.88s2.58-5.88 5.75-5.88c1.8 0 3.01.77 
    3.7 1.44l2.52-2.44C17.24 3.5 14.94 2.5 12.18 
    2.5 6.99 2.5 2.75 6.74 2.75 12s4.24 9.5 9.43 
    9.5c5.44 0 9.05-3.82 9.05-9.2 0-.62-.07-1.1-.15-1.2z" />
	</svg>
);