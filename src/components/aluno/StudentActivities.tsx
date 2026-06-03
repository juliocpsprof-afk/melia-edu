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
  ExternalLink,
  FileText,
  Link2,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

type ActivityLink = {
  label: string;
  url: string;
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
  activity_links?: ActivityLink[] | null;
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

function getSafeUrl(value: string) {
  const url = value.trim();

  if (!url) {
    return "#";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

function normalizeActivityLinks(value: unknown): ActivityLink[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const link = item as {
        label?: unknown;
        url?: unknown;
      };

      const url = typeof link.url === "string" ? link.url.trim() : "";

      if (!url) {
        return null;
      }

      return {
        label:
          typeof link.label === "string" && link.label.trim()
            ? link.label.trim()
            : "Link da atividade",
        url,
      };
    })
    .filter(Boolean) as ActivityLink[];
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

function TextWithClickableLinks({ text }: { text: string }) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/gi;
  const parts = text.split(urlRegex);

  return (
    <>
      {parts.map((part, index) => {
        const isUrl = urlRegex.test(part);
        urlRegex.lastIndex = 0;

        if (!isUrl) {
          return <span key={`${part}-${index}`}>{part}</span>;
        }

        const cleanPart = part.replace(/[),.;!?]+$/, "");
        const trailing = part.slice(cleanPart.length);

        return (
          <span key={`${part}-${index}`}>
            <a
              href={getSafeUrl(cleanPart)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-cyan-300 underline decoration-cyan-300/40 underline-offset-4 transition hover:text-cyan-200"
            >
              {cleanPart}
            </a>
            {trailing}
          </span>
        );
      })}
    </>
  );
}

function ActivityLinksList({ links }: { links: ActivityLink[] }) {
  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-cyan-200">
        <Link2 className="h-4 w-4" />
        Links da atividade
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {links.map((link, index) => (
          <a
            key={`${link.url}-${index}`}
            href={getSafeUrl(link.url)}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/60 px-4 py-3 text-sm transition hover:border-cyan-300/50 hover:bg-cyan-500/15"
          >
            <span className="min-w-0 truncate font-bold text-cyan-100">
              {link.label}
            </span>

            <ExternalLink className="h-4 w-4 shrink-0 text-cyan-300 transition group-hover:translate-x-0.5" />
          </a>
        ))}
      </div>
    </div>
  );
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
          activity_links: normalizeActivityLinks(activity.activity_links),
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
              Acompanhe suas tarefas, data de início, prazo de entrega, links e
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

                          <p className="mt-1 text-xs text-orange-200">
                            {status.label} • Entrega:{" "}
                            {formatDate(activity.due_date)}
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
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-slate-500" />

            <h2 className="mt-4 text-2xl font-black text-white">
              Nenhuma atividade disponível
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Quando o professor criar atividades para sua turma, elas
              aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {activities.map((activity) => {
              const delivered = deliveredActivityIds.includes(activity.id);

              const status = getActivityStatus({
                activity,
                delivered,
              });

              const StatusIcon = status.icon;
              const links = normalizeActivityLinks(activity.activity_links);

              return (
                <article
                  key={activity.id}
                  className={`rounded-[32px] border p-5 shadow-xl transition hover:-translate-y-1 sm:p-6 ${status.cardClass}`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${status.badgeClass}`}
                        >
                          <StatusIcon className="h-4 w-4" />
                          {status.label}
                        </span>

                        <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-semibold text-slate-300">
                          Início: {formatDate(activity.start_date)}
                        </span>

                        <span className="rounded-full border border-white/10 bg-slate-950/50 px-3 py-1 text-xs font-semibold text-slate-300">
                          Entrega: {formatDate(activity.due_date)}
                        </span>
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-white">
                        {activity.title || "Atividade sem título"}
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-slate-300">
                        {status.description}
                      </p>

                      <div className="mt-4 whitespace-pre-wrap rounded-3xl border border-white/10 bg-slate-950/50 p-4 text-sm leading-7 text-slate-300">
                        {activity.description ? (
                          <TextWithClickableLinks text={activity.description} />
                        ) : (
                          "Sem descrição."
                        )}
                      </div>

                      <ActivityLinksList links={links} />
                    </div>
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