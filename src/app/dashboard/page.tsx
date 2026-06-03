import { RealtimeDashboardUpdater } from "../../components/RealtimeDashboardUpdater";
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle,
  ClipboardList,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Student = {
  id: string;
  name: string;
  average: number | null;
  attendance: number | null;
};

type ClassItem = {
  id: string;
  name: string;
  students:
    | {
        average?: number | null;
        attendance?: number | null;
      }[]
    | null;
};

type Observation = {
  id: string;
  content: string;
  category: string;
  created_at: string;
};

type RawSubmission = {
  id: string;
  status: string | null;
  activities:
    | {
        title?: string | null;
      }
    | {
        title?: string | null;
      }[]
    | null;
};

function getActivityTitle(submission: RawSubmission) {
  if (!submission.activities) {
    return "Atividade";
  }

  if (Array.isArray(submission.activities)) {
    return submission.activities[0]?.title || "Atividade";
  }

  return submission.activities.title || "Atividade";
}

function formatDate(date: string) {
  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Data não informada";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

export default async function DashboardPage() {
  const { data: students } = await supabase
    .from("students")
    .select("id, name, average, attendance")
    .order("name", { ascending: true });

  const { data: classes } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      students (
        average,
        attendance
      )
    `)
    .order("name", { ascending: true });

  const { data: observations } = await supabase
    .from("observations")
    .select("id, content, category, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: submissions } = await supabase
    .from("submissions")
    .select(`
      id,
      status,
      activities (
        title
      )
    `)
    .order("created_at", { ascending: false });

  const safeStudents = ((students as Student[] | null) ?? []).map((student) => ({
    id: String(student.id),
    name: String(student.name ?? "Aluno"),
    average: Number(student.average || 0),
    attendance: Number(student.attendance || 0),
  }));

  const safeClasses = ((classes as unknown as ClassItem[] | null) ?? []).map(
    (classItem) => ({
      id: String(classItem.id),
      name: String(classItem.name ?? "Turma"),
      students: classItem.students ?? [],
    })
  );

  const safeObservations = (observations as Observation[] | null) ?? [];

  const safeSubmissions = (submissions as unknown as RawSubmission[] | null) ?? [];

  const totalStudents = safeStudents.length;
  const totalClasses = safeClasses.length;

  const generalAverage =
    totalStudents > 0
      ? (
          safeStudents.reduce(
            (sum, student) => sum + Number(student.average || 0),
            0
          ) / totalStudents
        ).toFixed(1)
      : "0.0";

  const averageAttendance =
    totalStudents > 0
      ? (
          safeStudents.reduce(
            (sum, student) => sum + Number(student.attendance || 0),
            0
          ) / totalStudents
        ).toFixed(0)
      : "0";

  const lowAverageStudents = safeStudents.filter(
    (student) => Number(student.average || 0) < 5
  );

  const lowAttendanceStudents = safeStudents.filter(
    (student) => Number(student.attendance || 0) < 75
  );

  const noGradeStudents = safeStudents.filter(
    (student) => Number(student.average || 0) === 0
  );

  const riskStudents = safeStudents.filter(
    (student) =>
      Number(student.average || 0) < 7 || Number(student.attendance || 0) < 75
  ).length;

  const topStudents = [...safeStudents]
    .filter((student) => Number(student.average || 0) > 0)
    .sort((a, b) => Number(b.average || 0) - Number(a.average || 0))
    .slice(0, 5);

  const attentionStudents = [...safeStudents]
    .filter(
      (student) =>
        Number(student.average || 0) < 5 ||
        Number(student.attendance || 0) < 75
    )
    .sort((a, b) => {
      const scoreA = Number(a.average || 0) + Number(a.attendance || 0) / 10;
      const scoreB = Number(b.average || 0) + Number(b.attendance || 0) / 10;

      return scoreA - scoreB;
    })
    .slice(0, 6);

  const gradeDistribution = {
    critical: safeStudents.filter((student) => Number(student.average || 0) < 5)
      .length,
    warning: safeStudents.filter(
      (student) =>
        Number(student.average || 0) >= 5 && Number(student.average || 0) < 7
    ).length,
    good: safeStudents.filter(
      (student) =>
        Number(student.average || 0) >= 7 && Number(student.average || 0) < 9
    ).length,
    excellent: safeStudents.filter(
      (student) => Number(student.average || 0) >= 9
    ).length,
  };

  const classPerformance = safeClasses.map((classItem) => {
    const classStudents = classItem.students ?? [];
    const total = classStudents.length;

    const average =
      total > 0
        ? classStudents.reduce(
            (sum, student) => sum + Number(student.average || 0),
            0
          ) / total
        : 0;

    const attendance =
      total > 0
        ? classStudents.reduce(
            (sum, student) => sum + Number(student.attendance || 0),
            0
          ) / total
        : 0;

    return {
      id: classItem.id,
      name: classItem.name,
      total,
      average,
      attendance,
    };
  });

  const pendingSubmissions = safeSubmissions.filter(
    (submission) =>
      submission.status !== "Corrigida" &&
      submission.status !== "Corrigido" &&
      submission.status !== "Concluída"
  );

  const pendingByActivity = Array.from(
    pendingSubmissions.reduce((map, submission) => {
      const title = getActivityTitle(submission);

      map.set(title, (map.get(title) ?? 0) + 1);

      return map;
    }, new Map<string, number>())
  )
    .map(([title, total]) => ({
      title,
      total,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <>
      <RealtimeDashboardUpdater />

      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="mt-1 text-slate-400">
          Visão rápida do que precisa de atenção hoje.
        </p>
      </header>

      <section className="space-y-8 p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <DashboardCard
            title="Alunos"
            value={String(totalStudents)}
            icon={<Users />}
          />

          <DashboardCard
            title="Turmas"
            value={String(totalClasses)}
            icon={<GraduationCap />}
          />

          <DashboardCard
            title="Média geral"
            value={generalAverage}
            icon={<TrendingUp />}
          />

          <DashboardCard
            title="Frequência média"
            value={`${averageAttendance}%`}
            icon={<BookOpen />}
          />

          <DashboardCard
            title="Em risco"
            value={String(riskStudents)}
            icon={<AlertTriangle />}
            danger
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-red-500/20 p-3 text-red-300">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Atenção imediata
                </h2>

                <p className="text-sm text-red-200/80">
                  Alunos e indicadores que pedem intervenção.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <AttentionBox
                title="Média abaixo de 5"
                value={String(lowAverageStudents.length)}
              />

              <AttentionBox
                title="Frequência abaixo de 75%"
                value={String(lowAttendanceStudents.length)}
              />

              <AttentionBox
                title="Sem média registrada"
                value={String(noGradeStudents.length)}
              />
            </div>

            <div className="mt-5 space-y-3">
              {attentionStudents.length === 0 ? (
                <p className="rounded-2xl border border-red-500/20 bg-slate-950/30 p-4 text-sm text-red-100">
                  Nenhum aluno em situação crítica no momento.
                </p>
              ) : (
                attentionStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-2xl border border-red-500/20 bg-slate-950/40 p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">{student.name}</p>

                      <p className="mt-1 text-sm text-red-100/80">
                        Média {Number(student.average || 0).toFixed(1)} ·
                        Frequência {Number(student.attendance || 0).toFixed(0)}%
                      </p>
                    </div>

                    <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-200">
                      Atenção
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-500/20 p-3 text-emerald-300">
                <Award size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Destaques
                </h2>

                <p className="text-sm text-emerald-200/80">
                  Maiores médias registradas.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {topStudents.length === 0 ? (
                <p className="rounded-2xl border border-emerald-500/20 bg-slate-950/30 p-4 text-sm text-emerald-100">
                  Nenhuma nota registrada ainda.
                </p>
              ) : (
                topStudents.map((student, index) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white">
                        {index + 1}
                      </div>

                      <div>
                        <p className="font-semibold text-white">
                          {student.name}
                        </p>

                        <p className="mt-1 text-sm text-emerald-100/80">
                          Frequência{" "}
                          {Number(student.attendance || 0).toFixed(0)}%
                        </p>
                      </div>
                    </div>

                    <span className="rounded-2xl bg-emerald-500/20 px-4 py-2 text-lg font-black text-emerald-200">
                      {Number(student.average || 0).toFixed(1)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold text-white">
            Desempenho por turma
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Leitura rápida por grupo, sem gráficos longos.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {classPerformance.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-slate-400">
                Nenhuma turma cadastrada.
              </p>
            ) : (
              classPerformance.map((classItem) => (
                <div
                  key={classItem.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-white">
                        {classItem.name}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {classItem.total} aluno(s)
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        classItem.average < 5
                          ? "bg-red-500/10 text-red-300"
                          : classItem.average < 7
                          ? "bg-yellow-500/10 text-yellow-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      Média {classItem.average.toFixed(1)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <MiniMetric
                      title="Média"
                      value={classItem.average.toFixed(1)}
                    />

                    <MiniMetric
                      title="Frequência"
                      value={`${classItem.attendance.toFixed(0)}%`}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold text-white">
              Distribuição das médias
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Quantidade de alunos por faixa de desempenho.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DistributionCard
                label="0 a 4,9"
                value={String(gradeDistribution.critical)}
                color="red"
              />

              <DistributionCard
                label="5 a 6,9"
                value={String(gradeDistribution.warning)}
                color="yellow"
              />

              <DistributionCard
                label="7 a 8,9"
                value={String(gradeDistribution.good)}
                color="green"
              />

              <DistributionCard
                label="9 a 10"
                value={String(gradeDistribution.excellent)}
                color="blue"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300">
                <ClipboardList size={22} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Pendências de correção
                </h2>

                <p className="text-sm text-slate-400">
                  Entregas que ainda precisam de nota ou revisão.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {pendingByActivity.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                  <CheckCircle size={20} />

                  <p className="font-semibold">
                    Nenhuma pendência de correção.
                  </p>
                </div>
              ) : (
                pendingByActivity.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <p className="line-clamp-1 font-semibold text-white">
                      {item.title}
                    </p>

                    <span className="rounded-2xl bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300">
                      {item.total} entrega(s)
                    </span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold text-white">
            Últimas observações
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Registros recentes do acompanhamento pedagógico.
          </p>

          <div className="mt-6 space-y-3">
            {safeObservations.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-slate-500">
                Nenhuma observação registrada.
              </p>
            ) : (
              safeObservations.map((observation) => (
                <div
                  key={observation.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                      {observation.category}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formatDate(observation.created_at)}
                    </span>
                  </div>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                    {observation.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </section>
    </>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  danger = false,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-3xl border p-6 ${
        danger
          ? "border-red-500/20 bg-red-500/10"
          : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
          danger
            ? "bg-red-500/15 text-red-300"
            : "bg-violet-500/15 text-violet-400"
        }`}
      >
        {icon}
      </div>

      <p className={danger ? "text-red-200/80" : "text-slate-400"}>{title}</p>

      <h3 className="mt-3 text-4xl font-bold text-white">{value}</h3>
    </div>
  );
}

function AttentionBox({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-red-500/20 bg-slate-950/40 p-4">
      <p className="text-sm text-red-100/80">{title}</p>
      <p className="mt-2 text-3xl font-black text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function DistributionCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "red" | "yellow" | "green" | "blue";
}) {
  const styles = {
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${styles[color]}`}>
      <p className="text-sm font-semibold">Média {label}</p>
      <p className="mt-2 text-3xl font-black">{value}</p>
      <p className="mt-1 text-xs opacity-80">aluno(s)</p>
    </div>
  );
}