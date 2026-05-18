import { supabase } from "../../../lib/supabase";
import { ClassesManager } from "../../../components/ClassesManager";

type Course = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  status: string | null;
  courses: {
    name: string;
  } | null;
  students: {
    id: string;
  }[];
};

export default async function TurmasPage() {
  const { data: courses } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: classes, error } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      description,
      course_id,
      status,
      courses (
        name
      ),
      students (
        id
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar turmas</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Turmas</h1>
        <p className="mt-1 text-slate-400">
          Crie, edite, arquive e vincule turmas aos cursos.
        </p>
      </header>

      <section className="p-6">
        <ClassesManager
          classes={(classes as ClassItem[]) ?? []}
          courses={(courses as Course[]) ?? []}
        />
      </section>
    </>
  );
}