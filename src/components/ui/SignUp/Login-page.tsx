import { useState, useEffect } from "react"
import { Navigate, Link, useNavigate, useSearchParams } from "react-router-dom"
import Logo from "@/components/ui/Navbar/logo"
import { Button } from "@/components/ui/SignUp/button"
import { ChevronLeft } from "lucide-react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/firebase/firebase"
import { signInWithGoogle } from "@/firebase/auth"
import { useAuth } from "@/components/hooks/use-auth"

const REMEMBER_KEY = "finease_remember"

export function LoginPage() {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, loading } = useAuth()

  const [email,      setEmail]      = useState("")
  const [password,   setPassword]   = useState("")
  const [rememberMe, setRememberMe] = useState(false)
  const [error,      setError]      = useState("")
  const [isLoading,  setIsLoading]  = useState(false)

  // ── Load saved credentials on mount ────────────────────────────────────────
  useEffect(() => {
    const emailFromURL = searchParams.get("email")
    if (emailFromURL) {
      setEmail(emailFromURL)
      return
    }

    try {
      const saved = localStorage.getItem(REMEMBER_KEY)
      if (saved) {
        const { email: savedEmail, password: savedPassword } = JSON.parse(saved)
        if (savedEmail)    setEmail(savedEmail)
        if (savedPassword) setPassword(savedPassword)
        setRememberMe(true)
      }
    } catch {
      localStorage.removeItem(REMEMBER_KEY)
    }
  }, [searchParams])

  // ← Redirect AFTER all hooks
  if (!loading && user) return <Navigate to="/dashboard" replace />

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const firebaseUser = userCredential.user
      await firebaseUser.reload()

      if (!firebaseUser.emailVerified) {
        setError("Please verify your email before logging in.")
        setIsLoading(false)
        return
      }

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({ email, password }))
      } else {
        localStorage.removeItem(REMEMBER_KEY)
      }

      // Wait for onAuthStateChanged to confirm, then navigate
      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          unsubscribe()
          navigate("/dashboard", { replace: true })
        }
      })

    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setError("No account found with this email.")
      } else if (error.code === "auth/wrong-password") {
        setError("Incorrect password.")
      } else {
        setError("Login failed. Please try again.")
      }
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError("")
    setIsLoading(true)
    try {
      await signInWithGoogle()

      const unsubscribe = auth.onAuthStateChanged((user) => {
        if (user) {
          unsubscribe()
          navigate("/dashboard", { replace: true })
        }
      })
    } catch {
      setError("Google login failed.")
      setIsLoading(false)
    }
  }

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center px-8">

      <Button asChild className="absolute top-6 left-6" variant="ghost">
        <Link to="/">
          <ChevronLeft className="mr-2 h-4 w-4" />
          Home
        </Link>
      </Button>

      <div className="w-full max-w-sm space-y-6">

        <Logo className="h-6" />

        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-wide">Welcome Back</h1>
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

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-3.5 rounded border-border accent-primary cursor-pointer"
            />
            <label
              htmlFor="remember"
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              Remember me
            </label>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <Button
            className="w-full cursor-pointer hover:bg-gray-500/10 hover:text-white"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
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
          disabled={isLoading}
        >
          <GoogleIcon className="mr-2 h-4 w-4" />
          {isLoading ? "Please wait..." : "Continue with Google"}
        </Button>

        <p className="text-muted-foreground text-xs text-center">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="underline underline-offset-4 hover:text-primary cursor-pointer"
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