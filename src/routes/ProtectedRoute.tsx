import { Navigate } from "react-router-dom"
import { useAuth } from "@/components/hooks/use-auth"
import { MorphingSquare } from "@/routes/morphingsquare"

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, loggingOut } = useAuth()

  if (loading || loggingOut) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <MorphingSquare message="Checking authentication..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />  // ← changed from /login to /
  }

  return <>{children}</>
}