import { ClassLearningSettingsManager } from "../../../components/ClassLearningSettingsManager";
import { ClassWhatsappLinksManager } from "../../../components/ClassWhatsappLinksManager";
import { ClassesManager } from "../../../components/ClassesManager";
import { supabase } from "../../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Course = {
  id: string;
  name: string;
};

type RawClassItem = {
  id: string;
  name: string | null;
  description: string | null;
  course_id: string | null;
  status: string | null;
  whatsapp_group_link: string | null;
  schedule_days: number[] | null;
  weekly_workload_minutes: number | null;
  default_session_minutes: number | null;
  students:
    | {
        id?: string | null;
      }[]
    | null;
};

type RawClassCourse = {
  class_id: string | null;
  course_id: string | null;
};

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  status: string | null;
  whatsapp_group_link: string | null;
  schedule_days: number[];
  weekly_workload_minutes: number;
  default_session_minutes: number;
  linked_courses: Course[];
  students: {
    id: string;
  }[];
};

function addCourseWithoutDuplicate(
  currentCourses: Course[],
  course: Course
) {
  const alreadyExists = currentCourses.some(
    (item) => item.id === course.id
  );

  if (alreadyExists) {
    return currentCourses;
  }

  return [...currentCourses, course];
}

export default async function TurmasPage() {
  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select(
      `
      id,
      name,
      description,
      course_id,
      status,
      whatsapp_group_link,
      schedule_days,
      weekly_workload_minutes,
      default_session_minutes,
      students (
        id
      )
    `
    )
    .order("created_at", { ascending: false });

  const { data: classCourses, error: classCoursesError } = await supabase
    .from("class_courses")
    .select("class_id, course_id");

  const error = coursesError || classesError || classCoursesError;

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

  const courseById = new Map(
    safeCourses.map((course) => [course.id, course])
  );

  const linkedCoursesByClassId = new Map<string, Course[]>();

  ((classCourses as RawClassCourse[] | null) ?? []).forEach((link) => {
    if (!link.class_id || !link.course_id) {
      return;
    }

    const course = courseById.get(String(link.course_id));

    if (!course) {
      return;
    }

    const current = linkedCoursesByClassId.get(String(link.class_id)) ?? [];

    linkedCoursesByClassId.set(
      String(link.class_id),
      addCourseWithoutDuplicate(current, course)
    );
  });

  const rawClasses = (classes as unknown as RawClassItem[] | null) ?? [];

  const safeClasses: ClassItem[] = rawClasses.map((classItem) => {
    const classId = String(classItem.id);

    let linkedCourses = linkedCoursesByClassId.get(classId) ?? [];

    if (classItem.course_id) {
      const legacyCourse = courseById.get(String(classItem.course_id));

      if (legacyCourse) {
        linkedCourses = addCourseWithoutDuplicate(linkedCourses, legacyCourse);
      }
    }

    return {
      id: classId,
      name: String(classItem.name ?? "Turma sem nome"),
      description: classItem.description,
      course_id: classItem.course_id,
      status: classItem.status ?? "Ativa",
      whatsapp_group_link: classItem.whatsapp_group_link,
      schedule_days: Array.isArray(classItem.schedule_days)
        ? classItem.schedule_days.map(Number).filter(Boolean)
        : [],
      weekly_workload_minutes: Number(
        classItem.weekly_workload_minutes ?? 0
      ),
      default_session_minutes: Number(
        classItem.default_session_minutes ?? 60
      ),
      linked_courses: linkedCourses,
      students:
        classItem.students?.map((student) => ({
          id: String(student.id ?? ""),
        })) ?? [],
    };
  });

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Turmas</h1>
        <p className="mt-1 text-slate-400">
          Crie, edite e configure a rotina semanal das turmas permanentes.
        </p>
      </header>

      <section className="space-y-8 p-6">
        <ClassesManager classes={safeClasses} courses={safeCourses} />

        <ClassLearningSettingsManager
          classes={safeClasses.map((classItem) => ({
            id: classItem.id,
            name: classItem.name,
            status: classItem.status,
            schedule_days: classItem.schedule_days,
            weekly_workload_minutes: classItem.weekly_workload_minutes,
            default_session_minutes: classItem.default_session_minutes,
          }))}
        />

        <ClassWhatsappLinksManager
          classes={safeClasses.map((classItem) => ({
            id: classItem.id,
            name: classItem.name,
            status: classItem.status,
            whatsapp_group_link: classItem.whatsapp_group_link,
          }))}
        />
      </section>
    </>
  );
}
