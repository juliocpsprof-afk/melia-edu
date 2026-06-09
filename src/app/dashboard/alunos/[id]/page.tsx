import {
  AlertTriangle,
  Award,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Target,
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

type GradeItem = {
  title: string;
  score: number;
  date: string;
  feedback?: string | null;
};

type AttendanceItem = {
  status: string | null;
  date: string | null;
};

type ObservationItem = {
  content: string;
  category: string | null;
  created_at: string | null;
};

type GoalItem = {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  created_at: string | null;
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Não informado";
  }

  const cleanValue = value.slice(0, 10);
  const date = new Date(`${cleanValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return date.toLocaleDateString("pt-BR");
}

function getStudentAge(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleanValue = value.slice(0, 10);
  const [yearValue, monthValue, dayValue] = cleanValue.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!year || !month || !day) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - year;
  const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  if (birthdayThisYear > todayStart) {
    age -= 1;
  }

  return age >= 0 ? age : null;
}

function getFrequencyPercentage(attendance: AttendanceItem[]) {
  if (attendance.length === 0) {
    return 0;
  }

  const positiveRecords = attendance.filter(
    (item) => item.status === "Presente" || item.status === "Atraso"
  ).length;

  return Math.round((positiveRecords / attendance.length) * 100);
}

function getStatusLabel(status: string | null | undefined) {
  if (!status) {
    return "Regular";
  }

  return status === "AtenÃ§Ã£o" ? "Atenção" : status;
}

function getPedagogicalReading({
  average,
  frequency,
  faltas,
  atrasos,
  status,
}: {
  average: number;
  frequency: number;
  faltas: number;
  atrasos: number;
  status: string;
}) {
  if (average < 6 || frequency < 75 || status === "Atenção") {
    return {
      title: "Acompanhamento prioritário",
      text: "O estudante apresenta indicadores que sugerem necessidade de acompanhamento próximo. Recomenda-se registrar intervenções, combinar metas de curto prazo e, quando necessário, envolver a família ou responsáveis.",
      tone: "attention",
    };
  }

  if (average >= 8 && frequency >= 85 && faltas <= 2 && atrasos <= 2) {
    return {
      title: "Evolução consistente",
      text: "O estudante apresenta bons indicadores de participação, rendimento e vínculo com a rotina escolar. É recomendável manter devolutivas positivas e propor desafios para ampliar o protagonismo.",
      tone: "success",
    };
  }

  return {
    title: "Acompanhamento regular",
    text: "O estudante apresenta trajetória dentro do esperado, mas ainda pode evoluir com metas claras, devolutivas frequentes e acompanhamento das pequenas mudanças de participação, presença e desempenho.",
    tone: "regular",
  };
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

  const grades = ((student.grades ?? []) as GradeItem[]).sort((a, b) =>
    String(b.date ?? "").localeCompare(String(a.date ?? ""))
  );

  const normalizedGrades = grades.map((item) => ({
    title: item.title ?? "Atividade sem título",
    score: Number(item.score ?? 0),
    date: item.date ?? "",
    feedback: item.feedback ?? undefined,
  }));

  const attendance = ((student.attendance ?? []) as AttendanceItem[]).sort(
    (a, b) => String(b.date ?? "").localeCompare(String(a.date ?? ""))
  );

  const normalizedAttendance = attendance.map((item) => ({
    status: item.status ?? "Sem registro",
    date: item.date ?? "",
  }));

  const observations = ((student.observations ?? []) as ObservationItem[]).sort(
    (a, b) => String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  );

  const normalizedObservations = observations.map((item) => ({
    content: item.content ?? "",
    category: item.category ?? "Pedagógica",
    created_at: item.created_at ?? "",
  }));

  const goals = ((student.goals ?? []) as GoalItem[]).sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? ""))
  );

  const average =
    grades.length > 0
      ? grades.reduce((sum: number, item) => sum + Number(item.score), 0) /
        grades.length
      : Number(student.average ?? 0);

  const presencas = attendance.filter(
    (item) => item.status === "Presente"
  ).length;

  const faltas = attendance.filter(
    (item) => item.status === "Falta"
  ).length;

  const atrasos = attendance.filter(
    (item) => item.status === "Atraso"
  ).length;

  const frequency = getFrequencyPercentage(attendance);
  const activeGoals = goals.filter((goal) => goal.status !== "Concluída").length;
  const completedGoals = goals.filter((goal) => goal.status === "Concluída").length;
  const defaultPin = getDefaultStudentPin(student.name || "Aluno");
  const hasPersonalPin = student.must_change_pin === false;
  const currentPinStatus = hasPersonalPin
    ? "PIN pessoal criado"
    : "Usando PIN inicial ou resetado";
  const age = getStudentAge(student.birth_date);
  const status = getStatusLabel(student.status);
  const reading = getPedagogicalReading({
    average,
    frequency,
    faltas,
    atrasos,
    status,
  });
  const latestObservation = observations[0];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-6">
        <div className="overflow-hidden rounded-[2rem] border border-violet-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950/40 p-6 shadow-2xl shadow-violet-950/20">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-[2rem] bg-violet-500 text-4xl font-black text-white shadow-xl shadow-violet-500/20">
                {student.name?.charAt(0) || "A"}

                <span className="absolute -bottom-2 -right-2 rounded-2xl border border-slate-800 bg-slate-950 px-3 py-1 text-xs font-black text-violet-200">
                  {status}
                </span>
              </div>

              <div>
                <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-200">
                  <UserRound size={14} />
                  Painel individual do aluno
                </p>

                <h1 className="text-4xl font-black tracking-tight text-white">
                  {student.name}
                </h1>

                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-slate-800/80 px-3 py-1 font-semibold text-slate-200">
                    {student.class_name || "Sem turma"}
                  </span>

                  <span className="rounded-full bg-slate-800/80 px-3 py-1 font-semibold text-slate-200">
                    {student.course_name || "Sem curso"}
                  </span>

                  <span className="rounded-full bg-slate-800/80 px-3 py-1 font-semibold text-slate-200">
                    {age !== null ? `${age} anos` : "Idade não informada"}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
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
                courseName={student.course_name}
                email={student.email}
                phone={student.phone}
                birthDate={student.birth_date}
                status={status}
                average={average.toFixed(1)}
                frequency={frequency}
                grades={normalizedGrades}
                attendance={normalizedAttendance}
                observations={normalizedObservations}
                goals={goals}
              />

              <ResetStudentPinButton
                studentId={student.id}
                studentName={student.name}
              />
            </div>
          </div>
        </div>
      </header>

      <section id="student-profile-content" className="space-y-8 p-6">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <InfoCard
            title="Média geral"
            value={average.toFixed(1)}
            description={grades.length > 0 ? `${grades.length} nota(s)` : "Sem notas lançadas"}
            icon={<TrendingUp />}
            tone="violet"
          />

          <InfoCard
            title="Frequência"
            value={`${frequency}%`}
            description={`P: ${presencas} • F: ${faltas} • A: ${atrasos}` }
            icon={<CalendarDays />}
            tone={frequency < 75 ? "amber" : "emerald"}
          />

          <InfoCard
            title="Observações"
            value={String(observations.length)}
            description={
              latestObservation
                ? `Última: ${formatDate(latestObservation.created_at)}`
                : "Nenhuma observação"
            }
            icon={<BookOpen />}
            tone="blue"
          />

          <InfoCard
            title="Metas ativas"
            value={String(activeGoals)}
            description={`${completedGoals} meta(s) concluída(s)`}
            icon={<Target />}
            tone="cyan"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-2xl font-black text-white">
                  Dados individuais
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Visão organizada para consulta rápida antes de atendimentos,
                  devolutivas, reuniões com família ou registros pedagógicos.
                </p>
              </div>

              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  reading.tone === "attention"
                    ? "bg-amber-500/10 text-amber-300"
                    : reading.tone === "success"
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "bg-blue-500/10 text-blue-300"
                }`}
              >
                {reading.title}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ProfileField
                label="Nome completo"
                value={student.name || "Não informado"}
                icon={<UserRound size={18} />}
              />

              <ProfileField
                label="Nascimento"
                value={`${formatDate(student.birth_date)}${
                  age !== null ? ` • ${age} anos` : ""
                }`}
                icon={<CalendarDays size={18} />}
              />

              <ProfileField
                label="Turma"
                value={student.class_name || "Sem turma"}
                icon={<GraduationCap size={18} />}
              />

              <ProfileField
                label="Curso"
                value={student.course_name || "Sem curso"}
                icon={<BookOpen size={18} />}
              />

              <ProfileField
                label="E-mail"
                value={student.email || "Não informado"}
                icon={<Mail size={18} />}
              />

              <ProfileField
                label="Telefone"
                value={student.phone || "Não informado"}
                icon={<Phone size={18} />}
              />
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                <KeyRound size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-black text-white">
                  Acesso ao Portal do Aluno
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-300">
                  O PIN inicial segue o padrão da escola: primeiro nome do aluno
                  em letras minúsculas seguido de <strong>123</strong>. O aluno
                  pode trocar esse PIN dentro do portal.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                PIN padrão/reset
              </p>

              <p className="mt-1 text-2xl font-black text-cyan-200">
                {defaultPin}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-2xl font-black text-white">
                Leitura pedagógica rápida
              </h2>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                {reading.text}
              </p>
            </div>

            <div className="grid min-w-[260px] grid-cols-3 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 text-center">
              <MiniMetric label="Notas" value={String(grades.length)} />
              <MiniMetric label="Faltas" value={String(faltas)} />
              <MiniMetric label="Atrasos" value={String(atrasos)} />
            </div>
          </div>
        </div>

        <div>
          <NewObservationForm studentId={id} />
        </div>

        <div>
          <NewGoalForm studentId={id} />
        </div>

        <div>
          <AIPedagogicalReport
            studentName={student.name}
            average={average}
            attendance={normalizedAttendance}
            observations={normalizedObservations}
            grades={normalizedGrades}
          />
        </div>

        <div>
          <PedagogicalInterventionPlan
            average={average}
            attendance={normalizedAttendance}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Histórico de notas</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Desempenho registrado nas atividades.
                </p>
              </div>

              <BarChart3 className="text-violet-300" />
            </div>

            <div className="mt-6 space-y-4">
              {grades.length === 0 ? (
                <p className="text-slate-500">Nenhuma nota registrada.</p>
              ) : (
                grades.map((grade, index) => (
                  <div
                    key={`${grade.title}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-semibold">{grade.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatDate(grade.date)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-violet-500/10 px-4 py-2 font-black text-violet-300">
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

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Histórico de frequência</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Visão compacta dos últimos registros individuais.
                </p>
              </div>

              <Clock3 className="text-cyan-300" />
            </div>

            {attendance.length === 0 ? (
              <p className="mt-6 text-slate-500">
                Nenhum registro de frequência.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-4 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 text-center">
                  <MiniMetric label="Total" value={String(attendance.length)} />
                  <MiniMetric label="Pres." value={String(presencas)} />
                  <MiniMetric label="Faltas" value={String(faltas)} />
                  <MiniMetric label="Atrasos" value={String(atrasos)} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {attendance.slice(0, 28).map((item, index) => {
                    const status = item.status || "Sem registro";
                    const chipStyle =
                      status === "Presente"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                        : status === "Atraso"
                        ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
                        : status === "Falta"
                        ? "border-red-500/30 bg-red-500/10 text-red-200"
                        : "border-slate-700 bg-slate-800/60 text-slate-300";

                    const shortStatus =
                      status === "Presente"
                        ? "P"
                        : status === "Atraso"
                        ? "A"
                        : status === "Falta"
                        ? "F"
                        : "SR";

                    return (
                      <span
                        key={`${item.date}-${index}`}
                        title={`${formatDate(item.date)} • ${status}`}
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold ${chipStyle}`}
                      >
                        <span>{formatDate(item.date).slice(0, 5)}</span>
                        <span className="rounded-full bg-slate-950/50 px-1.5 py-0.5 text-[10px]">
                          {shortStatus}
                        </span>
                      </span>
                    );
                  })}
                </div>

                {attendance.length > 28 && (
                  <p className="text-xs text-slate-500">
                    Exibindo os 28 registros mais recentes. O histórico completo
                    continua disponível na área de frequência.
                  </p>
                )}

                <p className="text-xs text-slate-500">
                  Legenda: P = presente • A = atraso • F = falta • SR = sem registro.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Observações pedagógicas</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Linha do tempo de registros e intervenções.
                </p>
              </div>

              <BookOpen className="text-blue-300" />
            </div>

            <div className="mt-6 space-y-4">
              {observations.length === 0 ? (
                <p className="text-slate-500">Nenhuma observação registrada.</p>
              ) : (
                observations.map((observation, index) => (
                  <div
                    key={`${observation.created_at}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-sm font-semibold text-violet-300">
                        {observation.category || "Pedagógica"}
                      </span>

                      <span className="text-sm text-slate-500">
                        {formatDate(observation.created_at)}
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

          <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6 xl:col-span-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black">Metas pedagógicas</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Objetivos definidos para acompanhamento do aluno.
                </p>
              </div>

              <Award className="text-amber-300" />
            </div>

            <div className="mt-6 space-y-4">
              {goals.length === 0 ? (
                <p className="text-slate-500">Nenhuma meta cadastrada.</p>
              ) : (
                goals.map((goal) => (
                  <div
                    key={goal.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="font-semibold">{goal.title}</p>

                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
                          {goal.status || "Em andamento"}
                        </span>

                        {goal.status !== "Concluída" && (
                          <CompleteGoalButton goalId={goal.id} />
                        )}
                      </div>
                    </div>

                    <p className="mt-3 leading-7 text-slate-300">
                      {goal.description || "Meta sem descrição."}
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
  description,
  icon,
  tone,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  tone: "violet" | "emerald" | "amber" | "blue" | "cyan";
}) {
  const styles = {
    violet: "bg-violet-500/15 text-violet-300",
    emerald: "bg-emerald-500/15 text-emerald-300",
    amber: "bg-amber-500/15 text-amber-300",
    blue: "bg-blue-500/15 text-blue-300",
    cyan: "bg-cyan-500/15 text-cyan-300",
  };

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
      <div
        className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${styles[tone]}`}
      >
        {icon}
      </div>

      <p className="text-slate-400">{title}</p>
      <h3 className="mt-3 text-4xl font-black">{value}</h3>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function ProfileField({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-500">
        <span className="text-violet-300">{icon}</span>
        {label}
      </div>

      <p className="break-words font-semibold text-white">{value}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-r border-slate-800 px-4 py-3 last:border-r-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-xl font-black text-white">{value}</p>
    </div>
  );
}
