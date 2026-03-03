import { Header } from "@/components/ui/Navbar/header";
import { Footer } from "@/components/ui/Footer";
import { HeroSection } from "@/components/ui/Hero/hero-section";
import { LogosSection } from "@/components/ui/Hero/logos-section";

import { DisplayCardsDemo } from "../ui/Feature_Section/feature-section";
import Budget from "@/components/ui/Feature_Section/budget";
import { CircularTestimonialsDemo } from "@/components/ui/Testimonials/testomonials";
import GetStarted from "@/components/ui/Get Started/getstarted";
import { FaqsSection } from "@/components/ui/FAQS/faqs";

export default function Page() {
  return (
    <>
      <Header />

      <main className="grow">

        {/* HERO */}
        <section id="home">
          <HeroSection />
          <LogosSection />
        </section>

        {/* FEATURES */}
        <section id="features" className="py-10">
          <div className="place-content-center p-4">
            <DisplayCardsDemo />
            <Budget />
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-10">
          <CircularTestimonialsDemo />
        </section>

        {/* GET STARTED */}
        <section id="getstarted" className="py-10">
          <GetStarted />
        </section>

        {/* FAQS*/}
        <section id="FAQS" className="py-10">
          <FaqsSection />
        </section>

        {/* ABOUT US*/}
        <section id="about" className="py-10">
          <Footer />
        </section>

      </main>
    </>
  );
}