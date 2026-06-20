export const dynamic = "force-dynamic";
export const revalidate = 0;

import type { ReactNode } from "react";
import { Archive, TrendingUp, UserRound, Users } from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { StudentRegistrationArea } from "../../../components/StudentRegistrationArea";
import { StudentsTable } from "../../../components/aluno/StudentsTable";

type ClassItem = {
  id: string;
  name: string;
};

type CourseItem = {
  id: string;
  name: string;
};

type StudentSummary = {
  id: string;
  name: string | null;
  status: string | null;
  archived?: boolean | null;
};

export default async function AlunosPage() {
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("name", {
      ascending: true,
    });

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", {
      ascending: true,
    });

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", {
      ascending: true,
    });

  if (error || classesError || coursesError) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar dados</h1>

        <p className="mt-2 text-red-300">
          {error?.message || classesError?.message || coursesError?.message}
        </p>
      </div>
    );
  }

  const safeClasses = (classes as ClassItem[]) ?? [];
  const safeCourses = (courses as CourseItem[]) ?? [];
  const safeStudents = (students as StudentSummary[] | null) ?? [];

  const activeStudents = safeStudents.filter((student) => !student.archived);
  const archivedStudents = safeStudents.filter((student) => student.archived);

  const totalActiveStudents = activeStudents.length;

  const attentionStudents = activeStudents.filter(
    (student) => student.status === "Atenção" || student.status === "AtenÃ§Ã£o"
  ).length;

  const totalClasses = classes?.length ?? 0;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>

          <p className="mt-1 text-slate-400">
            Cadastre, consulte, edite, arquive e acompanhe alunos vinculados às
            turmas reais do sistema.
          </p>
        </div>
      </header>

      <section className="p-6">
        <StudentRegistrationArea classes={safeClasses} courses={safeCourses} />

        <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Alunos ativos"
            value={String(totalActiveStudents)}
            icon={<Users />}
          />

          <SummaryCard
            title="Arquivados"
            value={String(archivedStudents.length)}
            icon={<Archive />}
          />

          <SummaryCard
            title="Em atenção"
            value={String(attentionStudents)}
            icon={<TrendingUp />}
          />

          <SummaryCard
            title="Turmas vinculadas"
            value={String(totalClasses)}
            icon={<UserRound />}
          />
        </div>

        <StudentsTable
          students={(students as any[]) ?? []}
          classes={safeClasses}
          courses={safeCourses}
        />
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
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
