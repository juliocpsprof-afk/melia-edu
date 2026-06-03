import Link from "next/link";
import { Gamepad2, Link2, Shuffle } from "lucide-react";

export default function InteracoesPage() {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Interações</h1>

        <p className="mt-1 text-slate-400">
          Ferramentas para interagir com os alunos durante as aulas, gerar
          participação, criar dinâmicas e acompanhar respostas em tempo real.
        </p>
      </header>

      <section className="p-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/dashboard/interacoes/sorteios"
            className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-8 transition hover:-translate-y-1 hover:border-violet-500 hover:bg-slate-900 hover:shadow-2xl hover:shadow-violet-950/30"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-400 transition group-hover:scale-105 group-hover:bg-violet-500/25">
              <Shuffle size={42} />
            </div>

            <h2 className="text-2xl font-bold">Sorteios</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Sorteie alunos, monte equipes automaticamente e selecione quem
              participa da dinâmica em sala.
            </p>
          </Link>

          <Link
            href="/dashboard/interacoes/botoes"
            className="group rounded-3xl border border-slate-800 bg-slate-900/40 p-8 transition hover:-translate-y-1 hover:border-cyan-500 hover:bg-slate-900 hover:shadow-2xl hover:shadow-cyan-950/30"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-cyan-500/15 text-cyan-400 transition group-hover:scale-105 group-hover:bg-cyan-500/25">
              <Link2 size={42} />
            </div>

            <h2 className="text-2xl font-bold">Botões do aluno</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Configure acessos rápidos, links externos, ferramentas e recursos
              para aparecerem no portal dos alunos.
            </p>
          </Link>

          <Link
            href="/dashboard/interacoes/quiz"
            className="group relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 p-8 transition hover:-translate-y-1 hover:border-fuchsia-500 hover:bg-slate-900 hover:shadow-2xl hover:shadow-fuchsia-950/30"
          >
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/10 blur-3xl transition group-hover:bg-fuchsia-500/20" />
            <div className="absolute -bottom-16 left-8 h-36 w-36 rounded-full bg-violet-500/10 blur-3xl transition group-hover:bg-violet-500/20" />

            <div className="relative z-10">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-fuchsia-500/15 text-fuchsia-400 transition group-hover:scale-105 group-hover:bg-fuchsia-500/25">
                <Gamepad2 size={42} />
              </div>

              <div className="mb-3 inline-flex rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-fuchsia-200">
                Novo
              </div>

              <h2 className="text-2xl font-bold">Quiz</h2>

              <p className="mt-3 leading-7 text-slate-400">
                Crie quizzes gamificados para a turma, embaralhe alternativas,
                acompanhe respostas e gere notas automáticas.
              </p>
            </div>
          </Link>
        </div>
      </section>
    </>
  );
}