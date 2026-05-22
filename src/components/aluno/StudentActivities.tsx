"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

type Activity = {
  id: string;
  class_id: string | null;
  title: string | null;
  description: string | null;
  start_date: string | null;
  due_date: string | null;
  archived?: boolean | null;
  created_at?: string | null;
};

type Submission = {
  id: string;
  activity_id: string | null;
  student_id: string | null;
  status: string | null;
};

function formatDate(date: string | null) {
  if (!date) {
    return "Sem data";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sem data";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function getTodayDateOnly() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return today;
}

function getDateOnly(date: string | null) {
  if (!date) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate;
}

function getDaysBetween(targetDate: string | null) {
  const date = getDateOnly(targetDate);

  if (!date) {
    return null;
  }

  const today = getTodayDateOnly();
  const diff = date.getTime() - today.getTime();

  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isDelivered(status: string | null) {
  const normalizedStatus = status?.trim().toLowerCase() || "";

  return (
    normalizedStatus === "submitted" ||
    normalizedStatus === "entregue" ||
    normalizedStatus === "delivered" ||
    normalizedStatus === "corrigida" ||
    normalizedStatus === "corrigido"
  );
}

function getActivityStatus({
  activity,
  delivered,
}: {
  activity: Activity;
  delivered: boolean;
}) {
  if (delivered) {
    return {
      label: "Entregue",
      description: "Atividade já registrada como entregue.",
      badgeClass: "bg-emerald-500/20 text-emerald-300",
      cardClass:
        "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:shadow-emerald-500/10",
      icon: CheckCircle2,
    };
  }

  const daysToStart = getDaysBetween(activity.start_date);
  const daysToDue = getDaysBetween(activity.due_date);

  if (daysToStart !== null && daysToStart > 0) {
    return {
      label:
        daysToStart === 1
          ? "Começa amanhã"
          : `Começa em ${daysToStart} dias`,
      description: `Disponível a partir de ${formatDate(activity.start_date)}.`,
      badgeClass: "bg-cyan-500/20 text-cyan-300",
      cardClass:
        "border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:shadow-cyan-500/10",
      icon: CalendarDays,
    };
  }

  if (daysToDue === null) {
    return {
      label: "Sem prazo",
      description: "Esta atividade não possui data de entrega cadastrada.",
      badgeClass: "bg-slate-700/60 text-slate-300",
      cardClass:
        "border-slate-800 bg-slate-900/70 hover:border-cyan-500/20 hover:shadow-cyan-500/10",
      icon: FileText,
    };
  }

  if (daysToDue < 0) {
    return {
      label: "Atrasada",
      description: "O prazo de entrega já passou.",
      badgeClass: "bg-red-500/20 text-red-300",
      cardClass:
        "border-red-500/20 bg-gradient-to-br from-red-500/10 to-rose-500/10 hover:shadow-red-500/10",
      icon: AlertTriangle,
    };
  }

  if (daysToDue === 0) {
    return {
      label: "Entrega hoje",
      description: "Atenção: o prazo termina hoje.",
      badgeClass: "bg-yellow-500/20 text-yellow-300",
      cardClass:
        "border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 hover:shadow-yellow-500/10",
      icon: AlertTriangle,
    };
  }

  if (daysToDue <= 3) {
    return {
      label: daysToDue === 1 ? "Falta 1 dia" : `Faltam ${daysToDue} dias`,
      description: "Prazo próximo. Organize sua entrega.",
      badgeClass: "bg-orange-500/20 text-orange-300",
      cardClass:
        "border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:shadow-orange-500/10",
      icon: Clock3,
    };
  }

  return {
    label: "Em andamento",
    description: "Atividade disponível para acompanhamento.",
    badgeClass: "bg-violet-500/20 text-violet-300",
    cardClass:
      "border-slate-800 bg-slate-900/70 hover:border-violet-500/20 hover:shadow-violet-500/10",
    icon: FileText,
  };
}

export default function StudentActivities() {
  const router = useRouter();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      const [activitiesResponse, submissionsResponse] = await Promise.all([
        supabase
          .from("activities")
          .select("*")
          .eq("class_id", parsedSession.classId)
          .order("due_date", { ascending: true }),

        supabase
          .from("submissions")
          .select("*")
          .eq("student_id", parsedSession.studentId),
      ]);

      if (activitiesResponse.error) {
        console.error(
          "Erro ao carregar atividades:",
          activitiesResponse.error.message
        );
      }

      if (submissionsResponse.error) {
        console.error(
          "Erro ao carregar entregas:",
          submissionsResponse.error.message
        );
      }

      const visibleActivities = ((activitiesResponse.data || []) as Activity[])
        .filter((activity) => activity.archived !== true)
        .map((activity) => ({
          ...activity,
          start_date:
            activity.start_date || activity.created_at?.slice(0, 10) || null,
          due_date: activity.due_date || null,
        }));

      setActivities(visibleActivities);
      setSubmissions((submissionsResponse.data || []) as Submission[]);
      setLoading(false);
    }

    loadData();
  }, [router]);

  const deliveredActivityIds = useMemo(() => {
    return submissions
      .filter((item) => isDelivered(item.status))
      .map((item) => item.activity_id)
      .filter(Boolean);
  }, [submissions]);

  const pendingActivities = useMemo(() => {
    return activities.filter(
      (activity) => !deliveredActivityIds.includes(activity.id)
    );
  }, [activities, deliveredActivityIds]);

  const reminderActivities = useMemo(() => {
    return pendingActivities.filter((activity) => {
      const daysToStart = getDaysBetween(activity.start_date);
      const daysToDue = getDaysBetween(activity.due_date);

      if (daysToStart !== null && daysToStart > 0) {
        return false;
      }

      if (daysToDue === null) {
        return false;
      }

      return daysToDue <= 3;
    });
  }, [pendingActivities]);

  const deliveredCount = activities.length - pendingActivities.length;

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Carregando atividades...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-2xl font-black sm:text-3xl">Atividades</h1>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              Acompanhe suas tarefas, data de início, prazo de entrega e
              lembretes importantes.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="shrink-0 rounded-[24px] border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 sm:rounded-[28px] sm:px-5 sm:py-4">
              <p className="text-xs text-cyan-300">Pendentes</p>

              <h2 className="mt-1 text-3xl font-black text-white sm:text-4xl">
                {pendingActivities.length}
              </h2>
            </div>

            <div className="shrink-0 rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 sm:rounded-[28px] sm:px-5 sm:py-4">
              <p className="text-xs text-emerald-300">Entregues</p>

              <h2 className="mt-1 text-3xl font-black text-white sm:text-4xl">
                {deliveredCount}
              </h2>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        {reminderActivities.length > 0 && (
          <div className="relative mb-6 overflow-hidden rounded-[32px] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-yellow-500/10 to-red-500/10 p-5 shadow-2xl shadow-orange-500/10 sm:p-6">
            <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-orange-200">
                <Sparkles className="h-4 w-4" />
                Lembretes importantes
              </div>

              <h2 className="mt-4 text-2xl font-black text-white sm:text-3xl">
                Prazos próximos de entrega
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Essas atividades estão próximas da data de entrega ou já
                passaram do prazo.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {reminderActivities.slice(0, 4).map((activity) => {
                  const status = getActivityStatus({
                    activity,
                    delivered: false,
                  });

                  return (
                    <div
                      key={activity.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl bg-orange-500/15 p-3 text-orange-300">
                          <AlertTriangle className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {activity.title || "Atividade sem título"}
                          </p>

                          <p className="mt-1 text-sm text-orange-200">
                            {status.label}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            Entrega: {formatDate(activity.due_date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activities.length === 0 ? (
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300 sm:rounded-[32px] sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-cyan-500/10 text-cyan-300">
              <FileText className="h-8 w-8" />
            </div>

            <h2 className="mt-5 text-2xl font-black text-white">
              Nenhuma atividade disponível
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
              Quando o professor cadastrar atividades para sua turma, elas
              aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {activities.map((activity) => {
              const delivered = deliveredActivityIds.includes(activity.id);
              const status = getActivityStatus({ activity, delivered });
              const StatusIcon = status.icon;

              return (
                <article
                  key={activity.id}
                  className={`group rounded-[28px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:rounded-[32px] sm:p-6 ${status.cardClass}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-bold ${status.badgeClass}`}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {status.label}
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-white">
                        {activity.title || "Atividade sem título"}
                      </h2>

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                        {activity.description || "Sem descrição cadastrada."}
                      </p>
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-white/10 text-white">
                      <FileText className="h-7 w-7" />
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-300">
                        <CalendarDays className="h-4 w-4" />
                        Início
                      </div>

                      <p className="mt-2 text-lg font-black text-white">
                        {formatDate(activity.start_date)}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-orange-300">
                        <Clock3 className="h-4 w-4" />
                        Entrega
                      </div>

                      <p className="mt-2 text-lg font-black text-white">
                        {formatDate(activity.due_date)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-sm leading-6 text-slate-300">
                      {status.description}
                    </p>
                  </div>

                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-400">
                    {delivered
                      ? "Você já entregou essa atividade."
                      : "Acompanhe o prazo combinado com o professor. Caso seja necessário enviar respostas ou arquivos, siga a orientação dada em sala ou nos canais informados pelo professor."}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <StudentRealtimeNotifications />
    </main>
  );
}