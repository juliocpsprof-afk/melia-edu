"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock3 } from "lucide-react";
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
  due_date: string | null;
  created_at: string | null;
};

type Submission = {
  id: string;
  activity_id: string | null;
  student_id: string | null;
  status: string | null;
};

export default function StudentActivities() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const savedSession = sessionStorage.getItem(
        "melia_student_session"
      );

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(
        savedSession
      ) as StudentSession;

      setSession(parsedSession);

      const [activitiesResponse, submissionsResponse] =
        await Promise.all([
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

      setActivities((activitiesResponse.data || []) as Activity[]);

      setSubmissions((submissionsResponse.data || []) as Submission[]);

      setLoading(false);
    }

    loadData();
  }, [router]);

  const deliveredActivities = useMemo(() => {
    return submissions
      .filter((item) => item.status === "submitted")
      .map((item) => item.activity_id);
  }, [submissions]);

  function getDaysRemaining(date: string | null) {
    if (!date) return null;

    const now = new Date();
    const due = new Date(date);

    const diff =
      due.getTime() - now.getTime();

    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando atividades...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-3xl font-black">
              Atividades
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Acompanhe suas tarefas e entregas
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-5 py-4">
            <p className="text-xs text-cyan-300">
              Pendentes
            </p>

            <h2 className="mt-1 text-2xl font-black text-white">
              {
                activities.filter(
                  (activity) =>
                    !deliveredActivities.includes(activity.id)
                ).length
              }
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        {activities.length === 0 ? (
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-300">
            Nenhuma atividade cadastrada para sua turma.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {activities.map((activity) => {
              const delivered =
                deliveredActivities.includes(activity.id);

              const remainingDays =
                getDaysRemaining(activity.due_date);

              const isUrgent =
                remainingDays !== null &&
                remainingDays <= 2;

              return (
                <div
                  key={activity.id}
                  className={`group rounded-[32px] border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                    delivered
                      ? "border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 hover:shadow-emerald-500/10"
                      : isUrgent
                      ? "border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 hover:shadow-orange-500/10"
                      : "border-slate-800 bg-slate-900/70 hover:border-cyan-500/20 hover:shadow-cyan-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex rounded-2xl px-3 py-2 text-xs font-semibold ${
                          delivered
                            ? "bg-emerald-500/20 text-emerald-300"
                            : isUrgent
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {delivered
                          ? "Entregue"
                          : isUrgent
                          ? "Urgente"
                          : "Pendente"}
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-white">
                        {activity.title || "Atividade"}
                      </h2>
                    </div>

                    <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-slate-950">
                      <CalendarDays className="h-6 w-6 text-cyan-300" />
                    </div>
                  </div>

                  <p className="mt-5 line-clamp-4 text-sm leading-relaxed text-slate-300">
                    {activity.description ||
                      "Sem descrição disponível."}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
                      <Clock3 className="h-4 w-4 text-cyan-300" />

                      <span className="text-sm">
                        {activity.due_date
                          ? new Date(
                              activity.due_date
                            ).toLocaleDateString("pt-BR")
                          : "Sem prazo"}
                      </span>
                    </div>

                    {remainingDays !== null && (
                      <div
                        className={`rounded-2xl px-4 py-3 text-sm font-semibold ${
                          remainingDays <= 0
                            ? "bg-red-500/20 text-red-300"
                            : remainingDays <= 2
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-cyan-500/20 text-cyan-300"
                        }`}
                      >
                        {remainingDays <= 0
                          ? "Prazo encerrado"
                          : `${remainingDays} dias restantes`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}