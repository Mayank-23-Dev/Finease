import Landing from "./components/Pages/Landing";
import { AuthPage } from "@/components/ui/SignUp/auth-page";
import { Particles } from "@/components/ui/background-particles";
import { Routes, Route } from "react-router-dom";
import { NotFound } from "@/components/ui/Page_Not_Found/not-found-2";
import DashboardPage from "@/components/Pages/DashboardPage";
import ProtectedRoute from "@/routes/ProtectedRoute";
import VerifyEmail from "@/components/ui/SignUp/verifyEmail";
import { LoginPage } from "@/components/ui/SignUp/Login-page";
import SettingsPage from "@/components/Pages/Settings";
import DashboardHome from "@/components/Pages/DashboardHome";
import TransactionsPage from "@/components/Pages/TransactionsPage";
import BudgetPage from "@/components/Pages/BudgetPage";
import ReportsPage from "@/components/Pages/ReportsPage";
import AIAssistantPage from "@/components/Pages/AIAssistantPage";
import Features from "@/components/ui/Footer_pages/feature";

export default function App() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">

      {/* Background */}
      <div className="fixed inset-0 z-0">
        <Particles
          quantity={100}
          ease={80}
          staticity={60}
          size={0.5}
          color="#ffffff"
        />
      </div>

      <div>
        <Routes>

          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="/verify" element={<VerifyEmail />} />

          {/* Dashboard Layout */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          >
            <Route index             element={<DashboardHome />}     />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="budget"       element={<BudgetPage />}       />
            <Route path="reports"      element={<ReportsPage />}      />
            <Route path="ai-assistant" element={<AIAssistantPage />}  />
            <Route path="settings"     element={<SettingsPage />}     />
          </Route>

          <Route path="/features" element={<Features />} />
          <Route path="*"         element={<NotFound />} />

        </Routes>
      </div>

    </div>
  );
}