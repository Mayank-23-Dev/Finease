import Landing from "./components/Pages/Landing";
import { AuthPage } from "@/components/ui/SignUp/auth-page";
import { Particles } from "@/components/ui/background-particles";
import { Routes, Route } from "react-router-dom";
import { NotFound } from "@/components/ui/Page_Not_Found/not-found-2";
import DashboardPage from "@/components/Pages/Dashboard";

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

      {/* Pages */}
      <div>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signup" element={<AuthPage />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </div>

    </div>
  );
}