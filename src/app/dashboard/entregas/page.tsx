import { supabase } from "../../../lib/supabase";
import { NewSubmissionForm } from "../../../components/NewSubmissionForm";
import { SubmissionManager } from "../../../components/SubmissionManager";

type Student = {
  id: string;
  name: string;
  class_id?: string | null;
};

type Activity = {
  id: string;
  title: string;
};

type SchoolClass = {
  id: string;
  name: string;
};

type RawSubmission = {
  id: string;
  content: string | null;
  status: string | null;
  grade: number | null;
  feedback: string | null;
  student_id: string;
  students:
    | {
        name?: string | null;
        class_id?: string | null;
      }
    | {
        name?: string | null;
        class_id?: string | null;
      }[]
    | null;
  activities:
    | {
        title?: string | null;
      }
    | {
        title?: string | null;
      }[]
    | null;
};

function getStudent(submission: RawSubmission) {
  if (!submission.students) {
    return {
      name: "Aluno",
      class_id: null,
    };
  }

  if (Array.isArray(submission.students)) {
    return {
      name: submission.students[0]?.name || "Aluno",
      class_id: submission.students[0]?.class_id || null,
    };
  }

  return {
    name: submission.students.name || "Aluno",
    class_id: submission.students.class_id || null,
  };
}

function getActivityTitle(submission: RawSubmission) {
  if (!submission.activities) return "Atividade";

  if (Array.isArray(submission.activities)) {
    return submission.activities[0]?.title || "Atividade";
  }

  return submission.activities.title || "Atividade";
}

export default async function EntregasPage() {
  const { data: students } = await supabase
    .from("students")
    .select("id, name, class_id")
    .order("name");

  const { data: activities } = await supabase
    .from("activities")
    .select("id, title")
    .order("title");

  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .order("name");

  const { data: submissions, error } = await supabase
    .from("submissions")
    .select(`
      id,
      content,
      status,
      grade,
      feedback,
      student_id,
      students (
        name,
        class_id
      ),
      activities (
        title
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar entregas</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  const safeStudents: Student[] =
    students?.map((student) => ({
      id: String(student.id),
      name: String(student.name ?? "Aluno sem nome"),
      class_id: student.class_id ? String(student.class_id) : null,
    })) ?? [];

  const safeActivities: Activity[] =
    activities?.map((activity) => ({
      id: String(activity.id),
      title: String(activity.title ?? "Atividade sem título"),
    })) ?? [];

  const safeClasses: SchoolClass[] =
    classes?.map((classItem) => ({
      id: String(classItem.id),
      name: String(classItem.name ?? "Turma"),
    })) ?? [];

  const safeSubmissions =
    ((submissions as unknown as RawSubmission[] | null) ?? []).map(
      (submission) => {
        const student = getStudent(submission);

        return {
          id: submission.id,
          content: submission.content,
          status: submission.status,
          grade: submission.grade,
          feedback: submission.feedback,
          student_id: submission.student_id,
          student_name: student.name,
          student_class_id: student.class_id,
          activity_title: getActivityTitle(submission),
        };
      }
    );

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Entregas</h1>
        <p className="mt-1 text-slate-400">
          Acompanhe, corrija, pesquise, edite e exclua atividades enviadas.
        </p>
      </header>

      <section className="space-y-8 p-6">
        <NewSubmissionForm
          students={safeStudents}
          activities={safeActivities}
          classes={safeClasses}
        />

        <SubmissionManager submissions={safeSubmissions} classes={safeClasses} />
      </section>
    </>
  );
}