export function DashboardPreview() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Dashboard do professor</p>
          <h2 className="text-2xl font-bold">Turma Informática 01</h2>
        </div>

        <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
          Ativa
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Alunos</p>
          <strong className="mt-2 block text-3xl">32</strong>
        </div>

        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Média geral</p>
          <strong className="mt-2 block text-3xl">8.4</strong>
        </div>

        <div className="rounded-2xl bg-slate-900 p-4">
          <p className="text-sm text-slate-400">Alertas</p>
          <strong className="mt-2 block text-3xl text-amber-300">5</strong>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-slate-900 p-5">
        <p className="mb-4 text-sm font-medium text-slate-300">
          Acompanhamento pedagógico
        </p>

        <div className="space-y-4">
          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Frequência da turma</span>
              <span>91%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800">
              <div className="h-3 w-[91%] rounded-full bg-violet-500" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Atividades entregues</span>
              <span>76%</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800">
              <div className="h-3 w-[76%] rounded-full bg-emerald-500" />
            </div>
          </div>

          <div>
            <div className="mb-2 flex justify-between text-sm">
              <span>Risco de evasão</span>
              <span>Baixo</span>
            </div>
            <div className="h-3 rounded-full bg-slate-800">
              <div className="h-3 w-[22%] rounded-full bg-amber-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}