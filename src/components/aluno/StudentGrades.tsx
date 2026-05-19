"use client";

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

      const { data, error } = await supabase
        .from("grades")
        .select("*")
        .eq("student_id", parsedSession.studentId)
        .order("date", { ascending: false });

      if (error) {
        console.error(
          "Erro ao carregar notas:",
          error.message
        );
      }

      setGrades((data || []) as Grade[]);
      setLoading(false);
    }

    loadGrades();
  }, [router]);

  const average = useMemo(() => {
    if (grades.length === 0) return 0;

    const validGrades = grades.filter(
      (grade) => typeof grade.score === "number"
    );

    if (validGrades.length === 0) return 0;

    const total = validGrades.reduce(
      (acc, current) => acc + Number(current.score),
      0
    );

    return (total / validGrades.length).toFixed(1);
  }, [grades]);

  function getPerformance(score: number | null) {
    if (score === null) {
      return {
        label: "Sem nota",
        color:
          "bg-slate-500/20 text-slate-300 border-slate-500/20",
      };
    }

    if (score >= 9) {
      return {
        label: "Excelente",
        color:
          "bg-emerald-500/20 text-emerald-300 border-emerald-500/20",
      };
    }

    if (score >= 7) {
      return {
        label: "Bom",
        color:
          "bg-cyan-500/20 text-cyan-300 border-cyan-500/20",
      };
    }

    if (score >= 5) {
      return {
        label: "Atenção",
        color:
          "bg-orange-500/20 text-orange-300 border-orange-500/20",
      };
    }

    return {
      label: "Recuperação",
      color:
        "bg-red-500/20 text-red-300 border-red-500/20",
    };
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando notas...
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
              Suas Notas
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Acompanhe seu desempenho escolar
            </p>
          </div>

          <div className="rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5">
            <p className="text-xs text-purple-300">
              Média Geral
            </p>

            <h2 className="mt-2 text-4xl font-black text-white">
              {average}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="mb-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">
                  Desempenho
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Evoluindo 🚀
                </h2>
              </div>

              <TrendingUp className="h-10 w-10 text-cyan-300" />
            </div>
          </div>

          <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-300">
                  Melhor Resultado
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  {
                    Math.max(
                      ...grades.map(
                        (grade) => Number(grade.score || 0)
                      ),
                      0
                    )
                  }
                </h2>
              </div>

              <Award className="h-10 w-10 text-emerald-300" />
            </div>
          </div>

          <div className="rounded-[32px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-300">
                  Conquistas
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  {grades.filter(
                    (grade) => Number(grade.score || 0) >= 9
                  ).length}
                </h2>
              </div>

              <Star className="h-10 w-10 text-yellow-300" />
            </div>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-300">
            Nenhuma nota cadastrada ainda.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {grades.map((grade) => {
              const performance = getPerformance(
                grade.score
              );

              const scorePercentage = Math.min(
                (Number(grade.score || 0) / 10) * 100,
                100
              );

              return (
                <div
                  key={grade.id}
                  className="group rounded-[32px] border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/20 hover:shadow-2xl hover:shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div
                        className={`inline-flex rounded-2xl border px-3 py-2 text-xs font-semibold ${performance.color}`}
                      >
                        {performance.label}
                      </div>

                      <h2 className="mt-4 text-2xl font-black text-white">
                        {grade.title || "Avaliação"}
                      </h2>
                    </div>

                    <div className="flex h-20 w-20 items-center justify-center rounded-[28px] bg-gradient-to-br from-cyan-500 to-blue-600 text-3xl font-black text-white shadow-xl shadow-cyan-500/20">
                      {grade.score ?? "-"}
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-400">
                        Desempenho
                      </span>

                      <span className="font-semibold text-cyan-300">
                        {scorePercentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="h-4 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
                        style={{
                          width: `${scorePercentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950 p-5">
                    <p className="text-sm leading-relaxed text-slate-300">
                      {grade.feedback ||
                        "Sem feedback do professor."}
                    </p>
                  </div>

                  <div className="mt-5 text-sm text-slate-400">
                    {grade.date
                      ? new Date(
                          grade.date
                        ).toLocaleDateString("pt-BR")
                      : "Sem data"}
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