import { ClassCharts } from "../../../../components/ClassCharts";
import { AlertTriangle, GraduationCap, TrendingUp, Users } from "lucide-react";
import { supabase } from "../../../../lib/supabase";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type Student = {
  id: string;
  name: string;
  average: number;
  attendance: number;
  status: string;
};

export default async function TurmaPerfilPage({ params }: Props) {
  const { id } = await params;

  const { data: turma, error } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      description,
      students (
        id,
        name,
        average,
        attendance,
        status
      )
    `)
    .eq("id", id)
    .single();

  if (error || !turma) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Turma não encontrada</h1>
      </div>
    );
  }

  const students = (turma.students as Student[]) ?? [];
  const totalStudents = students.length;

  const average =
    totalStudents > 0
      ? students.reduce((sum, student) => sum + Number(student.average || 0), 0) /
        totalStudents
      : 0;

  const attendance =
    totalStudents > 0
      ? students.reduce(
          (sum, student) => sum + Number(student.attendance || 0),
          0
        ) / totalStudents
      : 0;

  const riskStudents = students.filter(
    (student) =>
      student.status === "Crítico" ||
      student.status === "Atenção" ||
      Number(student.average) < 7 ||
      Number(student.attendance) < 75
  );

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div className="flex items-center gap-5">
          <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
            <GraduationCap size={36} />
          </div>

          <div>
            <h1 className="text-3xl font-bold">{turma.name}</h1>
            <p className="mt-1 text-slate-400">{turma.description}</p>
          </div>
        </div>
      </header>

      <section className="p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard title="Alunos" value={String(totalStudents)} icon={<Users />} />
          <InfoCard title="Média da turma" value={average.toFixed(1)} icon={<TrendingUp />} />
          <InfoCard title="Frequência média" value={`${attendance.toFixed(0)}%`} icon={<GraduationCap />} />
          <InfoCard title="Em atenção" value={String(riskStudents.length)} icon={<AlertTriangle />} />
        </div>

        <ClassCharts students={students} />
        <div className="mt-8 grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">Alunos da turma</h2>

            <div className="mt-6 space-y-4">
              {students.length === 0 ? (
                <p className="text-slate-500">Nenhum aluno vinculado a esta turma.</p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-slate-400">
                        Média {Number(student.average || 0).toFixed(1)} • Frequência{" "}
                        {Number(student.attendance || 0).toFixed(0)}%
                      </p>
                    </div>

                    <StatusBadge status={student.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">Riscos pedagógicos</h2>

            <div className="mt-6 space-y-4">
              {riskStudents.length === 0 ? (
                <p className="text-emerald-300">
                  Nenhum aluno em risco nesta turma.
                </p>
              ) : (
                riskStudents.map((student) => (
                  <div
                    key={student.id}
                    className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4"
                  >
                    <p className="font-semibold text-amber-200">{student.name}</p>
                    <p className="mt-1 text-sm text-amber-100/80">
                      Status: {student.status} • Média{" "}
                      {Number(student.average || 0).toFixed(1)} • Frequência{" "}
                      {Number(student.attendance || 0).toFixed(0)}%
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
        {icon}
      </div>

      <p className="text-slate-400">{title}</p>
      <h3 className="mt-3 text-4xl font-bold">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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
      {status || "Regular"}
    </span>
  );
}