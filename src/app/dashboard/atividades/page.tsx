export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabase } from "../../../lib/supabase";
import { NewActivityForm } from "../../../components/NewActivityForm";
import { ActivitiesManager } from "../../../components/ActivitiesManager";

type ClassItem = {
  id: string;
  name: string;
};

export default async function AtividadesPage() {
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select(`
      id,
      title,
      description,
      start_date,
      due_date,
      class_id,
      archived,
      classes (
        name
      )
    `)
    .order("due_date", { ascending: true });

  const { data: students, error: studentsError } = await supabase
    .from("students")
    .select("id, name, class_id")
    .order("name", { ascending: true });

  const { data: submissions, error: submissionsError } = await supabase
    .from("submissions")
    .select(`
      id,
      activity_id,
      student_id,
      grade,
      status,
      students (
        name
      )
    `);

  if (classesError || activitiesError || studentsError || submissionsError) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar atividades</h1>

        <p className="mt-2 text-red-300">
          {classesError?.message ||
            activitiesError?.message ||
            studentsError?.message ||
            submissionsError?.message}
        </p>
      </div>
    );
  }

  const safeClasses: ClassItem[] =
    classes?.map((classItem) => ({
      id: String(classItem.id),
      name: String(classItem.name ?? "Turma sem nome"),
    })) ?? [];

  const safeActivities =
    activities?.map((activity: any) => {
      const classRelation = Array.isArray(activity.classes)
        ? activity.classes[0]
        : activity.classes;

      return {
        id: String(activity.id),
        title: String(activity.title ?? "Atividade sem título"),
        description: activity.description ?? null,
        start_date: activity.start_date ? String(activity.start_date) : null,
        due_date: activity.due_date ? String(activity.due_date) : null,
        class_id: activity.class_id ? String(activity.class_id) : null,
        class_name: String(classRelation?.name ?? "Sem turma"),
        archived: activity.archived === true,
      };
    }) ?? [];

  const safeStudents =
    students?.map((student) => ({
      id: String(student.id),
      name: String(student.name ?? "Aluno sem nome"),
      class_id: student.class_id ? String(student.class_id) : null,
    })) ?? [];

  const safeSubmissions =
    submissions?.map((submission: any) => {
      const studentRelation = Array.isArray(submission.students)
        ? submission.students[0]
        : submission.students;

      return {
        id: String(submission.id),
        activity_id: String(submission.activity_id),
        student_id: String(submission.student_id),
        grade:
          submission.grade === null || submission.grade === undefined
            ? null
            : Number(submission.grade),
        status: submission.status ?? null,
        student_name: String(studentRelation?.name ?? "Aluno"),
      };
    }) ?? [];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Atividades</h1>

        <p className="mt-1 text-slate-400">
          Crie, acompanhe, arquive, edite e analise atividades por turma.
        </p>
      </header>

      <section className="p-6">
        <NewActivityForm classes={safeClasses} />

        <ActivitiesManager
          activities={safeActivities}
          classes={safeClasses}
          students={safeStudents}
          submissions={safeSubmissions}
        />
      </section>
    </>
  );
}