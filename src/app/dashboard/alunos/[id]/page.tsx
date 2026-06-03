import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";

import { supabase } from "../../../../lib/supabase";
import { NewObservationForm } from "../../../../components/NewObservationForm";
import { ExportStudentPdfButton } from "../../../../components/ExportStudentPdfButton";
import { AIPedagogicalReport } from "../../../../components/AIPedagogicalReport";
import { PedagogicalInterventionPlan } from "../../../../components/PedagogicalInterventionPlan";
import { NewGoalForm } from "../../../../components/NewGoalForm";
import { CompleteGoalButton } from "../../../../components/CompleteGoalButton";
import { ResetStudentPinButton } from "../../../../components/ResetStudentPinButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getDefaultStudentPin(name: string) {
  const firstName = normalizeText(name).split(/\s+/)[0] || "aluno";

  return `${firstName}123`;
}

export default async function StudentProfilePage({ params }: Props) {
  const { id } = await params;

  const { data: student, error } = await supabase
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
      ),
      goals (
        id,
        title,
        description,
        status,
        created_at
      )
    `)
    .eq("id", id)
    .single();

  if (error || !student) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Aluno não encontrado</h1>
      </div>
    );
  }

  const grades = student.grades ?? [];
  const attendance = student.attendance ?? [];
  const observations = student.observations ?? [];
  const goals = student.goals ?? [];

  const average =
    grades.length > 0
      ? grades.reduce((sum: number, item: any) => sum + Number(item.score), 0) /
        grades.length
      : 0;

  const presencas = attendance.filter(
    (item: any) => item.status === "Presente"
  ).length;

  const faltas = attendance.filter(
    (item: any) => item.status === "Falta"
  ).length;

  const atrasos = attendance.filter(
    (item: any) => item.status === "Atraso"
  ).length;

  const defaultPin = getDefaultStudentPin(student.name || "Aluno");
  const hasPersonalPin = student.must_change_pin === false;
  const currentPinStatus = hasPersonalPin
    ? "PIN pessoal criado"
    : "Usando PIN inicial ou resetado";

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-violet-500 text-3xl font-bold">
              {student.name.charAt(0)}
            </div>

            <div>
              <h1 className="text-3xl font-bold">{student.name}</h1>
              <p className="mt-1 text-slate-400">{student.class_name}</p>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                    hasPersonalPin
                      ? "bg-emerald-500/10 text-emerald-300"
                      : "bg-yellow-500/10 text-yellow-300"
                  }`}
                >
                  {hasPersonalPin ? (
                    <ShieldCheck size={14} />
                  ) : (
                    <KeyRound size={14} />
                  )}

                  {currentPinStatus}
                </span>

                {!hasPersonalPin && (
                  <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                    PIN temporário: {defaultPin}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ExportStudentPdfButton
              studentName={student.name}
              className={student.class_name}
              average={average.toFixed(1)}
              grades={grades}
              attendance={attendance}
              observations={observations}
            />

            <ResetStudentPinButton
              studentId={student.id}
              studentName={student.name}
            />

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

      <section id="student-profile-content" className="p-6">
        <div className="mb-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                <KeyRound size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Acesso ao Portal do Aluno
                </h2>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">
                  O PIN inicial segue o padrão da escola: primeiro nome do aluno
                  em letras minúsculas seguido de <strong>123</strong>. O aluno
                  pode trocar esse PIN dentro do portal. Se esquecer, o professor
                  pode resetar por aqui.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                PIN padrão/reset
              </p>

              <p className="mt-1 text-xl font-black text-cyan-200">
                {defaultPin}
              </p>
            </div>
          </div>
        </div>

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

        <div className="mt-8">
          <NewGoalForm studentId={id} />
        </div>

        <div className="mt-8">
          <AIPedagogicalReport
            studentName={student.name}
            average={average}
            attendance={attendance}
            observations={observations}
            grades={grades}
          />
        </div>

        <div className="mt-8">
          <PedagogicalInterventionPlan
            average={average}
            attendance={attendance}
          />
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-2">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">Histórico de notas</h2>

            <div className="mt-6 space-y-4">
              {grades.length === 0 ? (
                <p className="text-slate-500">Nenhuma nota registrada.</p>
              ) : (
                grades.map((grade: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{grade.title}</p>
                        <p className="text-sm text-slate-500">{grade.date}</p>
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
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-2xl font-bold">Histórico de frequência</h2>

            <div className="mt-6 space-y-4">
              {attendance.length === 0 ? (
                <p className="text-slate-500">
                  Nenhum registro de frequência.
                </p>
              ) : (
                attendance.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen size={18} className="text-violet-400" />
                      <span>{item.status}</span>
                    </div>

                    <span className="text-sm text-slate-500">{item.date}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 xl:col-span-2">
            <h2 className="text-2xl font-bold">Observações pedagógicas</h2>

            <div className="mt-6 space-y-4">
              {observations.length === 0 ? (
                <p className="text-slate-500">Nenhuma observação registrada.</p>
              ) : (
                observations.map((observation: any, index: number) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm text-violet-300">
                        {observation.category}
                      </span>

                      <span className="text-sm text-slate-500">
                        {new Date(observation.created_at).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>

                    <p className="leading-7 text-slate-300">
                      {observation.content}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 xl:col-span-2">
            <h2 className="text-2xl font-bold">Metas pedagógicas</h2>

            <div className="mt-6 space-y-4">
              {goals.length === 0 ? (
                <p className="text-slate-500">Nenhuma meta cadastrada.</p>
              ) : (
                goals.map((goal: any) => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{goal.title}</p>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
                          {goal.status}
                        </span>

                        {goal.status !== "Concluída" && (
                          <CompleteGoalButton goalId={goal.id} />
                        )}
                      </div>
                    </div>

                    <p className="mt-3 leading-7 text-slate-300">
                      {goal.description}
                    </p>
                  </div>
                ))
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

      <p className="text-slate-400">{title}</p>
      <h3 className="mt-3 text-4xl font-bold">{value}</h3>
    </div>
  );
}