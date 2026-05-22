"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CalendarCheck,
  Trophy,
  MessageCircle,
  BookOpen,
  Zap,
  ArrowRight,
  Sparkles,
  Users,
  ExternalLink,
  Link2,
  Shuffle,
  UserRound,
  Clock3,
} from "lucide-react";

import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import StudentMobileNav from "./StudentMobileNav";
import StudentRealtimeNotifications from "./StudentRealtimeNotifications";

import { supabase } from "@/lib/supabase";
import { getStudentTheme } from "@/lib/studentThemes";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
  loggedAt: string;
};

type StudentData = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  class_id: string | null;
  class_name: string | null;
  average: number | null;
  attendance: number | null;
  status: string | null;
  course_name: string | null;
};

type DashboardStats = {
  messages: number;
  activities: number;
  grades: number;
};

type PortalButton = {
  id: string;
  button_order: number | null;
  button_label: string | null;
  button_url: string | null;
  is_temporary?: boolean;
};

type TemporaryButton = {
  id: string;
  button_label: string | null;
  button_url: string | null;
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
  created_at: string | null;
};

type TeamSummary = {
  drawId: string;
  teamNumber: number;
  className: string;
  activityTitle: string | null;
  createdAt: string | null;
  members: DrawResult[];
};

type StudentDrawSummary = {
  drawId: string;
  studentName: string;
  className: string;
  activityTitle: string | null;
  createdAt: string | null;
};

const quickActions = [
  {
    title: "Mensagens",
    href: "/aluno/mensagens",
    icon: MessageCircle,
    color:
      "from-cyan-500/20 to-blue-500/20 border-cyan-500/20 text-cyan-300",
  },
  {
    title: "Atividades",
    href: "/aluno/atividades",
    icon: BookOpen,
    color:
      "from-purple-500/20 to-pink-500/20 border-purple-500/20 text-purple-300",
  },
  {
    title: "Notas",
    href: "/aluno/notas",
    icon: Trophy,
    color:
      "from-yellow-500/20 to-orange-500/20 border-yellow-500/20 text-yellow-300",
  },
  {
    title: "XP",
    href: "/aluno/gamificacao",
    icon: Zap,
    color:
      "from-emerald-500/20 to-green-500/20 border-emerald-500/20 text-emerald-300",
  },
];

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

function getSafeUrl(value: string | null) {
  const url = value?.trim() || "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url === "#") {
    return url;
  }

  return `https://${url}`;
}

