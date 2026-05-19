"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, Trophy, Users, Target } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

type DrawResult = {
  id: string;
  draw_id: string | null;
  student_id: string | null;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  team_number: number | null;
  created_at: string | null;
 interaction_draws?:
  | {
      draw_type?: string | null;
      team_size?: number | null;
      created_at?: string | null;
    }
  | {
      draw_type?: string | null;
      team_size?: number | null;
      created_at?: string | null;
    }[]
  | null;
};

export default function StudentDraws() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [results, setResults] = useState<DrawResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDraws() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;
      setSession(parsedSession);

      const { data, error } = await supabase
        .from("interaction_draw_results")
        .select(`
          id,
          draw_id,
          student_id,
          student_name,
          class_id,
          class_name,
          team_number,
          created_at,
          interaction_draws (
            draw_type,
            team_size,
            created_at
          )
        `)
        .eq("student_id", parsedSession.studentId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar sorteios:", error.message);
      }

      setResults((data || []) as DrawResult[]);
      setLoading(false);
    }

    loadDraws();
  }, [router]);

  useEffect(() => {
    if (!session?.studentId) return;

    const channel = supabase
      .channel(`student_draws_${session.studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interaction_draw_results",
          filter: `student_id=eq.${session.studentId}`,
        },
        (payload) => {
          const newResult = payload.new as DrawResult;

          setResults((current) => {
            const exists = current.some((item) => item.id === newResult.id);

            if (exists) {
              return current.map((item) =>
                item.id === newResult.id ? newResult : item
              );
            }

            return [newResult, ...current];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.studentId]);

  const latestTeam = useMemo(() => {
    return results.find((item) => item.team_number !== null);
  }, [results]);

  const individualDraws = useMemo(() => {
    return results.filter((item) => item.team_number === null);
  }, [results]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Carregando sorteios...
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
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-2xl font-black sm:text-3xl">
              Sorteios e Equipes
            </h1>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              Veja seus sorteios, equipes e participações em tempo real.
            </p>
          </div>

          <div className="shrink-0 rounded-[28px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-4 sm:p-5">
            <p className="text-xs text-fuchsia-300">Participações</p>

            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {results.length}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="mb-6 grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 shadow-2xl shadow-cyan-500/10 sm:rounded-[32px] sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-cyan-300">
                  Minha equipe atual
                </p>

                <h2 className="mt-3 break-words text-4xl font-black text-white sm:text-5xl">
                  {latestTeam?.team_number
                    ? `Equipe ${latestTeam.team_number}`
                    : "Sem equipe"}
                </h2>

                <p className="mt-4 max-w-xl text-sm text-slate-300 sm:text-base">
                  Quando o professor fizer um sorteio de equipes, sua equipe
                  aparecerá aqui automaticamente.
                </p>
              </div>

              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-cyan-500/20 sm:h-16 sm:w-16 sm:rounded-[28px]">
                <Users className="h-7 w-7 text-cyan-300 sm:h-8 sm:w-8" />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-5 shadow-2xl shadow-yellow-500/10 sm:rounded-[32px] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-yellow-300">
                  Sorteios individuais
                </p>

                <h2 className="mt-2 text-4xl font-black text-white sm:text-5xl">
                  {individualDraws.length}
                </h2>
              </div>

              <Target className="h-10 w-10 shrink-0 text-yellow-300 sm:h-12 sm:w-12" />
            </div>
          </div>
        </div>

        {results.length === 0 ? (
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300 sm:rounded-[32px] sm:p-10">
            Nenhum sorteio apareceu para você ainda.
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {results.map((result) => {
              const isTeam = result.team_number !== null;

              return (
                <div
                  key={result.id}
                  className={`group rounded-[28px] border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:rounded-[32px] sm:p-6 ${
                    isTeam
                      ? "border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 hover:shadow-cyan-500/10"
                      : "border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 hover:shadow-fuchsia-500/10"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`inline-flex rounded-2xl px-3 py-2 text-xs font-semibold ${
                          isTeam
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-fuchsia-500/20 text-fuchsia-300"
                        }`}
                      >
                        {isTeam ? "Sorteio de equipe" : "Sorteio individual"}
                      </div>

                      <h2 className="mt-4 break-words text-xl font-black text-white sm:text-2xl">
                        {isTeam
                          ? `Você está na Equipe ${result.team_number}`
                          : "Você participou de um sorteio"}
                      </h2>
                    </div>

                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl bg-slate-950">
                      {isTeam ? (
                        <Trophy className="h-6 w-6 text-cyan-300" />
                      ) : (
                        <Sparkles className="h-6 w-6 text-fuchsia-300" />
                      )}
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
                    <p className="break-words text-sm text-slate-300">
                      Aluno:{" "}
                      <span className="font-semibold text-white">
                        {result.student_name}
                      </span>
                    </p>

                    <p className="mt-2 break-words text-sm text-slate-300">
                      Turma:{" "}
                      <span className="font-semibold text-white">
                        {result.class_name || "Não informada"}
                      </span>
                    </p>

                    {isTeam && (
                      <p className="mt-2 text-sm text-slate-300">
                        Número da equipe:{" "}
                        <span className="font-semibold text-cyan-300">
                          {result.team_number}
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="mt-5 text-sm text-slate-400">
                    {result.created_at
                      ? new Date(result.created_at).toLocaleString("pt-BR")
                      : "Sem data"}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <StudentRealtimeNotifications />
    </main>
  );
}