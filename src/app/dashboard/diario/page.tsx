import { supabase } from "../../../lib/supabase";
import { NewDiaryLessonForm } from "../../../components/NewDiaryLessonForm";
import {
  DiaryLessonCards,
  type LessonDiary,
} from "../../../components/diario/DiaryLessonCards";

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
    `);

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

  const safeLessons =
    (lessons as unknown as LessonDiary[] | null) ?? [];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Diário de Classe</h1>

        <p className="mt-1 text-slate-400">
          Registre, edite e acompanhe as aulas ministradas.
        </p>
      </header>

      <section className="p-6">
        <NewDiaryLessonForm
          classes={(classes as ClassItem[]) ?? []}
          courses={(courses as Course[]) ?? []}
          curriculumLessons={(curriculumLessons as CurriculumLesson[]) ?? []}
        />

        <DiaryLessonCards lessons={safeLessons} />
      </section>
    </>
  );
}