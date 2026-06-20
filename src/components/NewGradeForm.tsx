"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

import { StudentIdentity } from "@/components/StudentIdentity";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_name: string;
  photo_path?: string | null;
  photo_status?: string | null;
  identity_mode?: string | null;
  avatar_key?: string | null;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function NewGradeForm({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [studentMenuOpen, setStudentMenuOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedStudent = students.find((student) => student.id === studentId);

  const filteredStudents = useMemo(() => {
    const search = normalizeText(studentSearch);

    if (!search) return students;

    return students.filter((student) =>
      normalizeText(`${student.name} ${student.class_name}`).includes(search)
    );
  }, [students, studentSearch]);

  async function handleCreateGrade() {
    if (!studentId || !title || !score) {
      toast.error("Preencha todos os campos antes de salvar.");
      return;
    }

    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("grades").insert({
      student_id: studentId,
      title,
      score: Number(score),
      date: today,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao lançar nota.");
      console.error(error);
      return;
    }

    toast.success("Nota lançada com sucesso!");

    setStudentId("");
    setStudentSearch("");
    setTitle("");
    setScore("");

    setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  return (
    <div data-no-student-photo="true" className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Lançar nova nota</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="relative">
          <button
            type="button"
            onClick={() => setStudentMenuOpen((current) => !current)}
            className="flex h-12 w-full items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-3 text-left outline-none transition hover:border-violet-400"
          >
            {selectedStudent ? (
              <StudentIdentity
                studentId={selectedStudent.id}
                name={selectedStudent.name}
                photoPath={selectedStudent.photo_path}
                photoStatus={selectedStudent.photo_status}
                identityMode={selectedStudent.identity_mode}
                avatarKey={selectedStudent.avatar_key}
                viewer="teacher"
                size="sm"
                expandable
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-800" />
            )}

            <span className="min-w-0 flex-1 truncate text-sm">
              {selectedStudent
                ? `${selectedStudent.name} — ${
                    selectedStudent.class_name || "Sem turma"
                  }`
                : "Selecione o aluno"}
            </span>

            <ChevronDown size={17} className="shrink-0 text-slate-500" />
          </button>

          {studentMenuOpen && (
            <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-3">
                <Search size={17} className="text-slate-500" />
                <input
                  value={studentSearch}
                  onChange={(event) => setStudentSearch(event.target.value)}
                  placeholder="Pesquisar aluno ou turma..."
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => setStudentSearch("")}
                    className="text-slate-500 hover:text-white"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto p-2">
                {filteredStudents.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => {
                      setStudentId(student.id);
                      setStudentMenuOpen(false);
                      setStudentSearch("");
                    }}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-violet-500/10"
                  >
                    <StudentIdentity
                      studentId={student.id}
                      name={student.name}
                      photoPath={student.photo_path}
                      photoStatus={student.photo_status}
                      identityMode={student.identity_mode}
                      avatarKey={student.avatar_key}
                      viewer="teacher"
                      size="sm"
                      expandable
                    />

                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">
                        {student.name}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {student.class_name || "Sem turma"}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <input
          placeholder="Nome da avaliação"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="Nota"
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={score}
          onChange={(event) => setScore(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />
      </div>

      <button
        type="button"
        onClick={handleCreateGrade}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar nota"}
      </button>
    </div>
  );
}
