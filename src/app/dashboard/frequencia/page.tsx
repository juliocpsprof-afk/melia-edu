import { AttendanceSmartPanel } from "../../../components/AttendanceSmartPanel";
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
  course_id: string | null;
  whatsapp_group_link: string | null;
};

type RawClassCourse = {
  class_id: string | null;
  course_id: string | null;
};

type RawCurriculumLesson = {
  id: string;
  course_id: string | null;
  title: string | null;
  content: string | null;
  notes: string | null;
  lesson_order: number | null;
};

type ClassItem = {
  id: string;
  name: string;
  whatsapp_group_link: string | null;
};

type Lesson = {
  id: string;
  class_id: string;
  course_id: string;
  course_name: string;
  lesson_order: number;
  title: string;
  content: string;
  notes: string | null;
};

type Student = {
  id: string;
  name: string;
  class_id: string;
  birth_date: string | null;
  photo_path: string | null;
  photo_status: string | null;
  identity_mode: string | null;
  avatar_key: string | null;
};

function addCourseIdWithoutDuplicate(currentIds: string[], courseId: string) {
  if (currentIds.includes(courseId)) {
    return currentIds;
  }

  return [...currentIds, courseId];
}

export default async function FrequenciaPage() {
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name, course_id, whatsapp_group_link")
    .order("name", { ascending: true });

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: classCourses, error: classCoursesError } = await supabase
    .from("class_courses")
    .select("class_id, course_id");

  const { data: curriculumLessons, error: curriculumLessonsError } =
    await supabase
      .from("curriculum_lessons")
      .select("id, course_id, title, content, notes, lesson_order")
      .order("lesson_order", { ascending: true });

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, class_id, birth_date, photo_path, photo_status, identity_mode, avatar_key")
    .eq("archived", false)
    .order("name", { ascending: true });

  const error =
    classesError ||
    coursesError ||
    classCoursesError ||
    curriculumLessonsError ||
    studentsError;

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar chamada</h1>

        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  const safeCourses: Course[] =
    courses?.map((course) => ({
      id: String(course.id),
      name: String(course.name ?? "Curso sem nome"),
    })) ?? [];

  const courseById = new Map(safeCourses.map((course) => [course.id, course]));

  const rawClasses = (classes as unknown as RawClassItem[] | null) ?? [];

  const safeClasses: ClassItem[] = rawClasses.map((classItem) => ({
    id: String(classItem.id),
    name: String(classItem.name ?? "Turma sem nome"),
    whatsapp_group_link: classItem.whatsapp_group_link,
  }));

  const courseIdsByClassId = new Map<string, string[]>();

  ((classCourses as RawClassCourse[] | null) ?? []).forEach((link) => {
    if (!link.class_id || !link.course_id) {
      return;
    }

    const classId = String(link.class_id);
    const courseId = String(link.course_id);

    const current = courseIdsByClassId.get(classId) ?? [];

    courseIdsByClassId.set(
      classId,
      addCourseIdWithoutDuplicate(current, courseId)
    );
  });

  rawClasses.forEach((classItem) => {
    if (!classItem.course_id) {
      return;
    }

    const classId = String(classItem.id);
    const courseId = String(classItem.course_id);

    const current = courseIdsByClassId.get(classId) ?? [];

    courseIdsByClassId.set(
      classId,
      addCourseIdWithoutDuplicate(current, courseId)
    );
  });

  const safeCurriculumLessons =
    (curriculumLessons as RawCurriculumLesson[] | null) ?? [];

  const lessonsByCourseId = new Map<string, RawCurriculumLesson[]>();

  safeCurriculumLessons.forEach((lesson) => {
    if (!lesson.course_id) {
      return;
    }

    const courseId = String(lesson.course_id);
    const current = lessonsByCourseId.get(courseId) ?? [];

    lessonsByCourseId.set(courseId, [...current, lesson]);
  });

  const lessons: Lesson[] = [];

  rawClasses.forEach((classItem) => {
    const classId = String(classItem.id);
    const linkedCourseIds = courseIdsByClassId.get(classId) ?? [];

    linkedCourseIds.forEach((courseId) => {
      const course = courseById.get(courseId);

      if (!course) {
        return;
      }

      const courseLessons = lessonsByCourseId.get(courseId) ?? [];

      courseLessons.forEach((lesson) => {
        lessons.push({
          id: String(lesson.id),
          class_id: classId,
          course_id: courseId,
          course_name: course.name,
          lesson_order: Number(lesson.lesson_order) || 0,
          title: lesson.title?.trim() || "Aula sem título",
          content:
            lesson.content?.trim() ||
            lesson.title?.trim() ||
            "Conteúdo não informado",
          notes: lesson.notes,
        });
      });
    });
  });

  const safeStudents: Student[] =
    students?.map((student) => ({
      id: String(student.id),
      name: String(student.name ?? "Aluno sem nome"),
      class_id: String(student.class_id ?? ""),
      birth_date: student.birth_date ? String(student.birth_date) : null,
      photo_path: student.photo_path ? String(student.photo_path) : null,
      photo_status: student.photo_status ? String(student.photo_status) : null,
      identity_mode: student.identity_mode ? String(student.identity_mode) : null,
      avatar_key: student.avatar_key ? String(student.avatar_key) : null,
    })) ?? [];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Frequência</h1>

        <p className="mt-1 text-slate-400">
          Faça a chamada por turma usando as aulas da grade curricular dos cursos
          vinculados.
        </p>
      </header>

      <section className="p-6">
        <AttendanceSmartPanel
          classes={safeClasses}
          lessons={lessons}
          students={safeStudents}
        />
      </section>
    </>
  );
}
