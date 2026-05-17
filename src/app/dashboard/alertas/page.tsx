import { AlertTriangle, CheckCircle, Siren, TrendingDown } from "lucide-react";
import { supabase } from "../../../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_name: string;
  average: number;
  attendance: number;
  status: string;
};

export default async function AlertasPage() {
  const { data: students, error } = await supabase
    .from("students")
    .select("id, name, class_name, average, attendance, status")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar alertas</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  const allStudents = (students as Student[]) ?? [];

  const criticalStudents = allStudents.filter(
    (student) => student.status === "Crítico"
  );

  const attentionStudents = allStudents.filter(
    (student) => student.status === "Atenção"
  );

  const lowAverageStudents = allStudents.filter(
    (student) => Number(student.average) < 7
  );

  const lowAttendanceStudents = allStudents.filter(
    (student) => Number(student.attendance) < 75
  );

  const alerts = allStudents.filter(
    (student) =>
      student.status === "Crítico" ||
      student.status === "Atenção" ||
      Number(student.average) < 7 ||
      Number(student.attendance) < 75
  );

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Alertas Pedagógicos</h1>

        <p className="mt-1 text-slate-400">
          Acompanhe alunos que precisam de intervenção pedagógica.
        </p>
      </header>

      <section className="p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Críticos"
            value={String(criticalStudents.length)}
            icon={<Siren />}
            color="red"
          />

          <SummaryCard
            title="Em atenção"
            value={String(attentionStudents.length)}
            icon={<AlertTriangle />}
            color="amber"
          />

          <SummaryCard
            title="Média abaixo de 7"
            value={String(lowAverageStudents.length)}
            icon={<TrendingDown />}
            color="red"
          />

          <SummaryCard
            title="Frequência baixa"
            value={String(lowAttendanceStudents.length)}
            icon={<AlertTriangle />}
            color="amber"
          />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold">
            Alunos que precisam de acompanhamento
          </h2>

          <div className="mt-6 space-y-4">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-emerald-300">
                <CheckCircle size={22} />
                Nenhum alerta pedagógico no momento.
              </div>
            ) : (
              alerts.map((student) => (
                <div
                  key={student.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{student.name}</p>
                      <p className="text-sm text-slate-400">
                        {student.class_name || "Sem turma"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Badge status={student.status} />

                      {Number(student.average) < 7 && (
                        <SmallBadge
                          color="red"
                          text={`Média baixa: ${student.average}`}
                        />
                      )}

                      {Number(student.attendance) < 75 && (
                        <SmallBadge
                          color="amber"
                          text={`Frequência baixa: ${student.attendance}%`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm leading-6 text-violet-200">
                    Sugestão: realizar uma conversa individual, verificar
                    dificuldades específicas, propor atividade de recuperação e,
                    se necessário, chamar o responsável para acompanhamento.
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "red" | "amber";
}) {
  const styles =
    color === "red"
      ? "bg-red-500/10 text-red-300"
      : "bg-amber-500/10 text-amber-300";

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${styles}`}
      >
        {icon}
      </div>

      <p className="text-slate-400">{title}</p>
      <h3 className="mt-3 text-4xl font-bold">{value}</h3>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const styles =
    status === "Crítico"
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : status === "Atenção"
        ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
        : status === "Excelente"
          ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
          : "bg-blue-500/10 text-blue-300 border-blue-500/20";

  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${styles}`}>
      {status}
    </span>
  );
}

function SmallBadge({
  color,
  text,
}: {
  color: "red" | "amber";
  text: string;
}) {
  const styles =
    color === "red"
      ? "bg-red-500/10 text-red-300 border-red-500/20"
      : "bg-amber-500/10 text-amber-300 border-amber-500/20";

  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${styles}`}>
      {text}
    </span>
  );
}