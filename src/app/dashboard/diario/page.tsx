import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { NewDiaryLessonForm } from "../../../components/NewDiaryLessonForm";

type ClassItem = {
  id: string;
  name: string;
  course_id: string | null;
};

type Course = {
  id: string;
  name: string;
};

type CurriculumLesson = {
  id: string;
  course_id: string;
  lesson_order: number | null;
  title: string;
  content: string | null;
  notes: string | null;
};

type LessonDiary = {
  id: string;
  lesson_date: string;
  content: string;
  notes: string | null;
  classes: {
    name: string;
  } | null;
};

export default async function DiarioPage() {
  const { data: classes } = await supabase
  .from("classes")
  .select(`
    id,
    name,
    course_id
  `)
  .neq("status", "Arquivada")
  .order("name", { ascending: true });

  const { data: curriculumLessons } = await supabase
  .from("curriculum_lessons")
  .select(`
    id,
    course_id,
    lesson_order,
    title,
    content,
    notes
  `)
  
  const { data: courses } = await supabase
  .from("courses")
  .select("id, name")
  .order("name", { ascending: true });
  

  const { data: lessons, error } = await supabase
  .from("lesson_diary")
  .select(`
    id,
    lesson_date,
    content,
    notes,
    classes (
      name
    )
  `)
  .order("lesson_date", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar diário</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Diário de Classe</h1>
        <p className="mt-1 text-slate-400">
          Registre as aulas ministradas e vincule o conteúdo à chamada.
        </p>
      </header>

      <section className="p-6">
        <NewDiaryLessonForm
  classes={(classes as ClassItem[]) ?? []}
  courses={(courses as Course[]) ?? []}
  curriculumLessons={(curriculumLessons as CurriculumLesson[]) ?? []}
/>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {(lessons as LessonDiary[] | null)?.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
              Nenhuma aula registrada no diário.
            </div>
          ) : (
            (lessons as LessonDiary[] | null)?.map((lesson) => (
              <div
                key={lesson.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <Badge
                    icon={<GraduationCap size={16} />}
                    text={lesson.classes?.name ?? "Sem turma"}
                  />

                  <Badge
                    icon={<CalendarDays size={16} />}
                    text={new Date(lesson.lesson_date).toLocaleDateString(
                      "pt-BR"
                    )}
                  />
                </div>

                <div className="mt-6 flex items-start gap-4">
                  <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
                    <BookOpen size={28} />
                  </div>

                  <div>
                    <h2 className="text-xl font-bold">{lesson.content}</h2>

                    {lesson.notes && (
                      <p className="mt-3 leading-7 text-slate-400">
                        {lesson.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}

function Badge({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-sm text-slate-300">
      <span className="text-violet-400">{icon}</span>
      {text}
    </div>
  );
}