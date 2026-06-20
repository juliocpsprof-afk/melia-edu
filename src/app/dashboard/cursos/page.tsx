import type { ReactNode } from "react";
import { BookOpen, Clock3, GraduationCap, Layers3 } from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { CoursesManager } from "../../../components/CoursesManager";
import { CourseWorkloadManager } from "../../../components/CourseWorkloadManager";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Course = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  total_workload_minutes: number;
  curriculum_lessons: {
    id: string;
    title: string;
    content: string;
    notes: string;
    lesson_order: number | null;
  }[];
};

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export default async function CursosPage() {
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      description,
      status,
      total_workload_minutes,
      curriculum_lessons (
        id,
        title,
        content,
        notes,
        lesson_order
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar cursos</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  const safeCourses: Course[] =
    ((courses as unknown as Course[] | null) ?? []).map((course) => ({
      id: String(course.id),
      name: String(course.name ?? "Curso sem nome"),
      description: course.description,
      status: course.status ?? "Ativo",
      total_workload_minutes: Number(course.total_workload_minutes ?? 0),
      curriculum_lessons:
        course.curriculum_lessons
          ?.map((lesson) => ({
            id: String(lesson.id),
            title: String(lesson.title ?? "Aula sem título"),
            content: String(lesson.content ?? ""),
            notes: String(lesson.notes ?? ""),
            lesson_order: lesson.lesson_order ?? 0,
          }))
          .sort(
            (a, b) =>
              Number(a.lesson_order ?? 0) - Number(b.lesson_order ?? 0)
          ) ?? [],
    }));

  const activeCourses = safeCourses.filter(
    (course) => course.status !== "Arquivado"
  );
  const totalLessons = safeCourses.reduce(
    (sum, course) => sum + course.curriculum_lessons.length,
    0
  );
  const configuredWorkload = activeCourses.filter(
    (course) => course.total_workload_minutes > 0
  );
  const averageWorkloadMinutes = configuredWorkload.length
    ? Math.round(
        configuredWorkload.reduce(
          (sum, course) => sum + course.total_workload_minutes,
          0
        ) / configuredWorkload.length
      )
    : 0;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Cursos</h1>
        <p className="mt-1 text-slate-400">
          Cadastre cursos, organize a grade e defina a carga horária usada no
          progresso individual dos alunos.
        </p>
      </header>

      <section className="space-y-8 p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            title="Cursos ativos"
            value={String(activeCourses.length)}
            icon={<GraduationCap />}
          />
          <SummaryCard
            title="Aulas na grade"
            value={String(totalLessons)}
            icon={<BookOpen />}
          />
          <SummaryCard
            title="Carga configurada"
            value={`${configuredWorkload.length}/${activeCourses.length}`}
            icon={<Layers3 />}
          />
          <SummaryCard
            title="Carga média"
            value={formatHours(averageWorkloadMinutes)}
            icon={<Clock3 />}
          />
        </div>

        <CourseWorkloadManager
          courses={safeCourses.map((course) => ({
            id: course.id,
            name: course.name,
            status: course.status,
            total_workload_minutes: course.total_workload_minutes,
          }))}
        />

        <CoursesManager courses={safeCourses} />
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
