"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_name: string;
};

export function NewGradeForm({ students }: { students: Student[] }) {
  const [studentId, setStudentId] = useState("");
  const [title, setTitle] = useState("");
  const [score, setScore] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateGrade() {
    setMessage(null);

    if (!studentId || !title || !score) {
      setMessage({
        type: "error",
        text: "Preencha todos os campos antes de salvar.",
      });
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
      setMessage({
        type: "error",
        text: "Erro ao lançar nota. Tente novamente.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Nota lançada com sucesso!",
    });

    setStudentId("");
    setTitle("");
    setScore("");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Lançar nova nota</h2>

      {message && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <select
          value={studentId}
          onChange={(event) => setStudentId(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">Selecione o aluno</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name} — {student.class_name}
            </option>
          ))}
        </select>

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
        onClick={handleCreateGrade}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar nota"}
      </button>
    </div>
  );
}