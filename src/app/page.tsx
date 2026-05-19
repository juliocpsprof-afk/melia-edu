import Link from "next/link";
import { GraduationCap, ShieldCheck } from "lucide-react";

import { DashboardPreview } from "../components/DashboardPreview";
import { HeroSection } from "../components/HeroSection";
import { Navbar } from "../components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto grid min-h-[calc(100vh-73px)] max-w-7xl grid-cols-1 items-center gap-12 px-6 py-10 lg:grid-cols-2">
        <div>
          <HeroSection />

          {/* BOTÕES */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Link
              href="/aluno"
              className="group rounded-3xl border border-violet-400/30 bg-violet-500/15 p-5 transition hover:-translate-y-1 hover:border-violet-300 hover:bg-violet-500/25"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                <GraduationCap size={26} />
              </div>

              <h2 className="text-xl font-bold">Sou aluno</h2>

              <p className="mt-2 text-sm text-slate-300">
                Acesse suas atividades, notas, mensagens, gamificação e
                entregas.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-violet-300 group-hover:text-white">
                Entrar como aluno →
              </span>
            </Link>

            <Link
              href="/login"
              className="group rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-5 transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-500/20"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/30">
                <ShieldCheck size={26} />
              </div>

              <h2 className="text-xl font-bold">Sou professor</h2>

              <p className="mt-2 text-sm text-slate-300">
                Acesse o painel para gerenciar turmas, alunos, diário, notas e
                interações.
              </p>

              <span className="mt-4 inline-block text-sm font-semibold text-cyan-300 group-hover:text-white">
                Entrar como professor →
              </span>
            </Link>
          </div>

          {/* CRIADOR */}
          <div className="mt-6 rounded-3xl border border-violet-400/20 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm uppercase tracking-[0.25em] text-violet-300">
              Criado por
            </p>

            <p className="mt-2 text-lg font-bold text-white">
              Professor Julio Cezar Pires
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Analista de Sistemas
            </p>
          </div>
        </div>

        <DashboardPreview />
      </section>
    </main>
  );
}