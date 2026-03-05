import { useState } from "react"
import Logo from "@/components/ui/Navbar/logo"
import { Button } from "@/components/ui/SignUp/button"
import { ChevronLeft } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"

import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/firebase"
import { signInWithGoogle } from "@/firebase/auth"

export function LoginPage() {
  const navigate = useNavigate()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    setError("")

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      )

      const user = userCredential.user

      // Block login if email not verified
      if (!user.emailVerified) {
        setError("Please verify your email before logging in.")
        return
      }

      navigate("/dashboard")
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email.")
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.")
      } else {
        setError("Login failed. Please try again.")
      }
    }
  }

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle()
      navigate("/dashboard")
    } catch {
      setError("Google login failed.")
    }
  }

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-8">

      {/* Back Button */}
      <Button asChild className="absolute top-6 left-6" variant="ghost">
        <Link to="/">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Home
        </Link>
      </Button>

      {/* Card */}
      <div className="w-full max-w-sm space-y-6">

        <Logo className="h-6" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-wide">
            Welcome Back
          </h1>
          <p className="text-muted-foreground text-sm">
            Login to your FinEase account
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3">

          <input
            type="email"
            placeholder="Email"
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <p className="text-red-400 text-xs">{error}</p>
          )}

          <Button className="w-full cursor-pointer !hover:bg-gray-500/10 !hover:text-white"
            type="submit">
            Login
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          className="w-full cursor-pointer hover:bg-gray-500/10 hover:text-white"
          type="button"
          onClick={handleGoogleLogin}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          Continue with Google
        </Button>

        <p className="text-muted-foreground text-xs text-center">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="underline underline-offset-4 hover:text-primary"
          >
            Sign up
          </Link>
        </p>

      </div>
    </div>
  )
}

const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M21.35 11.1h-9.17v2.92h5.27c-.23 1.5-1.73 4.41-5.27 4.41-3.17 
    0-5.75-2.63-5.75-5.88s2.58-5.88 5.75-5.88c1.8 0 3.01.77 
    3.7 1.44l2.52-2.44C17.24 3.5 14.94 2.5 12.18 
    2.5 6.99 2.5 2.75 6.74 2.75 12s4.24 9.5 9.43 
    9.5c5.44 0 9.05-3.82 9.05-9.2 0-.62-.07-1.1-.15-1.2z" />
  </svg>
)