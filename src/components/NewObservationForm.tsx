"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export function NewObservationForm({ studentId }: { studentId: string }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Pedagógica");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateObservation() {
    setMessage(null);

    if (!content) {
      setMessage({
        type: "error",
        text: "Digite uma observação antes de salvar.",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("observations").insert({
      student_id: studentId,
      content,
      category,
    });

    setLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: "Erro ao salvar observação.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Observação salva com sucesso!",
    });

    setContent("");
    setCategory("Pedagógica");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Nova observação</h2>

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

      <div className="mt-6 grid gap-4">
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="Pedagógica">Pedagógica</option>
          <option value="Comportamental">Comportamental</option>
          <option value="Familiar">Familiar</option>
          <option value="Intervenção">Intervenção</option>
          <option value="Evolução">Evolução</option>
        </select>

        <textarea
          placeholder="Digite aqui a observação sobre o aluno..."
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={4}
          className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />
      </div>

      <button
        onClick={handleCreateObservation}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Salvar observação"}
      </button>
    </div>
  );
}