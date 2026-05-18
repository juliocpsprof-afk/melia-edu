import { ClassComparisonChart } from "../../components/ClassComparisonChart";
import { TopStudentsRanking } from "../../components/TopStudentsRanking";
import { RealtimeDashboardUpdater } from "../../components/RealtimeDashboardUpdater";
import { DashboardCharts } from "../../components/DashboardCharts";
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

type Student = {
  id: string;
  average: number;
  attendance: number;
};

type Observation = {
  id: string;
  content: string;
  category: string;
  created_at: string;
};

export default async function DashboardPage() {
  const { data: students } = await supabase
    .from("students")
.select("id, name, average, attendance");
  const { data: classes } = await supabase
  .from("classes")
  .select(`
    id,
    name,
    students (
      average,
      attendance
    )
  `);

  const { data: observations } = await supabase
    .from("observations")
    .select("id, content, category, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const totalStudents = students?.length ?? 0;
  const totalClasses = classes?.length ?? 0;

  const generalAverage =
    totalStudents > 0
      ? (
          (students as Student[]).reduce(
            (sum, student) => sum + Number(student.average || 0),
            0
          ) / totalStudents
        ).toFixed(1)
      : "0.0";

  const averageAttendance =
    totalStudents > 0
      ? (
          (students as Student[]).reduce(
            (sum, student) => sum + Number(student.attendance || 0),
            0
          ) / totalStudents
        ).toFixed(0)
      : "0";

  const riskStudents =
    (students as Student[] | null)?.filter(
      (student) =>
        Number(student.average) < 7 || Number(student.attendance) < 75
    ).length ?? 0;

  return (
    <>
    <RealtimeDashboardUpdater />
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <p className="mt-1 text-slate-400">
          Visão geral inteligente do Melia EDU.
        </p>
      </header>

      <section className="p-6">
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
          />
        </div>
        <DashboardCharts students={(students as any[]) ?? []} />
        <ClassComparisonChart classes={(classes as any[]) ?? []} />
        <div className="mt-8 grid gap-6 xl:grid-cols-[2fr_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">Indicadores pedagógicos</h2>

            <p className="mt-1 text-slate-400">
              Leitura geral do desempenho atual.
            </p>

            <div className="mt-8 space-y-6">
              <ProgressItem
                title="Média geral"
                value={Number(generalAverage) * 10}
                label={generalAverage}
              />

              <ProgressItem
                title="Frequência média"
                value={Number(averageAttendance)}
                label={`${averageAttendance}%`}
              />

              <ProgressItem
                title="Alunos fora de risco"
                value={
                  totalStudents > 0
                    ? ((totalStudents - riskStudents) / totalStudents) * 100
                    : 0
                }
                label={`${totalStudents - riskStudents}/${totalStudents}`}
              />
            </div>
          </div>
          
          <TopStudentsRanking students={(students as any[]) ?? []} />

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">Últimas observações</h2>

            <div className="mt-6 space-y-4">
              {(observations as Observation[] | null)?.length === 0 ? (
                <p className="text-slate-500">
                  Nenhuma observação registrada.
                </p>
              ) : (
                (observations as Observation[] | null)?.map((observation) => (
                  <div
                    key={observation.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                      {observation.category}
                    </span>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                      {observation.content}
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

function DashboardCard({
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

function ProgressItem({
  title,
  value,
  label,
}: {
  title: string;
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{title}</span>
        <span className="font-semibold text-white">{label}</span>
      </div>

      <div className="h-3 rounded-full bg-slate-800">
        <div
          className="h-3 rounded-full bg-violet-500"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}