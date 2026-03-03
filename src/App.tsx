import Landing from "./components/Pages/Landing";
import { Particles } from "@/components/ui/background-particles";

export default function App() {
  return (
    <div className="relative min-h-screen w-full bg-background text-foreground">
      {/* Background Layer */}
      <div className="fixed inset-0 z-0">
        <Particles
          quantity={100}
          ease={80}
          staticity={60}
          size={0.5}
          color="#ffffff"
        />
      </div>

      {/* Content Layer */}
      <div>
        <Landing />
      </div>

    </div>
  );
}