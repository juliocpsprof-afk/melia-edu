import { BookOpen, GraduationCap, Layers3 } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { CoursesManager } from "../../../components/CoursesManager";

type Course = {
  id: string;
  name: string;
  description: string | null;
  curriculum_lessons: {
    id: string;
    title: string;
    lesson_order: number | null;
  }[];
};

export default async function CursosPage() {
  const { data: courses, error } = await supabase
    .from("courses")
    .select(`
      id,
      name,
      description,
      curriculum_lessons (
        id,
        title,
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

  const totalLessons =
    (courses as Course[] | null)?.reduce(
      (sum, course) => sum + (course.curriculum_lessons?.length ?? 0),
      0
    ) ?? 0;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Cursos</h1>
        <p className="mt-1 text-slate-400">
          Cadastre cursos da instituição e organize a grade curricular.
        </p>
      </header>

      <section className="p-6">
        <div className="mb-8 grid gap-5 md:grid-cols-3">
          <SummaryCard
            title="Cursos cadastrados"
            value={String((courses as Course[] | null)?.length ?? 0)}
            icon={<GraduationCap />}
          />

          <SummaryCard
            title="Aulas na grade"
            value={String(totalLessons)}
            icon={<BookOpen />}
          />

          <SummaryCard
            title="Base curricular"
            value="Ativa"
            icon={<Layers3 />}
          />
        </div>

        <CoursesManager courses={(courses as Course[]) ?? []} />
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