export default function StudentDashboard() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    messages: 0,
    activities: 0,
    grades: 0,
  });

  const [portalButtons, setPortalButtons] = useState<PortalButton[]>([]);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [studentDrawSummary, setStudentDrawSummary] =
    useState<StudentDrawSummary | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudentInteractions(parsedSession: StudentSession) {
      try {
        const { data: buttonsData, error: buttonsError } = await supabase
          .from("student_portal_buttons")
          .select("id, button_order, button_label, button_url")
          .eq("student_id", parsedSession.studentId)
          .order("button_order", { ascending: true });

        if (buttonsError) {
          console.error("Erro ao carregar botões:", buttonsError.message);
        }

        const individualButtons = (
          (buttonsData as PortalButton[] | null) ?? []
        ).map((button) => ({
          ...button,
          is_temporary: false,
        }));

        let temporaryDashboardButton: PortalButton | null = null;

        const { data: temporaryButtonData, error: temporaryButtonError } =
          await supabase
            .from("class_temporary_buttons")
            .select("id, button_label, button_url")
            .eq("class_id", parsedSession.classId)
            .maybeSingle();

        if (temporaryButtonError) {
          console.error(
            "Erro ao carregar botão temporário:",
            temporaryButtonError.message
          );
        }

        const temporaryButton = temporaryButtonData as TemporaryButton | null;

        if (temporaryButton) {
          temporaryDashboardButton = {
            id: `temporary-${temporaryButton.id}`,
            button_order: 99,
            button_label: temporaryButton.button_label,
            button_url: temporaryButton.button_url,
            is_temporary: true,
          };
        }

        const mergedButtons = temporaryDashboardButton
          ? [...individualButtons, temporaryDashboardButton]
          : individualButtons;

        setPortalButtons(
          mergedButtons.sort((a, b) => {
            const orderA = a.button_order ?? 99;
            const orderB = b.button_order ?? 99;

            return orderA - orderB;
          })
        );

        const { data: resultData, error: resultError } = await supabase
          .from("interaction_draw_results")
          .select(
            "id, draw_id, student_id, student_name, class_id, class_name, team_number, created_at"
          )
          .eq("student_id", parsedSession.studentId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (resultError) {
          console.error("Erro ao carregar sorteios:", resultError.message);
          setTeamSummary(null);
          setStudentDrawSummary(null);
          return;
        }

        const studentResults = (resultData as DrawResult[] | null) ?? [];

        const drawIds = Array.from(
          new Set(studentResults.map((item) => item.draw_id).filter(Boolean))
        );

        if (drawIds.length === 0) {
          setTeamSummary(null);
          setStudentDrawSummary(null);
          return;
        }

        const { data: drawData, error: drawError } = await supabase
          .from("interaction_draws")
          .select(
            "id, draw_type, class_id, class_name, activity_id, activity_title, team_size, status, created_at"
          )
          .in("id", drawIds)
          .eq("status", "active");

        if (drawError) {
          console.error(
            "Erro ao carregar dados dos sorteios:",
            drawError.message
          );
          setTeamSummary(null);
          setStudentDrawSummary(null);
          return;
        }

        const draws = (drawData as DrawHistory[] | null) ?? [];
        const drawById = new Map(draws.map((draw) => [draw.id, draw]));

        const latestTeamResult = studentResults.find((result) => {
          const draw = drawById.get(result.draw_id);

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

          if (membersError) {
            console.error("Erro ao carregar equipe:", membersError.message);
            setTeamSummary(null);
          } else {
            const draw = drawById.get(latestTeamResult.draw_id);

            setTeamSummary({
              drawId: latestTeamResult.draw_id,
              teamNumber: latestTeamResult.team_number,
              className:
                draw?.class_name ||
                latestTeamResult.class_name ||
                parsedSession.studentName,
              activityTitle: draw?.activity_title || null,
              createdAt: draw?.created_at || latestTeamResult.created_at,
              members: (membersData as DrawResult[] | null) ?? [],
            });
          }
        } else {
          setTeamSummary(null);
        }

        const latestStudentDrawResult = studentResults.find((result) => {
          const draw = drawById.get(result.draw_id);

          return draw?.draw_type === "student";
        });

        if (latestStudentDrawResult) {
          const draw = drawById.get(latestStudentDrawResult.draw_id);

          setStudentDrawSummary({
            drawId: latestStudentDrawResult.draw_id,
            studentName: latestStudentDrawResult.student_name,
            className:
              draw?.class_name ||
              latestStudentDrawResult.class_name ||
              "Turma não informada",
            activityTitle: draw?.activity_title || null,
            createdAt: draw?.created_at || latestStudentDrawResult.created_at,
          });
        } else {
          setStudentDrawSummary(null);
        }
      } catch (error) {
        console.error("Erro ao carregar interações do aluno:", error);
        setPortalButtons([]);
        setTeamSummary(null);
        setStudentDrawSummary(null);
      }
    }

    async function loadDashboard() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      setSession(parsedSession);

      const [
        studentResponse,
        messagesResponse,
        activitiesResponse,
        gradesResponse,
      ] = await Promise.all([
        supabase
          .from("students")
          .select(
            `
            id,
            name,
            email,
            phone,
            class_id,
            class_name,
            average,
            attendance,
            status,
            course_name
          `
          )
          .eq("id", parsedSession.studentId)
          .single(),

        supabase
          .from("student_messages")
          .select("id", { count: "exact", head: true })
          .eq("student_id", parsedSession.studentId)
          .eq("sender", "teacher")
          .eq("is_read", false),

        supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .eq("class_id", parsedSession.classId)
          .eq("archived", false),

        supabase
          .from("grades")
          .select("id", { count: "exact", head: true })
          .eq("student_id", parsedSession.studentId),
      ]);

      if (studentResponse.error || !studentResponse.data) {
        sessionStorage.removeItem("melia_student_session");
        router.push("/aluno");
        return;
      }

      setStudent(studentResponse.data as StudentData);

      setStats({
        messages: messagesResponse.count || 0,
        activities: activitiesResponse.count || 0,
        grades: gradesResponse.count || 0,
      });

      await loadStudentInteractions(parsedSession);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("melia_student_session");
    router.push("/aluno");
  }

  const studentName = student?.name || session?.studentName || "Aluno";

  const firstName = useMemo(() => {
    return studentName.split(" ")[0] || "Aluno";
  }, [studentName]);

  const attendanceValue = student?.attendance ?? 0;
  const averageValue = student?.average ?? 0;

  const theme = getStudentTheme(studentName);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando portal...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <StudentSidebar />

      <section className="min-w-0 flex-1 pb-28 xl:pb-0">
        <StudentHeader
          studentName={studentName}
          classNameValue={student?.class_name || "Turma"}
          onLogout={handleLogout}
        />

        <div className="p-4 sm:p-6">
          <div
            className={`relative overflow-hidden rounded-[32px] border ${theme.border} bg-gradient-to-br ${theme.softGradient} p-6 shadow-2xl ${theme.glow}`}
          >
            <div
              className={`absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gradient-to-br ${theme.gradient} opacity-20 blur-3xl`}
            />

            <div
              className={`absolute -bottom-20 left-10 h-52 w-52 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 blur-3xl`}
            />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Portal Premium
              </div>

              <p className={`mt-6 text-sm font-medium ${theme.text}`}>
                Olá, {firstName}
              </p>

              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl xl:text-6xl">
                Seu espaço digital de aprendizado
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Acompanhe frequência, notas, mensagens, atividades,
                gamificação, equipes e recursos da sua turma em tempo real.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/aluno/gamificacao"
                  className={`inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r ${theme.gradient} px-5 py-4 text-sm font-bold text-white shadow-xl transition hover:scale-[1.02]`}
                >
                  Ver meu XP
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/aluno/sorteios"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Minha equipe
                </Link>

                <Link
                  href="/aluno/botoes"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Acessos rápidos
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div
              className={`rounded-[28px] border ${theme.border} bg-gradient-to-br ${theme.softGradient} p-5 shadow-xl ${theme.glow}`}
            >
              <div className="flex items-center justify-between">
                <CalendarCheck className={`h-10 w-10 ${theme.text}`} />

                <span
                  className={`rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold ${theme.text}`}
                >
                  frequência
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {attendanceValue}%
              </h2>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                  style={{
                    width: `${Math.min(attendanceValue, 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-5 shadow-xl shadow-yellow-500/10">
              <div className="flex items-center justify-between">
                <Trophy className="h-10 w-10 text-yellow-300" />

                <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-yellow-300">
                  média
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {averageValue || "-"}
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                desempenho escolar
              </p>
            </div>

            <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 shadow-xl shadow-cyan-500/10">
              <div className="flex items-center justify-between">
                <MessageCircle className="h-10 w-10 text-cyan-300" />

                <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-cyan-300">
                  chat
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {stats.messages}
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                mensagens não lidas
              </p>
            </div>

            <div className="rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 shadow-xl shadow-purple-500/10">
              <div className="flex items-center justify-between">
                <BookOpen className="h-10 w-10 text-purple-300" />

                <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-purple-300">
                  tarefas
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {stats.activities}
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                atividades disponíveis
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="relative overflow-hidden rounded-[32px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-cyan-500/10 p-6 shadow-2xl shadow-fuchsia-500/10">
              <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-fuchsia-500/20 blur-3xl" />
              <div className="absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" />

              <div className="relative z-10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-fuchsia-200">
                      <Users className="h-4 w-4" />
                      Minha equipe
                    </div>

                    <h2 className="mt-4 text-3xl font-black text-white">
                      {teamSummary
                        ? `Equipe ${teamSummary.teamNumber}`
                        : "Equipe ainda não sorteada"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      {teamSummary
                        ? `${teamSummary.className} • ${formatDateTime(
                            teamSummary.createdAt
                          )}`
                        : "Quando o professor sortear equipes, seu grupo aparecerá aqui."}
                    </p>

                    {teamSummary?.activityTitle && (
                      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-200">
                          Atividade
                        </p>

                        <p className="mt-1 text-sm font-bold text-white">
                          {teamSummary.activityTitle}
                        </p>
                      </div>
                    )}
                  </div>

                  <Link
                    href="/aluno/sorteios"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Ver sorteios
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {teamSummary && (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    {teamSummary.members.map((member) => {
                      const isMe = member.student_id === session?.studentId;

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                            isMe
                              ? "border-fuchsia-400/40 bg-fuchsia-500/15"
                              : "border-white/10 bg-slate-950/50"
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">
                            {member.student_name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">
                              {member.student_name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {isMe ? "Você" : member.class_name || "Colega"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {studentDrawSummary && (
                  <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <UserRound className="h-5 w-5 text-cyan-300" />

                      <div>
                        <p className="text-sm font-bold text-cyan-200">
                          Você também apareceu em sorteio individual
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDateTime(studentDrawSummary.createdAt)}
                        </p>

                        {studentDrawSummary.activityTitle && (
                          <p className="mt-2 text-xs font-semibold text-cyan-100">
                            Atividade: {studentDrawSummary.activityTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!teamSummary && !studentDrawSummary && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
                    Nenhum sorteio ativo encontrado para você no momento.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 shadow-2xl shadow-cyan-500/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-cyan-200">
                    <Link2 className="h-4 w-4" />
                    Acessos rápidos
                  </div>

                  <h2 className="mt-4 text-3xl font-black text-white">
                    Links do professor
                  </h2>

                  <p className="mt-2 text-sm text-slate-300">
                    Materiais, aulas, formulários e plataformas importantes em
                    um só lugar.
                  </p>
                </div>

                <Link
                  href="/aluno/botoes"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  Ver todos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              {portalButtons.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
                  O professor ainda não cadastrou links para você ou para sua
                  turma.
                </div>
              ) : (
                <div className="mt-6 grid gap-3">
                  {portalButtons.slice(0, 4).map((button) => (
                    <a
                      key={button.id}
                      href={getSafeUrl(button.button_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate font-black text-white">
                            {button.button_label || "Link sem nome"}
                          </p>

                          {button.is_temporary && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                              <Clock3 className="h-3 w-3" />
                              Temporário
                            </span>
                          )}
                        </div>

                        <p className="mt-1 line-clamp-1 break-all text-xs text-slate-400">
                          {button.button_url || "Sem URL"}
                        </p>
                      </div>

                      <ExternalLink className="h-5 w-5 shrink-0 text-cyan-300 transition group-hover:translate-x-1" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme.text}`}>
                  Navegação rápida
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  Explorar portal
                </h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {quickActions.map((action) => {
                const Icon = action.icon;

                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className={`group rounded-[28px] border bg-gradient-to-br p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${action.color}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 items-center justify-center rounded-[24px] bg-white/10">
                        <Icon className="h-7 w-7" />
                      </div>

                      <ArrowRight className="h-5 w-5 opacity-60 transition group-hover:translate-x-1" />
                    </div>

                    <h3 className="mt-6 text-2xl font-black text-white">
                      {action.title}
                    </h3>

                    <p className="mt-2 text-sm text-slate-300">
                      acessar agora
                    </p>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-2">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
              <p className={`text-sm ${theme.text}`}>
                Informações acadêmicas
              </p>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm text-slate-400">Turma</p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    {student?.class_name || "Não informada"}
                  </h3>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Curso</p>
                  <h3 className="mt-1 text-xl font-black text-white">
                    {student?.course_name || "Não informado"}
                  </h3>
                </div>

                <div>
                  <p className="text-sm text-slate-400">Status</p>
                  <div className="mt-2 inline-flex rounded-2xl bg-emerald-500/20 px-4 py-2 text-sm font-bold text-emerald-300">
                    {student?.status || "Ativo"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm text-purple-300">
                Continue estudando
              </p>

              <h2 className="mt-2 text-3xl font-black text-white">
                Mantenha seu progresso
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Complete atividades, participe do chat, acompanhe sua
                frequência, veja sua equipe e use os links enviados pelo
                professor.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/aluno/notas"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver notas
                </Link>

                <Link
                  href="/aluno/frequencia"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver frequência
                </Link>

                <Link
                  href="/aluno/botoes"
                  className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Ver links
                </Link>
              </div>
            </div>
          </div>
        </div>

        <StudentRealtimeNotifications />
        <StudentMobileNav />
      </section>
    </main>
  );
}