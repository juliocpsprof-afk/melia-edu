"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
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

function getShortName(fullName: string | null) {
  if (!fullName) return "Aluno sem nome";

  const parts = fullName.trim().split(" ").filter(Boolean);

  if (parts.length <= 2) return parts.join(" ");

  return `${parts[0]} ${parts[1]}`;
}

export default function StudentList({ classId }: { classId: string }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    return students.filter((student) => Boolean(student.name));
  }, [students]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Carregando alunos...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto max-w-5xl">
        <Link
          href="/aluno"
          className="mb-8 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-900"
        >
          ← Voltar para turmas
        </Link>

        <div className="mb-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-6">
          <p className="mb-2 text-sm font-medium text-cyan-300">
            Portal do Aluno
          </p>

          <h1 className="text-3xl font-bold md:text-5xl">
            {classInfo?.name || "Turma"}
          </h1>

          <p className="mt-3 text-slate-300">
            {classInfo?.description || "Escolha seu nome para continuar."}
          </p>
        </div>

        {visibleStudents.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 text-slate-300">
            Nenhum aluno encontrado nesta turma.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visibleStudents.map((student, index) => (
              <Link
                key={student.id}
                href={`/aluno/login?studentId=${student.id}&classId=${classId}`}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-1 hover:border-cyan-400 hover:bg-slate-800"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 text-lg font-bold text-cyan-200">
                  {index + 1}
                </div>

                <h2 className="text-xl font-semibold">
                  {getShortName(student.name)}
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Entrar com PIN →
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}