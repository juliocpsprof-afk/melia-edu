import { supabase } from "../../../lib/supabase";
import { AttendanceSmartPanel } from "../../../components/AttendanceSmartPanel";

type ClassItem = {
  id: string;
  name: string;
};

type Lesson = {
  id: string;
  class_id: string;
  lesson_date: string;
  content: string;
  notes: string | null;
};

type Student = {
  id: string;
  name: string;
  class_id: string;
};

export default async function FrequenciaPage() {
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: lessons, error: lessonsError } = await supabase
    .from("lesson_diary")
    .select("id, class_id, lesson_date, content, notes")
    .order("lesson_date", { ascending: false });

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, class_id")
    .order("name", { ascending: true });

  if (classesError || lessonsError || studentsError) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar chamada</h1>
        <p className="mt-2 text-red-300">
          {classesError?.message || lessonsError?.message || studentsError?.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Frequência</h1>
        <p className="mt-1 text-slate-400">
          Faça a chamada por turma, aula e conteúdo do diário de classe.
        </p>
      </header>

      <section className="p-6">
        <AttendanceSmartPanel
          classes={(classes as ClassItem[]) ?? []}
          lessons={(lessons as Lesson[]) ?? []}
          students={(students as Student[]) ?? []}
        />
      </section>
    </>
  );
}