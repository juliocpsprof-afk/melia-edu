"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export function SubmissionCorrectionForm({
  submissionId,
  studentId,
  activityTitle,
}: {
  submissionId: string;
  studentId: string;
  activityTitle: string;
}) {
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCorrectSubmission() {
    if (!grade) {
      alert("Digite uma nota antes de salvar.");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("submissions")
      .update({
        grade: Number(grade),
        status: "Corrigida",
      })
      .eq("id", submissionId);

    if (error) {
      setLoading(false);
      alert("Erro ao corrigir entrega.");
      return;
    }

    const { error: gradeError } = await supabase.from("grades").insert({
      student_id: studentId,
      title: activityTitle,
      score: Number(grade),
      feedback: feedback.trim() || null,
      date: new Date().toISOString().split("T")[0],
    });

    setLoading(false);

    if (gradeError) {
      alert("Entrega corrigida, mas houve erro ao salvar no boletim.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-200">
          Correção da entrega
        </p>

        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
          Pendente
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[120px_1fr_auto]">
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          placeholder="Nota"
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
          className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none transition focus:border-violet-400"
        />

        <textarea
          placeholder="Feedback pedagógico..."
          value={feedback}
          onChange={(event) => setFeedback(event.target.value)}
          rows={2}
          className="min-h-11 resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none transition focus:border-violet-400"
        />

        <button
          onClick={handleCorrectSubmission}
          disabled={loading}
          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircle size={16} />
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}