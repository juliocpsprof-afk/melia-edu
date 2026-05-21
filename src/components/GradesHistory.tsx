"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Search, Star, UserRound } from "lucide-react";

type Grade = {
  title: string;
  score: number;
  date: string;
};

type Student = {
  id: string;
  name: string;
  class_name: string;
  grades: Grade[];
};

export function GradesHistory({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [openStudentId, setOpenStudentId] = useState("");

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getAverage(grades: Grade[]) {
    if (grades.length === 0) return 0;

    return (
      grades.reduce((sum, grade) => sum + Number(grade.score), 0) /
      grades.length
    );
  }

  function formatDate(date: string) {
    if (!date) return "Sem data";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("pt-BR");
  }

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const gradesText = student.grades
        .map((grade) => `${grade.title} ${grade.date}`)
        .join(" ");

      const searchableText = normalizeText(`
        ${student.name}
        ${student.class_name}
        ${gradesText}
      `);

      return searchableText.includes(normalizedSearch);
    });
  }, [students, search]);

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Histórico de notas</h2>
          <p className="mt-1 text-sm text-slate-400">
            Clique no aluno para abrir as notas detalhadas.
          </p>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 lg:w-[420px]">
          <Search size={18} className="text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por aluno, turma, atividade ou data..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="mt-5 text-sm text-slate-400">
        {filteredStudents.length} aluno(s) encontrado(s)
      </div>

      <div className="mt-6 space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-slate-400">
            Nenhum aluno encontrado.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const grades = student.grades ?? [];
            const average = getAverage(grades);
            const isOpen = openStudentId === student.id;

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-violet-500/30"
              >
                <button
                  onClick={() => setOpenStudentId(isOpen ? "" : student.id)}
                  className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                      <UserRound size={20} />
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-white">
                        {student.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        {student.class_name || "Sem turma"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
                      Média: {average.toFixed(1)}
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300">
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {grades.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-500">
                        Nenhuma nota lançada.
                      </div>
                    ) : (
                      grades.map((grade, index) => (
                        <div
                          key={`${student.id}-${grade.title}-${grade.date}-${index}`}
                          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-white">
                                {grade.title}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {formatDate(grade.date)}
                              </p>
                            </div>

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-lg font-black text-violet-300">
                              {Number(grade.score).toFixed(1)}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                            <Star size={14} className="text-violet-400" />
                            Nota registrada
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}