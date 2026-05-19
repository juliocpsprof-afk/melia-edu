import Link from "next/link";
import { Link2, Shuffle } from "lucide-react";

export default function InteracoesPage() {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Interações</h1>
        <p className="mt-1 text-slate-400">
          Ferramentas para interagir com os alunos durante as aulas.
        </p>
      </header>

      <section className="p-6">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          <Link
            href="/dashboard/interacoes/sorteios"
            className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 transition hover:border-violet-500 hover:bg-slate-900"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-400">
              <Shuffle size={42} />
            </div>

            <h2 className="text-2xl font-bold">Sorteios</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Sorteie alunos ou monte equipes automaticamente a partir das
              turmas cadastradas.
            </p>
          </Link>

          <Link
            href="/dashboard/interacoes/botoes"
            className="rounded-3xl border border-slate-800 bg-slate-900/40 p-8 transition hover:border-violet-500 hover:bg-slate-900"
          >
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-violet-500/15 text-violet-400">
              <Link2 size={42} />
            </div>

            <h2 className="text-2xl font-bold">Botões do aluno</h2>

            <p className="mt-3 leading-7 text-slate-400">
              Configure até três botões personalizados para aparecerem no portal
              de cada aluno.
            </p>
          </Link>
        </div>
      </section>
    </>
  );
}