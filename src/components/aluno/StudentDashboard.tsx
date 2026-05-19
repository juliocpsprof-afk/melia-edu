"use client";

import StudentMobileNav from "./StudentMobileNav";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import { supabase } from "@/lib/supabase";

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

export default function StudentDashboard() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStudent() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;
      setSession(parsedSession);

      const { data, error } = await supabase
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
        .single();

      if (error || !data) {
        sessionStorage.removeItem("melia_student_session");
        router.push("/aluno");
        return;
      }

      setStudent(data as StudentData);
      setLoading(false);
    }

    loadStudent();
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("melia_student_session");
    router.push("/aluno");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando seu portal...
      </main>
    );
  }

  const attendanceValue = student?.attendance ?? 0;
  const averageValue = student?.average ?? 0;

  return (
    <main className="flex min-h-screen bg-slate-950">
      <StudentSidebar />

      <section className="flex-1">
        <StudentHeader
          studentName={student?.name || session?.studentName || "Aluno"}
          classNameValue={student?.class_name || "Turma"}
          onLogout={handleLogout}
        />

        <div className="p-6">
          <div className="mb-6 rounded-[32px] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <p className="text-sm font-medium text-cyan-300">
              Olá, {student?.name?.split(" ")[0] || "aluno"} 👋
            </p>

            <h1 className="mt-2 text-3xl font-black text-white md:text-5xl">
              Bem-vindo ao seu espaço
            </h1>

            <p className="mt-3 max-w-2xl text-slate-300">
              Aqui você acompanha suas mensagens, frequência, notas,
              atividades e links importantes da sua turma.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 shadow-2xl shadow-cyan-500/10 lg:col-span-2">
              <p className="text-sm font-medium text-cyan-300">
                Frequência
              </p>

              <h2 className="mt-3 text-5xl font-black text-white">
                {attendanceValue}%
              </h2>

              <p className="mt-4 max-w-xl text-slate-300">
                Sua presença registrada até agora. Continue acompanhando para
                não perder nenhuma aula importante.
              </p>

              <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500"
                  style={{ width: `${Math.min(attendanceValue, 100)}%` }}
                />
              </div>
            </div>

            <div className="rounded-[32px] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 shadow-2xl shadow-purple-500/10">
              <p className="text-sm font-medium text-purple-300">
                Média Geral
              </p>

              <h2 className="mt-3 text-5xl font-black text-white">
                {averageValue || "-"}
              </h2>

              <p className="mt-4 text-slate-300">
                Média cadastrada pelo professor no painel.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm font-medium text-cyan-300">Turma</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {student?.class_name || "Não informada"}
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Curso: {student?.course_name || "Não informado"}
              </p>
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm font-medium text-emerald-300">Status</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                {student?.status || "Ativo"}
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Situação atual do aluno.
              </p>
            </div>

            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
              <p className="text-sm font-medium text-pink-300">Acesso</p>
              <h2 className="mt-2 text-2xl font-black text-white">
                Portal individual
              </h2>
              <p className="mt-3 text-sm text-slate-400">
                Seus dados são carregados de forma individual.
              </p>
            </div>
          </div>
        </div>
      </section>
      <StudentMobileNav />
    </main>
  );
}