"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Mail,
  Phone,
  Search,
} from "lucide-react";

import { DeleteStudentButton } from "../DeleteStudentButton";

type Student = {
  id: string;
  name: string;
  email: string;
  class_name: string;
  course_name: string;
  phone: string;
  average: number;
  attendance: number;
  status: string;
};

export function StudentsTable({
  students,
}: {
  students: Student[];
}) {
  const [search, setSearch] = useState("");

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = normalizeText(`
        ${student.name}
        ${student.email}
        ${student.class_name}
        ${student.course_name}
      `);

      return searchableText.includes(normalizedSearch);
    });
  }, [students, search]);

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            Lista de alunos
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Pesquise por nome, email, turma ou curso.
          </p>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 md:w-80">
          <Search
            size={20}
            className="text-slate-400"
          />

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Buscar aluno..."
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="mb-4 text-sm text-slate-400">
        {filteredStudents.length} aluno(s)
        encontrado(s)
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="w-full border-collapse">
          <thead className="bg-slate-950/70 text-left text-sm text-slate-400">
            <tr>
              <th className="p-4">Aluno</th>
              <th className="p-4">Turma</th>
              <th className="p-4">Curso</th>
              <th className="p-4">Telefone</th>
              <th className="p-4">Média</th>
              <th className="p-4">Frequência</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => (
              <tr
                key={student.id}
                className="border-t border-slate-800 transition hover:bg-white/[0.03]"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 font-bold">
                      {student.name.charAt(0)}
                    </div>

                    <div>
                      <Link
                        href={`/dashboard/alunos/${student.id}`}
                        className="font-semibold transition hover:text-violet-300"
                      >
                        {student.name}
                      </Link>

                      <p className="text-sm text-slate-400">
                        {student.email}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="p-4 text-slate-300">
                  {student.class_name || "Sem turma"}
                </td>

                <td className="p-4 text-slate-300">
                  {student.course_name || "Sem curso"}
                </td>

                <td className="p-4 text-slate-300">
                  {student.phone || "-"}
                </td>

                <td className="p-4 font-semibold">
                  {student.average}
                </td>

                <td className="p-4 font-semibold">
                  {student.attendance}%
                </td>

                <td className="p-4">
                  <StatusBadge
                    status={student.status}
                  />
                </td>

                <td className="p-4">
                  <div className="flex gap-2">
                    <button className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5">
                      <Mail size={18} />
                    </button>

                    <button className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5">
                      <Phone size={18} />
                    </button>

                    <DeleteStudentButton
                      studentId={student.id}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles =
    status === "Excelente"
      ? "bg-emerald-500/10 text-emerald-300"
      : status === "Atenção"
      ? "bg-amber-500/10 text-amber-300"
      : "bg-blue-500/10 text-blue-300";

  return (
    <span
      className={`rounded-full px-3 py-1 text-sm font-medium ${styles}`}
    >
      {status}
    </span>
  );
}