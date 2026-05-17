"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export function NewClassForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateClass() {
    setMessage(null);

    if (!name || !description) {
      setMessage({
        type: "error",
        text: "Preencha todos os campos.",
      });

      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("classes")
      .insert({
        name,
        description,
      });

    setLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: "Erro ao criar turma.",
      });

      return;
    }

    setMessage({
      type: "success",
      text: "Turma criada com sucesso!",
    });

    setName("");
    setDescription("");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">
        Nova turma
      </h2>

      {message && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}

          <span className="font-medium">
            {message.text}
          </span>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <input
          placeholder="Nome da turma"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="Descrição"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />
      </div>

      <button
        onClick={handleCreateClass}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Criar turma"}
      </button>
    </div>
  );
}