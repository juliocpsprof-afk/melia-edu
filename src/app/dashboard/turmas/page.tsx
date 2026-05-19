import { supabase } from "../../../lib/supabase";
import { ClassesManager } from "../../../components/ClassesManager";

type Course = {
  id: string;
  name: string;
};

type RawClassItem = {
  id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  status: string | null;
  courses:
    | {
        name?: string | null;
      }
    | {
        name?: string | null;
      }[]
    | null;
  students:
    | {
        id?: string | null;
      }[]
    | null;
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

function getCourseName(
  courses: RawClassItem["courses"]
) {
  if (!courses) {
    return "Sem curso";
  }

  if (Array.isArray(courses)) {
    return courses[0]?.name || "Sem curso";
  }

  return courses.name || "Sem curso";
}

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

  const safeCourses: Course[] =
    courses?.map((course) => ({
      id: String(course.id),
      name: String(course.name ?? "Curso sem nome"),
    })) ?? [];

  const rawClasses =
    (classes as unknown as RawClassItem[] | null) ?? [];

  const safeClasses: ClassItem[] = rawClasses.map((classItem) => ({
    id: String(classItem.id),
    name: String(classItem.name ?? "Turma sem nome"),
    description: classItem.description,
    course_id: classItem.course_id,
    status: classItem.status,
    courses: {
      name: getCourseName(classItem.courses),
    },
    students:
      classItem.students?.map((student) => ({
        id: String(student.id ?? ""),
      })) ?? [],
  }));

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
          classes={safeClasses}
          courses={safeCourses}
        />
      </section>
    </>
  );
}