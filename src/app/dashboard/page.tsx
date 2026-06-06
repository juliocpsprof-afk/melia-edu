import Link from "next/link";
import type { ReactNode } from "react";

import { RealtimeDashboardUpdater } from "../../components/RealtimeDashboardUpdater";
import {
  AlertTriangle,
  BookOpen,
  Cake,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  ExternalLink,
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
  class_id: string | null;
  class_name: string | null;
  birth_date: string | null;
  archived?: boolean | null;
};

type ClassStudent = {
  id?: string | null;
  name?: string | null;
  average?: number | null;
  attendance?: number | null;
  birth_date?: string | null;
  archived?: boolean | null;
};

type ClassItem = {
  id: string;
  name: string;
  students: ClassStudent[] | null;
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
  grade: number | null;
  activity_id: string | null;
  students:
    | {
        archived?: boolean | null;
      }
    | {
        archived?: boolean | null;
      }[]
    | null;
  activities:
    | {
        id?: string | null;
        title?: string | null;
        due_date?: string | null;
        class_id?: string | null;
        classes?: { name?: string | null } | { name?: string | null }[] | null;
      }
    | {
        id?: string | null;
        title?: string | null;
        due_date?: string | null;
        class_id?: string | null;
        classes?: { name?: string | null } | { name?: string | null }[] | null;
      }[]
    | null;
};

type ClassPerformance = {
  id: string;
  name: string;
  total: number;
  average: number;
  attendance: number;
  riskCount: number;
  noGradeCount: number;
  topStudents: ClassStudent[];
  lowStudents: ClassStudent[];
};

type GradeGroup = {
  key: string;
  label: string;
  color: "red" | "yellow" | "green" | "blue";
  students: Student[];
};

type PendingActivity = {
  id: string;
  title: string;
  className: string;
  dueDate: string | null;
  totalPending: number;
  overdue: number;
  inTime: number;
};

function getActivityRelation(submission: RawSubmission) {
  if (!submission.activities) {
    return null;
  }

  if (Array.isArray(submission.activities)) {
    return submission.activities[0] ?? null;
  }

  return submission.activities;
}

function getSubmissionStudentRelation(submission: RawSubmission) {
  if (!submission.students) {
    return null;
  }

  if (Array.isArray(submission.students)) {
    return submission.students[0] ?? null;
  }

  return submission.students;
}

function isSubmissionFromArchivedStudent(submission: RawSubmission) {
  const student = getSubmissionStudentRelation(submission);

  return Boolean(student?.archived);
}

function getActivityTitle(submission: RawSubmission) {
  const activity = getActivityRelation(submission);

  return activity?.title || "Atividade";
}

function getActivityId(submission: RawSubmission) {
  const activity = getActivityRelation(submission);

  return String(activity?.id || submission.activity_id || "");
}

function getActivityDueDate(submission: RawSubmission) {
  const activity = getActivityRelation(submission);

  return activity?.due_date ? String(activity.due_date) : null;
}

function getActivityClassName(submission: RawSubmission) {
  const activity = getActivityRelation(submission);
  const classes = activity?.classes;

  if (!classes) {
    return "Turma não informada";
  }

  if (Array.isArray(classes)) {
    return classes[0]?.name || "Turma não informada";
  }

  return classes.name || "Turma não informada";
}

function isSubmissionCorrected(submission: RawSubmission) {
  const status = String(submission.status || "").toLowerCase();

  if (
    status.includes("corrigida") ||
    status.includes("corrigido") ||
    status.includes("concluida") ||
    status.includes("concluída") ||
    status.includes("avaliada") ||
    status.includes("avaliado")
  ) {
    return true;
  }

  return submission.grade !== null && submission.grade !== undefined;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Data não informada";
  }

  const parsedDate = new Date(
    `${date}`.includes("T") ? date : `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return "Data não informada";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function formatShortDate(date: string | null) {
  if (!date) {
    return "Sem prazo";
  }

  const parsedDate = new Date(
    `${date}`.includes("T") ? date : `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sem prazo";
  }

  return parsedDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function getNumericAverage(value: number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return numericValue;
}

