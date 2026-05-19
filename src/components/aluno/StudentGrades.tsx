"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Award, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
};

type Grade = {
  id: string;
  title: string | null;
  score: number | null;
  date: string | null;
  feedback: string | null;
};

export default function StudentGrades() {
  const router = useRouter();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadGrades() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", parsedSession.studentId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Erro ao carregar notas:", error.message);
      }

      setGrades((data || []) as Grade[]);
      setLoading(false);
    }

    loadGrades();
  }, [router]);

  const average = useMemo(() => {
    const validGrades = grades.filter((grade) => typeof grade.score === "number");

    if (validGrades.length === 0) return "0.0";

    const total = validGrades.reduce(
      (acc, current) => acc + Number(current.score),
      0
    );

    return (total / validGrades.length).toFixed(1);
  }, [grades]);

  const bestScore = Math.max(
    ...grades.map((grade) => Number(grade.score || 0)),
    0
  );

  const achievements = grades.filter(
    (grade) => Number(grade.score || 0) >= 9
  ).length;

  function getPerformance(score: number | null) {
    if (score === null) {
      return {
        label: "Sem nota",
        color: "bg-slate-500/20 text-slate-300 border-slate-500/20",
      };
    }

    if (score >= 9) {
      return {
        label: "Excelente",
        color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/20",
      };
    }

    if (score >= 7) {
      return {
        label: "Bom",
        color: "bg-cyan-500/20 text-cyan-300 border-cyan-500/20",
      };
    }

    if (score >= 5) {
      return {
        label: "Atenção",
        color: "bg-orange-500/20 text-orange-300 border-orange-500/20",
      };
    }

    return {
      label: "Recuperação",
      color: "bg-red-500/20 text-red-300 border-red-500/20",
    };
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Carregando notas...
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

            <h1 className="text-2xl font-black sm:text-3xl">Suas Notas</h1>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              Acompanhe seu desempenho escolar de forma simples e visual.
            </p>
          </div>

          <div className="shrink-0 rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-4 sm:p-5">
            <p className="text-xs text-purple-300">Média Geral</p>

            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {average}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        <div className="mb-6 grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
          <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 sm:rounded-[32px] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm text-cyan-300">Desempenho</p>

                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  Evoluindo
                </h2>
              </div>

              <TrendingUp className="h-9 w-9 shrink-0 text-cyan-300 sm:h-10 sm:w-10" />
            </div>
          </div>

          <div className="rounded-[28px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-5 sm:rounded-[32px] sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-emerald-300">Melhor Resultado</p>

                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {bestScore}
                </h2>
              </div>

              <Award className="h-9 w-9 shrink-0 text-emerald-300 sm:h-10 sm:w-10" />
            </div>
          </div>

          <div className="rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-5 sm:rounded-[32px] sm:p-6 md:col-span-2 xl:col-span-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-yellow-300">Conquistas</p>

                <h2 className="mt-2 text-2xl font-black text-white sm:text-3xl">
                  {achievements}
                </h2>
              </div>

              <Star className="h-9 w-9 shrink-0 text-yellow-300 sm:h-10 sm:w-10" />
            </div>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300 sm:rounded-[32px] sm:p-10">
            Nenhuma nota cadastrada ainda.
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
            {grades.map((grade) => {
              const performance = getPerformance(grade.score);
              const scorePercentage = Math.min(
                (Number(grade.score || 0) / 10) * 100,
                100
              );

              return (
                <div
                  key={grade.id}
                  className="group rounded-[28px] border border-slate-800 bg-slate-900/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/20 hover:shadow-2xl hover:shadow-cyan-500/10 sm:rounded-[32px] sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div
                        className={`inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold ${performance.color}`}
                      >
                        {performance.label}
                      </div>

                      <h2 className="mt-4 break-words text-xl font-black text-white sm:text-2xl">
                        {grade.title || "Avaliação"}
                      </h2>
                    </div>

                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl font-black text-white shadow-xl shadow-cyan-500/20 sm:h-20 sm:w-20 sm:rounded-[28px] sm:text-3xl">
                      {grade.score ?? "-"}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-400">Desempenho</span>

                      <span className="font-semibold text-cyan-300">
                        {scorePercentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-4 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
                        style={{ width: `${scorePercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
                    <p className="break-words text-sm leading-relaxed text-slate-300">
                      {grade.feedback || "Sem feedback do professor."}
                    </p>
                  </div>

                  <div className="mt-5 text-sm text-slate-400">
                    {grade.date
                      ? new Date(grade.date).toLocaleDateString("pt-BR")
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