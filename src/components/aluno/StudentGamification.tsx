"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  Medal,
  Star,
  Trophy,
  Zap,
  MessageCircle,
  CalendarCheck,
  BookOpen,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
};

type Attendance = {
  id: string;
  status: string | null;
};

type Grade = {
  id: string;
  score: number | null;
};

type Submission = {
  id: string;
  status: string | null;
};

type Message = {
  id: string;
};

function isPresent(status: string | null) {
  const value = status?.toLowerCase() || "";
  return value.includes("present") || value.includes("presente");
}

export default function StudentGamification() {
  const router = useRouter();

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGamification() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      const [
        attendanceResponse,
        gradesResponse,
        submissionsResponse,
        messagesResponse,
      ] = await Promise.all([
        supabase
          .from("attendance")
          .select("id, status")
          .eq("student_id", parsedSession.studentId),

        supabase
          .from("grades")
          .select("id, score")
          .eq("student_id", parsedSession.studentId),

        supabase
          .from("submissions")
          .select("id, status")
          .eq("student_id", parsedSession.studentId),

        supabase
          .from("student_messages")
          .select("id")
          .eq("student_id", parsedSession.studentId)
          .eq("sender", "student"),
      ]);

      if (attendanceResponse.error) {
        console.error(
          "Erro ao carregar frequência:",
          attendanceResponse.error.message
        );
      }

      if (gradesResponse.error) {
        console.error("Erro ao carregar notas:", gradesResponse.error.message);
      }

      if (submissionsResponse.error) {
        console.error(
          "Erro ao carregar entregas:",
          submissionsResponse.error.message
        );
      }

      if (messagesResponse.error) {
        console.error(
          "Erro ao carregar mensagens:",
          messagesResponse.error.message
        );
      }

      setAttendance((attendanceResponse.data || []) as Attendance[]);
      setGrades((gradesResponse.data || []) as Grade[]);
      setSubmissions((submissionsResponse.data || []) as Submission[]);
      setMessages((messagesResponse.data || []) as Message[]);
      setLoading(false);
    }

    loadGamification();
  }, [router]);

  const game = useMemo(() => {
    const presences = attendance.filter((item) => isPresent(item.status)).length;

    const delivered = submissions.filter(
      (item) =>
        item.status === "submitted" ||
        item.status === "entregue" ||
        item.status === "delivered"
    ).length;

    const highGrades = grades.filter(
      (item) => Number(item.score || 0) >= 9
    ).length;

    const messagesSent = messages.length;

    const xp = presences * 10 + delivered * 25 + highGrades * 40 + messagesSent * 5;
    const level = Math.max(1, Math.floor(xp / 100) + 1);
    const currentLevelXp = xp % 100;

    const achievements = [
      {
        title: " Frequência Máxima",
        description: "Registrou pelo menos 5 presenças.",
        unlocked: presences >= 5,
        icon: CalendarCheck,
      },
      {
        title: "Aluno Participativo",
        description: "Enviou pelo menos 3 mensagens.",
        unlocked: messagesSent >= 3,
        icon: MessageCircle,
      },
      {
        title: "Lenda das Tarefas",
        description: "Entregou pelo menos 3 atividades.",
        unlocked: delivered >= 3,
        icon: BookOpen,
      },
      {
        title: "Nota Estrela",
        description: "Conquistou pelo menos uma nota 9 ou mais.",
        unlocked: highGrades >= 1,
        icon: Star,
      },
    ];

    return {
      xp,
      level,
      currentLevelXp,
      presences,
      delivered,
      highGrades,
      messagesSent,
      achievements,
    };
  }, [attendance, grades, submissions, messages]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Carregando gamificação...
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

            <h1 className="text-2xl font-black sm:text-3xl">Gamificação</h1>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              XP, nível, conquistas e progresso do aluno.
            </p>
          </div>

          <div className="shrink-0 rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-4 sm:p-5">
            <p className="text-xs text-yellow-300">Nível</p>

            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {game.level}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 sm:rounded-[32px] sm:p-6 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-cyan-300">XP total</p>

                <h2 className="mt-2 text-5xl font-black text-white sm:text-6xl">
                  {game.xp}
                </h2>
              </div>

              <Zap className="h-14 w-14 shrink-0 text-cyan-300 sm:h-16 sm:w-16" />
            </div>

            <div className="mt-6">
              <div className="mb-2 flex flex-wrap justify-between gap-2 text-sm">
                <span className="text-slate-400">Progresso do nível</span>

                <span className="font-semibold text-cyan-300">
                  {game.currentLevelXp}/100 XP
                </span>
              </div>

              <div className="h-5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
                  style={{ width: `${game.currentLevelXp}%` }}
                />
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-red-500/10 p-5 sm:rounded-[32px] sm:p-6">
            <Flame className="h-11 w-11 text-orange-300 sm:h-12 sm:w-12" />

            <p className="mt-4 text-sm text-orange-300">Streak recente</p>

            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {game.presences}
            </h2>

            <p className="mt-3 text-sm text-slate-300">
              presenças registradas
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 sm:rounded-[32px] sm:p-6">
            <CalendarCheck className="h-9 w-9 text-emerald-300" />
            <p className="mt-4 text-sm text-slate-400">Presenças</p>
            <h2 className="mt-2 text-3xl font-black">{game.presences}</h2>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 sm:rounded-[32px] sm:p-6">
            <BookOpen className="h-9 w-9 text-cyan-300" />
            <p className="mt-4 text-sm text-slate-400">Entregas</p>
            <h2 className="mt-2 text-3xl font-black">{game.delivered}</h2>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 sm:rounded-[32px] sm:p-6">
            <Trophy className="h-9 w-9 text-yellow-300" />
            <p className="mt-4 text-sm text-slate-400">Notas 9+</p>
            <h2 className="mt-2 text-3xl font-black">{game.highGrades}</h2>
          </div>

          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 sm:rounded-[32px] sm:p-6">
            <MessageCircle className="h-9 w-9 text-purple-300" />
            <p className="mt-4 text-sm text-slate-400">Mensagens</p>
            <h2 className="mt-2 text-3xl font-black">{game.messagesSent}</h2>
          </div>
        </div>

        <div className="mt-8 rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 sm:rounded-[32px] sm:p-6">
          <p className="text-sm text-purple-300">Medalhas</p>

          <h2 className="mt-2 text-xl font-black text-white sm:text-2xl">
            Conquistas desbloqueadas
          </h2>

          <div className="mt-6 grid gap-4 sm:gap-5 md:grid-cols-2">
            {game.achievements.map((achievement) => {
              const Icon = achievement.icon;

              return (
                <div
                  key={achievement.title}
                  className={`rounded-[24px] border p-5 transition-all duration-300 sm:rounded-[28px] ${
                    achievement.unlocked
                      ? "border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10"
                      : "border-slate-800 bg-slate-950 opacity-60"
                  }`}
                >
                  <div className="flex gap-4">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-3xl ${
                        achievement.unlocked ? "bg-yellow-500/20" : "bg-slate-800"
                      }`}
                    >
                      {achievement.unlocked ? (
                        <Medal className="h-7 w-7 text-yellow-300" />
                      ) : (
                        <Icon className="h-7 w-7 text-slate-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words text-lg font-black text-white">
                        {achievement.title}
                      </h3>

                      <p className="mt-1 break-words text-sm text-slate-400">
                        {achievement.description}
                      </p>

                      <p
                        className={`mt-3 text-xs font-bold ${
                          achievement.unlocked ? "text-yellow-300" : "text-slate-500"
                        }`}
                      >
                        {achievement.unlocked ? "Desbloqueada" : "Bloqueada"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <StudentRealtimeNotifications />
    </main>
  );
}