function getNumericAttendance(value: number | null | undefined) {
  const numericValue = Number(value ?? 0);

  if (Number.isNaN(numericValue)) {
    return 0;
  }

  return numericValue;
}

function getBirthDateParts(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleanValue = value.slice(0, 10);
  const [yearValue, monthValue, dayValue] = cleanValue.split("-");

  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!year || !month || !day) {
    return null;
  }

  return { year, month, day };
}

function isBirthdayToday(value: string | null | undefined) {
  const parts = getBirthDateParts(value);

  if (!parts) {
    return false;
  }

  const today = new Date();

  return today.getMonth() + 1 === parts.month && today.getDate() === parts.day;
}

function isBirthdayInCurrentMonth(value: string | null | undefined) {
  const parts = getBirthDateParts(value);

  if (!parts) {
    return false;
  }

  const today = new Date();

  return today.getMonth() + 1 === parts.month;
}

function getBirthdayDay(value: string | null | undefined) {
  const parts = getBirthDateParts(value);

  return parts?.day ?? 99;
}

function getCurrentMonthName() {
  return new Date().toLocaleDateString("pt-BR", {
    month: "long",
  });
}

function getScoreBadgeClasses(average: number) {
  if (average < 5) {
    return "bg-red-500/10 text-red-300 border-red-500/20";
  }

  if (average < 7) {
    return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
  }

  if (average < 9) {
    return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  }

  return "bg-blue-500/10 text-blue-300 border-blue-500/20";
}

function getPerformanceLabel(average: number) {
  if (average < 5) return "Crítica";
  if (average < 7) return "Atenção";
  if (average < 9) return "Boa";
  return "Excelente";
}

function getStudentName(student: ClassStudent | Student) {
  return String(student.name || "Aluno");
}

function buildPendingActivities(submissions: RawSubmission[]) {
  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const pendingSubmissions = submissions.filter((submission) => {
    return (
      !isSubmissionCorrected(submission) &&
      !isSubmissionFromArchivedStudent(submission)
    );
  });

  const map = new Map<string, PendingActivity>();

  pendingSubmissions.forEach((submission) => {
    const activityId = getActivityId(submission);
    const title = getActivityTitle(submission);
    const dueDate = getActivityDueDate(submission);
    const className = getActivityClassName(submission);

    const key = activityId || `${title}-${className}-${dueDate || "sem-prazo"}`;

    const current =
      map.get(key) ??
      ({
        id: activityId,
        title,
        className,
        dueDate,
        totalPending: 0,
        overdue: 0,
        inTime: 0,
      } satisfies PendingActivity);

    current.totalPending += 1;

    if (dueDate) {
      const dueDateValue = new Date(`${dueDate}T23:59:59`);

      if (!Number.isNaN(dueDateValue.getTime()) && dueDateValue < todayStart) {
        current.overdue += 1;
      } else {
        current.inTime += 1;
      }
    } else {
      current.inTime += 1;
    }

    map.set(key, current);
  });

  return Array.from(map.values()).sort((a, b) => {
    if (b.overdue !== a.overdue) return b.overdue - a.overdue;
    if (b.totalPending !== a.totalPending) {
      return b.totalPending - a.totalPending;
    }

    return a.title.localeCompare(b.title, "pt-BR");
  });
}

