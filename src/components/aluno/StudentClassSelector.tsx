"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type ClassItem = {
  id: string;
  name: string | null;
  description: string | null;
  status: string | null;
  students: { id: string }[];
};

const cardColors = [
  "from-blue-500 to-cyan-500",
  "from-purple-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-orange-500 to-amber-500",
  "from-indigo-500 to-violet-500",
  "from-rose-500 to-red-500",
];

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
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando turmas...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-6xl">
        <div className="mb-10">
          <p className="mb-2 text-sm font-medium text-cyan-300">
            Portal do Aluno
          </p>

          <h1 className="text-3xl font-bold md:text-5xl">
            Escolha sua turma
          </h1>

          <p className="mt-3 max-w-2xl text-slate-300">
            Selecione a turma em que você está matriculado para acessar seu
            portal individual.
          </p>
        </div>

        {activeClasses.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            Nenhuma turma disponível no momento.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {activeClasses.map((classItem, index) => {
              const color = cardColors[index % cardColors.length];

              return (
                <Link
                  key={classItem.id}
                  href={`/aluno/turma/${classItem.id}`}
                  className={`group rounded-3xl bg-gradient-to-br ${color} p-[1px] transition hover:scale-[1.02]`}
                >
                  <div className="h-full rounded-3xl bg-slate-950/80 p-6 backdrop-blur">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="rounded-2xl bg-white/15 px-3 py-1 text-sm">
                        Turma
                      </div>

                      <div className="rounded-2xl bg-white/15 px-3 py-1 text-sm">
                        {classItem.students?.length || 0} alunos
                      </div>
                    </div>

                    <h2 className="text-2xl font-bold">
                      {classItem.name || "Turma sem nome"}
                    </h2>

                    <p className="mt-3 line-clamp-3 text-sm text-slate-200">
                      {classItem.description || "Sem observações cadastradas."}
                    </p>

                    <div className="mt-8 text-sm font-semibold text-white">
                      Entrar na turma →
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