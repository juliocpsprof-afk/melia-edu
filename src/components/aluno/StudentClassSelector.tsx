"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  students: { id: string }[];
};

const cardThemes = [
  {
    gradient: "from-cyan-400 via-blue-500 to-indigo-600",
    glow: "shadow-cyan-500/30",
  },
  {
    gradient: "from-purple-500 via-fuchsia-500 to-pink-500",
    glow: "shadow-fuchsia-500/30",
  },
  {
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    glow: "shadow-emerald-500/30",
  },
  {
    gradient: "from-orange-400 via-red-500 to-pink-600",
    glow: "shadow-orange-500/30",
  },
  {
    gradient: "from-indigo-400 via-violet-500 to-purple-700",
    glow: "shadow-violet-500/30",
  },
  {
    gradient: "from-yellow-300 via-orange-400 to-red-500",
    glow: "shadow-yellow-500/30",
  },
];

function getThemeById(id: string) {
  const total = id
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return cardThemes[total % cardThemes.length];
}

export default function StudentClassSelector() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadClasses() {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          id,
          name,
          description,
          status,
          students(id)
        `)
        .order("name", { ascending: true });

      if (error) {
        console.error("Erro ao carregar turmas:", error.message);
        setLoading(false);
        return;
      }

      setClasses((data || []) as ClassItem[]);
      setLoading(false);
    }

    loadClasses();
  }, []);

  const activeClasses = useMemo(() => {
    return classes.filter((item) => item.status !== "inactive");
  }, [classes]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="rounded-[32px] border border-cyan-500/20 bg-cyan-500/10 px-8 py-6 text-center shadow-2xl shadow-cyan-500/20">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="font-bold">Carregando turmas...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="absolute -left-32 top-20 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-32 top-72 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

      <section className="relative z-10 mx-auto max-w-7xl">
        <div className="mb-10 overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Portal do Aluno
          </div>

          <h1 className="mt-6 max-w-4xl text-4xl font-black leading-tight text-white sm:text-5xl lg:text-7xl">
            Escolha sua turma
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Selecione a turma em que você está matriculado para acessar seu
            portal individual.
          </p>
        </div>

        {activeClasses.length === 0 ? (
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 text-slate-300">
            Nenhuma turma disponível no momento.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {activeClasses.map((classItem, index) => {
              const theme = getThemeById(classItem.id);

              return (
                <Link
                  key={classItem.id}
                  href={`/aluno/turma/${classItem.id}`}
                  className={`group relative overflow-hidden rounded-[36px] bg-gradient-to-br ${theme.gradient} p-[1px] shadow-2xl ${theme.glow} transition-all duration-500 hover:-translate-y-2 hover:scale-[1.02]`}
                  style={{
                    animationDelay: `${index * 80}ms`,
                  }}
                >
                  <div className="relative h-full overflow-hidden rounded-[36px] bg-slate-950/88 p-6 backdrop-blur-xl">
                    <div
                      className={`absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${theme.gradient} opacity-25 blur-3xl transition duration-500 group-hover:scale-150 group-hover:opacity-40`}
                    />

                    <div
                      className={`absolute -bottom-20 left-8 h-36 w-36 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 blur-3xl transition duration-500 group-hover:opacity-25`}
                    />

                    <div className="relative z-10">
                      <div className="mb-8 flex items-center justify-between gap-4">
                        <div
                          className={`flex h-16 w-16 items-center justify-center rounded-[28px] bg-gradient-to-br ${theme.gradient} shadow-xl ${theme.glow}`}
                        >
                          <GraduationCap className="h-8 w-8 text-white" />
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-white" />
                            <span className="text-sm font-bold text-white">
                              {classItem.students?.length || 0} alunos
                            </span>
                          </div>
                        </div>
                      </div>

                      <h2 className="break-words text-3xl font-black text-white">
                        {classItem.name || "Turma sem nome"}
                      </h2>

                      <p className="mt-4 line-clamp-3 min-h-[64px] text-sm leading-relaxed text-slate-300">
                        {classItem.description ||
                          "Sem observações cadastradas."}
                      </p>

                      <div className="mt-8 flex items-center justify-between">
                        <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-black text-white backdrop-blur transition group-hover:bg-white/20">
                          Entrar na turma
                        </div>

                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${theme.gradient} transition duration-300 group-hover:translate-x-1`}
                        >
                          <ArrowRight className="h-5 w-5 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}