export default async function DashboardPage() {
  const { data: students } = await supabase
    .from("students")
    .select("id, name, average, attendance, class_id, class_name, birth_date, archived")
    .eq("archived", false)
    .order("name", { ascending: true });

  const { data: classes } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      students (
        id,
        name,
        average,
        attendance,
        birth_date,
        archived
      )
    `
    )
    .order("name", { ascending: true });

  const { data: observations } = await supabase
    .from("observations")
    .select("id, content, category, created_at")
    .order("created_at", { ascending: false })
    .limit(6);

  const { data: submissions } = await supabase
    .from("submissions")
    .select(
      `
      id,
      status,
      grade,
      activity_id,
      students (
        archived
      ),
      activities (
        id,
        title,
        due_date,
        class_id,
        classes (
          name
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  const safeStudents = ((students as Student[] | null) ?? []).map((student) => ({
    id: String(student.id),
    name: String(student.name ?? "Aluno"),
    average: Number(student.average || 0),
    attendance: Number(student.attendance || 0),
    class_id: student.class_id ? String(student.class_id) : null,
    class_name: student.class_name ? String(student.class_name) : null,
    birth_date: student.birth_date ? String(student.birth_date) : null,
    archived: student.archived === true,
  }));

  const safeClasses = ((classes as unknown as ClassItem[] | null) ?? []).map(
    (classItem) => ({
      id: String(classItem.id),
      name: String(classItem.name ?? "Turma"),
      students: classItem.students ?? [],
    })
  );

  const safeObservations = (observations as Observation[] | null) ?? [];
  const safeSubmissions =
    (submissions as unknown as RawSubmission[] | null) ?? [];

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

  const riskStudents = safeStudents.filter(
    (student) =>
      Number(student.average || 0) < 7 || Number(student.attendance || 0) < 75
  ).length;

  const birthdayStudents = safeStudents
    .filter((student) => isBirthdayInCurrentMonth(student.birth_date))
    .sort((a, b) => {
      const todayA = isBirthdayToday(a.birth_date) ? -1 : 0;
      const todayB = isBirthdayToday(b.birth_date) ? -1 : 0;

      if (todayA !== todayB) return todayA - todayB;

      return getBirthdayDay(a.birth_date) - getBirthdayDay(b.birth_date);
    });

  const classPerformance: ClassPerformance[] = safeClasses
    .map((classItem) => {
      const classStudents = (classItem.students ?? [])
        .filter((student) => !student.archived)
        .map((student) => ({
          id: String(student.id ?? ""),
          name: String(student.name ?? "Aluno"),
          average: Number(student.average || 0),
          attendance: Number(student.attendance || 0),
          birth_date: student.birth_date ? String(student.birth_date) : null,
          archived: student.archived === true,
        }));

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

      const riskCount = classStudents.filter(
        (student) =>
          getNumericAverage(student.average) < 7 ||
          getNumericAttendance(student.attendance) < 75
      ).length;

      const noGradeCount = classStudents.filter(
        (student) => getNumericAverage(student.average) === 0
      ).length;

      const rankedStudents = [...classStudents].sort(
        (a, b) => getNumericAverage(b.average) - getNumericAverage(a.average)
      );

      const lowStudents = [...classStudents].sort((a, b) => {
        const averageCompare =
          getNumericAverage(a.average) - getNumericAverage(b.average);

        if (averageCompare !== 0) {
          return averageCompare;
        }

        return (
          getNumericAttendance(a.attendance) -
          getNumericAttendance(b.attendance)
        );
      });

      return {
        id: classItem.id,
        name: classItem.name,
        total,
        average,
        attendance,
        riskCount,
        noGradeCount,
        topStudents: rankedStudents.slice(0, 5),
        lowStudents: lowStudents.slice(0, 5),
      };
    })
    .sort((a, b) => {
      if (a.average !== b.average) return a.average - b.average;

      return a.name.localeCompare(b.name, "pt-BR");
    });

  const gradeGroups: GradeGroup[] = [
    {
      key: "critical",
      label: "0 a 4,9",
      color: "red",
      students: safeStudents.filter(
        (student) => Number(student.average || 0) < 5
      ),
    },
    {
      key: "warning",
      label: "5 a 6,9",
      color: "yellow",
      students: safeStudents.filter(
        (student) =>
          Number(student.average || 0) >= 5 && Number(student.average || 0) < 7
      ),
    },
    {
      key: "good",
      label: "7 a 8,9",
      color: "green",
      students: safeStudents.filter(
        (student) =>
          Number(student.average || 0) >= 7 && Number(student.average || 0) < 9
      ),
    },
    {
      key: "excellent",
      label: "9 a 10",
      color: "blue",
      students: safeStudents.filter(
        (student) => Number(student.average || 0) >= 9
      ),
    },
  ];

  const pendingActivities = buildPendingActivities(safeSubmissions);
  const pendingCorrectionsTotal = pendingActivities.reduce(
    (sum, activity) => sum + activity.totalPending,
    0
  );

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
        <section className="overflow-hidden rounded-3xl border border-pink-400/20 bg-gradient-to-br from-pink-500/15 via-fuchsia-500/10 to-yellow-500/10 p-6 shadow-2xl shadow-pink-500/10">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-pink-500/20 text-pink-200">
                <Cake size={32} />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wide text-pink-200">
                  Aniversariantes de {getCurrentMonthName()}
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  {birthdayStudents.length > 0
                    ? `${birthdayStudents.length} aluno(s) fazem aniversário este mês`
                    : "Nenhum aniversário registrado este mês"}
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  Os aniversariantes do dia aparecem em destaque para facilitar a
                  felicitação durante a rotina pedagógica.
                </p>
              </div>
            </div>

            {birthdayStudents.length > 0 && (
              <div className="flex max-w-4xl flex-wrap gap-2">
                {birthdayStudents.map((student) => {
                  const todayBirthday = isBirthdayToday(student.birth_date);

                  return (
                    <div
                      key={student.id}
                      className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-bold ${
                        todayBirthday
                          ? "border-yellow-300/50 bg-yellow-500/20 text-yellow-100 shadow-lg shadow-yellow-500/10"
                          : "border-pink-300/20 bg-slate-950/50 text-pink-100"
                      }`}
                    >
                      <Cake className="h-4 w-4" />
                      <span>{student.name}</span>
                      <span className="text-xs opacity-80">
                        {todayBirthday ? "Hoje" : formatShortDate(student.birth_date)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <DashboardCard title="Alunos" value={String(totalStudents)} icon={<Users />} />

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

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold text-white">Desempenho por turma</h2>

          <p className="mt-1 text-sm text-slate-400">
            Turmas organizadas da pior média geral para a melhor. Clique para
            expandir os detalhes.
          </p>

          <div className="mt-6 space-y-3">
            {classPerformance.length === 0 ? (
              <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-slate-400">
                Nenhuma turma cadastrada.
              </p>
            ) : (
              classPerformance.map((classItem, index) => (
                <details
                  key={classItem.id}
                  className="group overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/40 transition open:border-violet-500/30 open:bg-slate-950/70"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none flex-col gap-3 p-5 transition hover:bg-white/[0.03] md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-xl font-black text-white">
                          {classItem.name}
                        </h3>

                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getScoreBadgeClasses(
                            classItem.average
                          )}`}
                        >
                          {getPerformanceLabel(classItem.average)}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-400">
                        {classItem.total} aluno(s)
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-3">
                        <p className="text-xs text-slate-500">Média geral</p>
                        <p className="mt-1 text-2xl font-black text-white">
                          {classItem.average.toFixed(1)}
                        </p>
                      </div>

                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-700 text-slate-300 transition group-open:rotate-180">
                        <ChevronDown size={20} />
                      </div>
                    </div>
                  </summary>

                  <div className="border-t border-slate-800 p-5">
                    <div className="grid gap-3 md:grid-cols-4">
                      <MiniMetric
                        title="Média"
                        value={classItem.average.toFixed(1)}
                      />

                      <MiniMetric
                        title="Frequência"
                        value={`${classItem.attendance.toFixed(0)}%`}
                      />

                      <MiniMetric
                        title="Alunos em atenção"
                        value={String(classItem.riskCount)}
                      />

                      <MiniMetric
                        title="Sem média"
                        value={String(classItem.noGradeCount)}
                      />
                    </div>

                    <div className="mt-5 grid gap-4 xl:grid-cols-2">
                      <StudentRankingList
                        title="5 melhores desempenhos"
                        emptyText="Nenhum aluno com dados nesta turma."
                        students={classItem.topStudents}
                        variant="best"
                      />

                      <StudentRankingList
                        title="5 piores desempenhos"
                        emptyText="Nenhum aluno com dados nesta turma."
                        students={classItem.lowStudents}
                        variant="risk"
                      />
                    </div>
                  </div>
                </details>
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
              Clique em uma faixa para ver todos os alunos daquele grupo.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {gradeGroups.map((group) => (
                <DistributionCard
                  key={group.key}
                  label={group.label}
                  value={String(group.students.length)}
                  color={group.color}
                  students={group.students}
                />
              ))}
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
                  Atividades atrasadas ou dentro do prazo que ainda precisam de
                  correção.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm text-slate-400">
                Total de entregas pendentes
              </p>
              <p className="mt-1 text-4xl font-black text-white">
                {pendingCorrectionsTotal}
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {pendingActivities.length === 0 ? (
                <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
                  <CheckCircle size={20} />

                  <p className="font-semibold">
                    Nenhuma pendência de correção.
                  </p>
                </div>
              ) : (
                pendingActivities.slice(0, 8).map((item) => (
                  <Link
                    key={`${item.id}-${item.title}-${item.className}`}
                    href={
                      item.id
                        ? `/dashboard/entregas?activityId=${item.id}`
                        : "/dashboard/entregas"
                    }
                    className="group block rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-violet-500/40 hover:bg-violet-500/10"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="line-clamp-1 font-semibold text-white">
                            {item.title}
                          </p>

                          {item.overdue > 0 && (
                            <span className="rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-bold text-red-300">
                              {item.overdue} atrasada(s)
                            </span>
                          )}

                          {item.inTime > 0 && (
                            <span className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-300">
                              {item.inTime} no prazo
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm text-slate-400">
                          {item.className} • Prazo:{" "}
                          {formatShortDate(item.dueDate)}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="rounded-2xl bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-300">
                          {item.totalPending} pendente(s)
                        </span>

                        <ExternalLink className="h-5 w-5 text-violet-300 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold text-white">Últimas observações</h2>

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
  icon: ReactNode;
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

function MiniMetric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <p className="text-xs text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function StudentRankingList({
  title,
  emptyText,
  students,
  variant,
}: {
  title: string;
  emptyText: string;
  students: ClassStudent[];
  variant: "best" | "risk";
}) {
  return (
    <div
      className={`rounded-3xl border p-4 ${
        variant === "best"
          ? "border-emerald-500/20 bg-emerald-500/10"
          : "border-red-500/20 bg-red-500/10"
      }`}
    >
      <h4 className="font-black text-white">{title}</h4>

      <div className="mt-3 space-y-2">
        {students.length === 0 ? (
          <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-3 text-sm text-slate-400">
            {emptyText}
          </p>
        ) : (
          students.map((student, index) => (
            <div
              key={`${student.id}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {getStudentName(student)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Frequência{" "}
                  {getNumericAttendance(student.attendance).toFixed(0)}%
                </p>
              </div>

              <span
                className={`rounded-2xl px-4 py-2 text-sm font-black ${
                  variant === "best"
                    ? "bg-emerald-500/15 text-emerald-200"
                    : "bg-red-500/15 text-red-200"
                }`}
              >
                {getNumericAverage(student.average).toFixed(1)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function DistributionCard({
  label,
  value,
  color,
  students,
}: {
  label: string;
  value: string;
  color: "red" | "yellow" | "green" | "blue";
  students: Student[];
}) {
  const styles = {
    red: "border-red-500/20 bg-red-500/10 text-red-300",
    yellow: "border-yellow-500/20 bg-yellow-500/10 text-yellow-300",
    green: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  };

  return (
    <details
      className={`group overflow-hidden rounded-2xl border ${styles[color]}`}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">Média {label}</p>
          <p className="mt-2 text-3xl font-black">{value}</p>
          <p className="mt-1 text-xs opacity-80">aluno(s)</p>
        </div>

        <div className="rounded-xl bg-white/10 p-2 transition group-open:rotate-180">
          <ChevronDown size={18} />
        </div>
      </summary>

      <div className="border-t border-white/10 bg-slate-950/40 p-3">
        {students.length === 0 ? (
          <p className="rounded-xl bg-slate-950/40 px-3 py-2 text-sm text-slate-400">
            Nenhum aluno nesta faixa.
          </p>
        ) : (
          <div className="space-y-2">
            {[...students]
              .sort((a, b) => Number(a.average || 0) - Number(b.average || 0))
              .map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/60 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white">
                      {student.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {student.class_name || "Sem turma"}
                    </p>
                  </div>

                  <span className="rounded-xl bg-white/10 px-3 py-1 text-sm font-black text-white">
                    {Number(student.average || 0).toFixed(1)}
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>
    </details>
  );
}