"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function NewActivityForm({ classes }: { classes: ClassItem[] }) {
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateActivity() {
    setMessage(null);

    if (!classId || !title.trim() || !description.trim() || !startDate || !dueDate) {
      setMessage({
        type: "error",
        text: "Preencha turma, título, descrição, data de início e data de entrega.",
      });

      return;
    }

    if (dueDate < startDate) {
      setMessage({
        type: "error",
        text: "A data de entrega não pode ser anterior à data de início.",
      });

      return;
    }

    setLoading(true);

    const { error } = await supabase.from("activities").insert({
      class_id: classId,
      title: title.trim(),
      description: description.trim(),
      start_date: startDate,
      due_date: dueDate,
      archived: false,
    });

    setLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao criar atividade: ${error.message}`,
      });

      return;
    }

    setMessage({
      type: "success",
      text: "Atividade criada com sucesso!",
    });

    setClassId("");
    setTitle("");
    setDescription("");
    setStartDate(getTodayDate());
    setDueDate("");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
          <CalendarDays size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold">Nova atividade</h2>

          <p className="mt-1 text-sm text-slate-400">
            Defina a data de início e a data de entrega para que o aluno receba
            lembretes quando o prazo estiver próximo.
          </p>
        </div>
      </div>

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

          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          value={classId}
          onChange={(event) => setClassId(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">Selecione a turma</option>

          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Título da atividade"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Data de início
          </label>

          <input
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Data de entrega
          </label>

          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400"
          />
        </div>

        <textarea
          placeholder="Descrição da atividade"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
        />
      </div>

      <button
        onClick={handleCreateActivity}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Criar atividade"}
      </button>
    </div>
  );
}