"use client";

export function DashboardPreview() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
      {/* Glow fundo */}
      <div className="absolute -left-20 top-0 h-60 w-60 rounded-full bg-violet-500/20 blur-3xl" />
      <div className="absolute -right-20 bottom-0 h-60 w-60 rounded-full bg-cyan-500/20 blur-3xl" />

      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">
              Dashboard do professor
            </p>

            <h2 className="text-2xl font-bold">
              Turma Informática 01
            </h2>
          </div>

          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-sm text-emerald-300">
            Ativa
          </span>
        </div>

        {/* Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/5 bg-slate-900/90 p-4">
            <p className="text-sm text-slate-400">
              Alunos
            </p>

            <strong className="mt-2 block text-3xl">
              32
            </strong>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/90 p-4">
            <p className="text-sm text-slate-400">
              Média geral
            </p>

            <strong className="mt-2 block text-3xl text-cyan-300">
              8.4
            </strong>
          </div>

          <div className="rounded-2xl border border-white/5 bg-slate-900/90 p-4">
            <p className="text-sm text-slate-400">
              Alertas
            </p>

            <strong className="mt-2 block text-3xl text-amber-300">
              5
            </strong>
          </div>
        </div>

        {/* Barras animadas */}
        <div className="mt-6 rounded-2xl border border-white/5 bg-slate-900/90 p-5">
          <p className="mb-4 text-sm font-medium text-slate-300">
            Acompanhamento pedagógico
          </p>

          <div className="space-y-5">
            {/* Frequência */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Frequência da turma</span>
                <span className="text-violet-300">91%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="bar-frequency h-3 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-400" />
              </div>
            </div>

            {/* Atividades */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Atividades entregues</span>
                <span className="text-emerald-300">76%</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="bar-activities h-3 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
              </div>
            </div>

            {/* Risco */}
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span>Risco de evasão</span>
                <span className="text-amber-300">Baixo</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div className="bar-risk h-3 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estilos animação */}
      <style jsx>{`
        .bar-frequency {
          width: 91%;
          animation: frequencyMove 4s ease-in-out infinite;
        }

        .bar-activities {
          width: 76%;
          animation: activitiesMove 5s ease-in-out infinite;
        }

        .bar-risk {
          width: 22%;
          animation: riskMove 3.5s ease-in-out infinite;
        }

        @keyframes frequencyMove {
          0% {
            width: 85%;
          }

          50% {
            width: 91%;
          }

          100% {
            width: 87%;
          }
        }

        @keyframes activitiesMove {
          0% {
            width: 68%;
          }

          50% {
            width: 76%;
          }

          100% {
            width: 72%;
          }
        }

        @keyframes riskMove {
          0% {
            width: 18%;
          }

          50% {
            width: 24%;
          }

          100% {
            width: 20%;
          }
        }
      `}</style>
    </div>
  );
}