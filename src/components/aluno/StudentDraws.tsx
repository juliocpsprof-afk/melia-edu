"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  History,
  Shuffle,
  Sparkles,
  Trophy,
  UserRound,
  Users,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

type DrawResult = {
  id: string;
  draw_id: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  team_number: number | null;
  created_at: string | null;
};

type DrawHistory = {
  id: string;
  draw_type: "student" | "teams";
  class_id: string | null;
  class_name: string | null;
  activity_id: string | null;
  activity_title: string | null;
  team_size: number | null;
  status: string | null;
  archived_at: string | null;
  created_at: string | null;
};

type TeamSummary = {
  draw: DrawHistory;
  result: DrawResult;
  members: DrawResult[];
};

type StudentDraw = {
  draw: DrawHistory;
  result: DrawResult;
};

function formatDateTime(value: string | null) {
  if (!value) {
    return "Data não informada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return date.toLocaleString("pt-BR");
}

function getActivityTitle(draw: DrawHistory) {
  return draw.activity_title?.trim() || "Sem atividade vinculada";
}

export default function StudentDraws() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [studentDraws, setStudentDraws] = useState<StudentDraw[]>([]);
  const [loading, setLoading] = useState(true);

  const studentInitial = useMemo(() => {
    return session?.studentName?.charAt(0).toUpperCase() || "A";
  }, [session]);

  useEffect(() => {
    async function loadDraws() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      setSession(parsedSession);
      setLoading(true);

      const { data: resultData, error: resultError } = await supabase
        .from("interaction_draw_results")
        .select(
          "id, draw_id, student_id, student_name, class_id, class_name, team_number, created_at"
        )
        .eq("student_id", parsedSession.studentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (resultError) {
        console.error("Erro ao carregar resultados dos sorteios:", resultError.message);
        setTeamSummary(null);
        setStudentDraws([]);
        setLoading(false);
        return;
      }

      const results = (resultData as DrawResult[] | null) ?? [];

      const drawIds = Array.from(
        new Set(results.map((item) => item.draw_id).filter(Boolean))
      );

      if (drawIds.length === 0) {
        setTeamSummary(null);
        setStudentDraws([]);
        setLoading(false);
        return;
      }

      const { data: drawData, error: drawError } = await supabase
        .from("interaction_draws")
        .select(
          "id, draw_type, class_id, class_name, activity_id, activity_title, team_size, status, archived_at, created_at"
        )
        .in("id", drawIds)
        .eq("status", "active");

      if (drawError) {
        console.error("Erro ao carregar dados dos sorteios:", drawError.message);
        setTeamSummary(null);
        setStudentDraws([]);
        setLoading(false);
        return;
      }

      const activeDraws = (drawData as DrawHistory[] | null) ?? [];
      const activeDrawById = new Map(activeDraws.map((draw) => [draw.id, draw]));

      const activeResults = results.filter((result) =>
        activeDrawById.has(result.draw_id)
      );

      const latestTeamResult = activeResults.find((result) => {
        const draw = activeDrawById.get(result.draw_id);

        return draw?.draw_type === "teams" && result.team_number !== null;
      });

      if (latestTeamResult && latestTeamResult.team_number !== null) {
        const { data: membersData, error: membersError } = await supabase
          .from("interaction_draw_results")
          .select(
            "id, draw_id, student_id, student_name, class_id, class_name, team_number, created_at"
          )
          .eq("draw_id", latestTeamResult.draw_id)
          .eq("team_number", latestTeamResult.team_number)
          .order("student_name", { ascending: true });

        const draw = activeDrawById.get(latestTeamResult.draw_id);

        if (!membersError && draw) {
          setTeamSummary({
            draw,
            result: latestTeamResult,
            members: (membersData as DrawResult[] | null) ?? [],
          });
        } else {
          console.error("Erro ao carregar integrantes da equipe:", membersError?.message);
          setTeamSummary(null);
        }
      } else {
        setTeamSummary(null);
      }

      const individualDraws = activeResults
        .filter((result) => {
          const draw = activeDrawById.get(result.draw_id);

          return draw?.draw_type === "student";
        })
        .map((result) => ({
          result,
          draw: activeDrawById.get(result.draw_id),
        }))
        .filter((item): item is StudentDraw => Boolean(item.draw));

      setStudentDraws(individualDraws);
      setLoading(false);
    }

    loadDraws();

    const channel = supabase
      .channel("student_draws_portal_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interaction_draws",
        },
        () => loadDraws()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interaction_draw_results",
        },
        () => loadDraws()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

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
              className="mb-2 inline-flex text-sm text-fuchsia-300 transition hover:text-fuchsia-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-2xl font-black sm:text-3xl">
              Sorteios e equipes
            </h1>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              Veja sua equipe atual, os integrantes do grupo e a atividade para
              a qual a equipe foi designada.
            </p>
          </div>

          <div className="shrink-0 rounded-[28px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 to-purple-500/10 p-4 sm:p-5">
            <p className="text-xs text-fuchsia-300">Aluno</p>

            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {studentInitial}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="relative overflow-hidden rounded-[32px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-cyan-500/10 p-6 shadow-2xl shadow-fuchsia-500/10 sm:p-8">
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-fuchsia-200">
              <Sparkles className="h-4 w-4" />
              Minha equipe atual
            </div>

            {teamSummary ? (
              <>
                <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <h2 className="text-4xl font-black text-white sm:text-5xl">
                      Equipe {teamSummary.result.team_number}
                    </h2>

                    <p className="mt-3 text-sm text-slate-300">
                      {teamSummary.draw.class_name || "Turma não informada"} •{" "}
                      {formatDateTime(teamSummary.draw.created_at)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4">
                    <p className="text-xs text-fuchsia-200">Integrantes</p>

                    <p className="mt-1 text-3xl font-black text-white">
                      {teamSummary.members.length}
                    </p>
                  </div>
                </div>

                <div className="mt-6 rounded-[28px] border border-white/10 bg-slate-950/60 p-5">
                  <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-200">
                    Atividade designada
                  </p>

                  <p className="mt-2 text-2xl font-black text-white">
                    {getActivityTitle(teamSummary.draw)}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    Essa é a atividade relacionada ao sorteio desta equipe. Se o
                    professor arquivar ou excluir o sorteio, ele sairá desta
                    tela automaticamente.
                  </p>
                </div>

                <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {teamSummary.members.map((member) => {
                    const isMe = member.student_id === session?.studentId;

                    return (
                      <div
                        key={member.id}
                        className={`flex items-center gap-3 rounded-[24px] border p-4 ${
                          isMe
                            ? "border-fuchsia-400/40 bg-fuchsia-500/15"
                            : "border-white/10 bg-slate-950/60"
                        }`}
                      >
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-white/10 text-lg font-black text-white">
                          {member.student_name.charAt(0)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-black text-white">
                            {member.student_name}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {isMe ? "Você" : member.class_name || "Colega"}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="mt-7 rounded-[28px] border border-white/10 bg-slate-950/60 p-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-fuchsia-500/10 text-fuchsia-300">
                  <Users className="h-8 w-8" />
                </div>

                <h2 className="mt-5 text-2xl font-black text-white">
                  Nenhuma equipe ativa encontrada
                </h2>

                <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                  Quando o professor fizer um sorteio de equipes ativo, o seu
                  grupo aparecerá aqui automaticamente.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6">
            <div className="flex items-center gap-3">
              <Shuffle className="h-7 w-7 text-cyan-300" />

              <div>
                <h2 className="text-2xl font-black text-white">
                  Sorteios individuais
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Registros ativos em que seu nome foi sorteado.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {studentDraws.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
                  Você ainda não apareceu em sorteios individuais ativos.
                </div>
              ) : (
                studentDraws.map((item) => (
                  <div
                    key={`${item.draw.id}-${item.result.id}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-300">
                        <UserRound className="h-6 w-6" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-black text-white">
                          {item.result.student_name}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.draw.class_name || "Turma não informada"} •{" "}
                          {formatDateTime(item.draw.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-cyan-500/10 bg-cyan-500/10 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-cyan-200">
                        Atividade
                      </p>

                      <p className="mt-1 font-black text-white">
                        {getActivityTitle(item.draw)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[32px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6">
            <div className="flex items-center gap-3">
              <History className="h-7 w-7 text-yellow-300" />

              <div>
                <h2 className="text-2xl font-black text-white">
                  Como usar essa área
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Suas interações ficam organizadas aqui.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex items-center gap-3">
                  <Trophy className="h-5 w-5 text-yellow-300" />

                  <p className="font-bold text-white">
                    Trabalhos em equipe
                  </p>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Use a equipe exibida aqui para saber com quem você deve
                  realizar atividades em grupo e qual atividade foi relacionada
                  pelo professor.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-fuchsia-300" />

                  <p className="font-bold text-white">
                    Sorteios ativos
                  </p>
                </div>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Sorteios arquivados ou excluídos pelo professor não aparecem
                  mais no seu painel, mantendo esta tela sempre limpa e atual.
                </p>
              </div>

              <Link
                href="/aluno/botoes"
                className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
              >
                <div>
                  <p className="font-bold text-white">
                    Ver acessos rápidos
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Links enviados pelo professor.
                  </p>
                </div>

                <ArrowRight className="h-5 w-5 text-white transition group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <StudentRealtimeNotifications />
    </main>
  );
}