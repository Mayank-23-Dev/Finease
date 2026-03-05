import { useEffect, useState } from "react"
import { applyActionCode, getAuth } from "firebase/auth"
import { useSearchParams, useNavigate } from "react-router-dom"
import Logo from "@/components/ui/Navbar/logo"

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState("Verifying your email...")

  useEffect(() => {
    const oobCode = params.get("oobCode")

    if (!oobCode) {
      setStatus("Invalid verification link.")
      return
    }

    applyActionCode(getAuth(), oobCode)
      .then(() => {
        setStatus("Email verified successfully 🎉")
      })
      .catch(() => {
        setStatus("Verification failed or link expired.")
      })
  }, [])

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6">

      {/* Glow background */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-gray-600/20 blur-3xl" />

      {/* Card */}
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-black/60 backdrop-blur-xl p-10 text-center space-y-6">

        <Logo className="mx-auto h-7" />

        <h1 className="text-2xl font-semibold tracking-tight">
          Email Verification
        </h1>

        <p className="text-muted-foreground text-sm">
          {status}
        </p>

        <button
          onClick={() => navigate("/login")}
          className="w-full rounded-lg bg-white text-black py-2 text-sm font-medium hover:bg-gray-200 transition"
        >
          Go to Login
        </button>

      </div>
    </div>
  )
}