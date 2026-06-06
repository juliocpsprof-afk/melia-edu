"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Search, UserRound, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Student = {
  id: string;
  name: string | null;
  class_id: string | null;
};

type ClassInfo = {
  id: string;
  name: string | null;
  description: string | null;
};

const avatarThemes = [
  "from-cyan-400 via-blue-500 to-indigo-600",
  "from-purple-500 via-fuchsia-500 to-pink-500",
  "from-emerald-400 via-green-500 to-teal-600",
  "from-orange-400 via-red-500 to-pink-600",
  "from-indigo-400 via-violet-500 to-purple-700",
  "from-yellow-300 via-orange-400 to-red-500",
];

function getShortName(fullName: string | null) {
  if (!fullName) return "Aluno sem nome";

  const parts = fullName.trim().split(" ").filter(Boolean);

  if (parts.length <= 2) return parts.join(" ");

  return `${parts[0]} ${parts[1]}`;
}

function getInitials(name: string | null) {
  const shortName = getShortName(name);
  const parts = shortName.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getTheme(id: string) {
  const total = id.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return avatarThemes[total % avatarThemes.length];
}

function normalizeText(value: string | null) {
  return (value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export default function StudentList({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [classResponse, studentsResponse] = await Promise.all([
        supabase
          .from("classes")
          .select("id, name, description")
          .eq("id", classId)
          .single(),

        supabase
          .from("students")
          .select("id, name, class_id")
          .eq("class_id", classId)
          .eq("archived", false)
          .order("name", { ascending: true }),
      ]);

      if (classResponse.error) {
        console.error("Erro ao carregar turma:", classResponse.error.message);
      }

      if (studentsResponse.error) {
        console.error("Erro ao carregar alunos:", studentsResponse.error.message);
      }

      setClassInfo(classResponse.data || null);
      setStudents((studentsResponse.data || []) as Student[]);
      setLoading(false);
    }

    loadData();
  }, [classId]);

  const visibleStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return students.filter((student) => Boolean(student.name));
    }

    return students
      .filter((student) => Boolean(student.name))
      .filter((student) => {
        const fullName = normalizeText(student.name);
        const shortName = normalizeText(getShortName(student.name));

        return (
          fullName.includes(normalizedSearch) ||
          shortName.includes(normalizedSearch)
        );
      });
  }, [students, search]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
        <div className="rounded-[32px] border border-cyan-500/20 bg-cyan-500/10 px-8 py-6 text-center shadow-2xl shadow-cyan-500/20">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-cyan-400 border-t-transparent" />
          <p className="font-bold">Carregando alunos...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10">
      <div className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      <div className="absolute -right-32 top-80 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl" />

      <section className="relative z-10 mx-auto max-w-6xl">
        <Link
          href="/aluno"
          className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 backdrop-blur transition hover:bg-white/10"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para turmas
        </Link>

        <div className="mb-6 overflow-hidden rounded-[36px] border border-white/10 bg-white/[0.03] p-6 shadow-2xl backdrop-blur sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-300">
            <Users className="h-4 w-4" />
            Escolha seu nome
          </div>

          <h1 className="mt-6 break-words text-4xl font-black leading-tight text-white sm:text-5xl">
            {classInfo?.name || "Turma"}
          </h1>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
            {classInfo?.description ||
              "Encontre seu nome abaixo para continuar o acesso ao portal."}
          </p>

          <div className="mt-6 flex max-w-xl items-center gap-3 rounded-3xl border border-slate-800 bg-slate-950/80 px-4 py-3">
            <Search className="h-5 w-5 text-cyan-300" />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar meu nome..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {visibleStudents.length === 0 ? (
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-8 text-center text-slate-300">
            {search.trim()
              ? "Nenhum aluno encontrado com esse nome."
              : "Nenhum aluno encontrado nesta turma."}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStudents.map((student, index) => {
              const gradient = getTheme(student.id);

              return (
                <Link
                  key={student.id}
                  href={`/aluno/login?studentId=${student.id}&classId=${classId}`}
                  className="group relative overflow-hidden rounded-[32px] border border-white/10 bg-slate-900/80 p-5 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/30 hover:bg-slate-900 hover:shadow-2xl hover:shadow-cyan-500/10"
                  style={{
                    animationDelay: `${index * 60}ms`,
                  }}
                >
                  <div
                    className={`absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-3xl transition duration-500 group-hover:scale-150 group-hover:opacity-25`}
                  />

                  <div className="relative z-10 flex items-center gap-4">
                    <div
                      className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[28px] bg-gradient-to-br ${gradient} text-xl font-black text-white shadow-xl`}
                    >
                      {getInitials(student.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                        Aluno
                      </p>

                      <h2 className="mt-1 truncate text-xl font-black text-white">
                        {getShortName(student.name)}
                      </h2>

                      <p className="mt-1 text-sm text-slate-400">
                        Entrar com PIN
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} transition duration-300 group-hover:translate-x-1`}
                    >
                      <ArrowRight className="h-5 w-5 text-white" />
                    </div>
                  </div>

                  <div className="relative z-10 mt-5 flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <UserRound className="h-4 w-4 text-cyan-300" />
                    Toque no seu nome para continuar
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