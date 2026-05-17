import { SubmissionCorrectionForm } from "../../../components/SubmissionCorrectionForm";
import {
  BookOpen,
  CheckCircle,
  Clock3,
  UserRound,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";

import { NewSubmissionForm } from "../../../components/NewSubmissionForm";

type Student = {
  id: string;
  name: string;
};

type Activity = {
  id: string;
  title: string;
};

type Submission = {
  id: string;

  content: string;

  status: string;

  grade: number | null;

  feedback: string | null;

  student_id: string;

  students: {
    name: string;
  } | null;

  activities: {
    title: string;
  } | null;
};

export default async function EntregasPage() {
  const { data: students } = await supabase
    .from("students")
    .select("id, name")
    .order("name");

  const { data: activities } = await supabase
    .from("activities")
    .select("id, title")
    .order("title");

  const { data: submissions, error } =
    await supabase
      .from("submissions")
      .select(`
  id,
  content,
  status,
  grade,
  feedback,
  student_id,

  students (
    name
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
        <h1 className="text-3xl font-bold">
          Erro ao carregar entregas
        </h1>

        <p className="mt-2 text-red-300">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">
          Entregas
        </h1>

        <p className="mt-1 text-slate-400">
          Acompanhe as respostas dos alunos.
        </p>
      </header>

      <section className="p-6">
        <NewSubmissionForm
          students={(students as Student[]) ?? []}
          activities={(activities as Activity[]) ?? []}
        />

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          {(submissions as Submission[] | null)
            ?.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
              Nenhuma entrega cadastrada.
            </div>
          ) : (
            (submissions as Submission[] | null)
              ?.map((submission) => (
                <div
                  key={submission.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      icon={<UserRound size={16} />}
                      text={
                        submission.students?.name ??
                        "Aluno"
                      }
                    />

                    <Badge
                      icon={<BookOpen size={16} />}
                      text={
                        submission.activities
                          ?.title ??
                        "Atividade"
                      }
                    />

                    <Badge
                      icon={<Clock3 size={16} />}
                      text={submission.status}
                    />
                  </div>

                  <p className="mt-6 leading-7 text-slate-300">
                    {submission.content}
                  </p>

                  <div className="mt-6 flex items-center justify-between">
                    <div className="rounded-2xl bg-violet-500/10 px-4 py-2 text-violet-300">
                      Nota:{" "}
                      {submission.grade ??
                        "Não corrigida"}
                    </div>

                    <div className="flex items-center gap-2 text-emerald-300">
                      <CheckCircle size={18} />
                      Entregue
                    </div>
                  </div>
<SubmissionCorrectionForm
  submissionId={submission.id}
  studentId={submission.student_id}
  activityTitle={
    submission.activities?.title ??
    "Atividade"
  }
/>                </div>
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
      <span className="text-violet-400">
        {icon}
      </span>

      {text}
    </div>
  );
}