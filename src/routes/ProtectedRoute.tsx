import { Navigate } from "react-router-dom"
import { useAuth } from "@/components/hooks/useAuth"
import { MorphingSquare } from "@/routes/morphingsquare"

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading } = useAuth()

  // Show loader while Firebase checks authentication
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <MorphingSquare message="Checking authentication..." />
      </div>
    )
  }

  // Redirect if user not logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Allow access if logged in
  return <>{children}</>
}