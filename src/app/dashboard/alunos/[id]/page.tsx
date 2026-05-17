import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  Mail,
  Phone,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase";

import { NewObservationForm } from "../../../../components/NewObservationForm";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StudentProfilePage({
  params,
}: Props) {
  const { id } = await params;

  const { data: student, error } =
    await supabase
      .from("students")
      .select(`
        *,
        grades (
          title,
          score,
          date,
          feedback
        ),
        attendance (
          status,
          date
        ),
        observations (
          content,
          category,
          created_at
        )
      `)
      .eq("id", id)
      .single();

  if (error || !student) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">
          Aluno não encontrado
        </h1>
      </div>
    );
  }

  const grades = student.grades ?? [];

  const attendance =
    student.attendance ?? [];

  const observations =
    student.observations ?? [];

  const average =
    grades.length > 0
      ? grades.reduce(
          (
            sum: number,
            item: any
          ) => sum + Number(item.score),
          0
        ) / grades.length
      : 0;

  const presencas =
    attendance.filter(
      (item: any) =>
        item.status === "Presente"
    ).length;

  const faltas =
    attendance.filter(
      (item: any) =>
        item.status === "Falta"
    ).length;

  const atrasos =
    attendance.filter(
      (item: any) =>
        item.status === "Atraso"
    ).length;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500 text-3xl font-bold">
              {student.name.charAt(0)}
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                {student.name}
              </h1>

              <p className="mt-1 text-slate-400">
                {student.class_name}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button className="flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-slate-300 transition hover:bg-white/5">
              <Mail size={18} />
              Email
            </button>

            <button className="flex items-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-slate-300 transition hover:bg-white/5">
              <Phone size={18} />
              Contato
            </button>
          </div>
        </div>
      </header>

      <section className="p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            title="Média"
            value={average.toFixed(1)}
            icon={<TrendingUp />}
          />

          <InfoCard
            title="Presenças"
            value={String(presencas)}
            icon={<CalendarDays />}
          />

          <InfoCard
            title="Faltas"
            value={String(faltas)}
            icon={<AlertTriangle />}
          />

          <InfoCard
            title="Atrasos"
            value={String(atrasos)}
            icon={<UserRound />}
          />
        </div>

        <div className="mt-8">
          <NewObservationForm studentId={id} />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">
              Histórico de notas
            </h2>

            <div className="mt-6 space-y-4">
              {grades.map(
                (
                  grade: any,
                  index: number
                ) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">
                          {grade.title}
                        </p>

                        <p className="text-sm text-slate-500">
                          {grade.date}
                        </p>
                      </div>

                      <div className="rounded-xl bg-violet-500/10 px-4 py-2 text-violet-300">
                        {grade.score}
                      </div>
                    </div>

                    {grade.feedback && (
                      <div className="mt-4 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                        <p className="text-sm font-medium text-violet-300">
                          Feedback pedagógico
                        </p>

                        <p className="mt-2 leading-7 text-slate-300">
                          {grade.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">
              Histórico de frequência
            </h2>

            <div className="mt-6 space-y-4">
              {attendance.map(
                (
                  item: any,
                  index: number
                ) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen
                        size={18}
                        className="text-violet-400"
                      />

                      <span>
                        {item.status}
                      </span>
                    </div>

                    <span className="text-sm text-slate-500">
                      {item.date}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 xl:col-span-2">
            <h2 className="text-2xl font-bold">
              Observações pedagógicas
            </h2>

            <div className="mt-6 space-y-4">
              {observations.length === 0 ? (
                <p className="text-slate-500">
                  Nenhuma observação registrada.
                </p>
              ) : (
                observations.map(
                  (
                    observation: any,
                    index: number
                  ) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                          {observation.category}
                        </span>

                        <span className="text-sm text-slate-500">
                          {new Date(
                            observation.created_at
                          ).toLocaleDateString(
                            "pt-BR"
                          )}
                        </span>
                      </div>

                      <p className="leading-7 text-slate-300">
                        {observation.content}
                      </p>
                    </div>
                  )
                )
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
        {icon}
      </div>

      <p className="text-slate-400">
        {title}
      </p>

      <h3 className="mt-3 text-4xl font-bold">
        {value}
      </h3>
    </div>
  );
}