import { Bell } from "lucide-react";

export default function ProfessorDashboard() {
  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold">Dashboard</h2>
            <p className="mt-1 text-slate-400">
              Bem-vindo ao painel do professor.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="rounded-2xl border border-slate-700 bg-slate-900/70 p-3 transition hover:bg-slate-800">
              <Bell size={20} />
            </button>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 font-bold">
                J
              </div>

              <div>
                <p className="font-semibold">Júlio César</p>
                <p className="text-sm text-slate-400">Professor</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard title="Total de alunos" value="128" />
          <DashboardCard title="Turmas ativas" value="6" />
          <DashboardCard title="Atividades pendentes" value="14" />
          <DashboardCard title="Alertas pedagógicos" value="3" />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-2xl font-bold">Desempenho das turmas</h3>
            <p className="mt-1 text-slate-400">
              Média de desempenho semanal
            </p>

            <div className="mt-10 flex h-[280px] items-end gap-4">
              {[40, 75, 55, 90, 70, 85, 60].map((height, index) => (
                <div key={index} className="flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-3xl bg-violet-500"
                    style={{ height: `${height}%` }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h3 className="text-2xl font-bold">Alertas recentes</h3>

            <div className="mt-6 space-y-4">
              <AlertItem student="Maria Eduarda" text="Baixa frequência" />
              <AlertItem student="Carlos Henrique" text="Notas abaixo da média" />
              <AlertItem student="Fernanda Lima" text="Atividades pendentes" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function DashboardCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <p className="text-slate-400">{title}</p>
      <h3 className="mt-4 text-4xl font-bold">{value}</h3>
    </div>
  );
}

function AlertItem({ student, text }: { student: string; text: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="font-semibold">{student}</p>
      <p className="mt-1 text-sm text-slate-400">{text}</p>
    </div>
  );
}