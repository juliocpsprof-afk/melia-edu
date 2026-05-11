export function HeroSection() {
  return (
    <div>
      <div className="mb-6 inline-flex rounded-full border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm text-violet-200">
        Melia EDU • Gestão pedagógica inteligente
      </div>

      <h1 className="max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
        Acompanhe seus alunos com clareza, cuidado e inteligência.
      </h1>

      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
        Uma plataforma moderna para professores registrarem notas, frequência,
        planos de aula, atividades, feedbacks e alertas pedagógicos em um só
        lugar.
      </p>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row">
        <button className="rounded-2xl bg-violet-500 px-6 py-3 font-semibold shadow-lg shadow-violet-500/30 transition hover:bg-violet-400">
          Entrar como professor
        </button>

        <button className="rounded-2xl border border-white/15 px-6 py-3 font-semibold transition hover:bg-white/10">
          Área do aluno
        </button>
      </div>
    </div>
  );
}