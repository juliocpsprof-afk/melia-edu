import type { ReactNode } from "react";
import {
  BookOpen,
  GraduationCap,
  Plus,
  Users,
} from "lucide-react";

export default function TurmasPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">
              Turmas
            </h1>

            <p className="mt-2 text-slate-400">
              Gerencie suas turmas e acompanhe seus alunos.
            </p>
          </div>

          <button className="flex items-center gap-3 rounded-2xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400">
            <Plus size={22} />
            Nova Turma
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl p-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <TurmaCard
            name="Informática Básica"
            students="32 alunos"
            progress={78}
            modules="12 módulos"
          />

          <TurmaCard
            name="Excel Avançado"
            students="24 alunos"
            progress={56}
            modules="8 módulos"
          />

          <TurmaCard
            name="Design Gráfico"
            students="18 alunos"
            progress={91}
            modules="15 módulos"
          />
        </div>
      </section>
    </main>
  );
}

function TurmaCard({
  name,
  students,
  progress,
  modules,
}: {
  name: string;
  students: string;
  progress: number;
  modules: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-violet-500/40">
      <div className="flex items-start justify-between">
        <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
          <GraduationCap size={32} />
        </div>

        <button className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5">
          Abrir
        </button>
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        {name}
      </h2>

      <div className="mt-6 space-y-4">
        <InfoRow
          icon={<Users size={20} />}
          text={students}
        />

        <InfoRow
          icon={<BookOpen size={20} />}
          text={modules}
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Progresso da turma
          </span>

          <span className="font-semibold">
            {progress}%
          </span>
        </div>

        <div className="h-3 rounded-full bg-slate-800">
          <div
            className="h-3 rounded-full bg-violet-500"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="text-violet-400">
        {icon}
      </div>

      <span>{text}</span>
    </div>
  );
}