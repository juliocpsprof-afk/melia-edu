import { DashboardPreview } from "../components/DashboardPreview";
import { HeroSection } from "../components/HeroSection";
import { Navbar } from "../components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-2">
        <HeroSection />
        <DashboardPreview />
      </section>
    </main>
  );
}