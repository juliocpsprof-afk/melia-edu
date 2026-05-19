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

export default function StudentDashboard() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    messages: 0,
    activities: 0,
    grades: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
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

      const [
        studentResponse,
        messagesResponse,
        activitiesResponse,
        gradesResponse,
      ] = await Promise.all([
        supabase
          .from("students")
          .select(`
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
          `)
          .eq("id", parsedSession.studentId)
          .single(),

        supabase
          .from("student_messages")
          .select("id", { count: "exact" })
          .eq("student_id", parsedSession.studentId),

        supabase
          .from("activities")
          .select("id", { count: "exact" })
          .eq("class_id", parsedSession.classId),

        supabase
          .from("grades")
          .select("id", { count: "exact" })
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

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("melia_student_session");
    router.push("/aluno");
  }

  const studentName =
    student?.name || session?.studentName || "Aluno";

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
                Olá, {firstName} 👋
              </p>

              <h1 className="mt-3 max-w-3xl text-3xl font-black leading-tight text-white sm:text-4xl xl:text-6xl">
                Seu espaço digital de aprendizado
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-300 sm:text-base">
                Acompanhe frequência, notas, mensagens,
                atividades, gamificação e recursos da sua turma
                em tempo real.
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
                  href="/aluno/atividades"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/10"
                >
                  Minhas atividades
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
                mensagens registradas
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
                Mantenha seu progresso 🚀
              </h2>

              <p className="mt-4 text-sm leading-relaxed text-slate-300">
                Complete atividades, participe do chat e
                acompanhe sua frequência para aumentar seu XP
                e desbloquear conquistas.
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
              </div>
            </div>
          </div>
        </div>
      </section>

      <StudentRealtimeNotifications />
      <StudentMobileNav />
    </main>
  );
}