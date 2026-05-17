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

    setLoading(false);

    if (error) {
      alert("Erro ao corrigir entrega.");
      return;
    }
await supabase.from("grades").insert({
  student_id: studentId,
  title: activityTitle,
  score: Number(grade),
  feedback,
  date: new Date()
    .toISOString()
    .split("T")[0],
});
    window.location.reload();
  }

  return (
    <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <label className="text-sm font-medium text-slate-300">
        Corrigir entrega
      </label>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          placeholder="Nota"
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
          className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />
<textarea
  placeholder="Feedback pedagógico..."
  value={feedback}
  onChange={(event) => setFeedback(event.target.value)}
  rows={4}
  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
/>
        <button
          onClick={handleCorrectSubmission}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
        >
          <CheckCircle size={18} />
          {loading ? "Salvando..." : "Salvar correção"}
        </button>
      </div>
    </div>
  );
}