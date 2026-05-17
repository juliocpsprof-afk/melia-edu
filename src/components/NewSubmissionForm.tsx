"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
};

type Activity = {
  id: string;
  title: string;
};

export function NewSubmissionForm({
  students,
  activities,
}: {
  students: Student[];
  activities: Activity[];
}) {
  const [studentId, setStudentId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [content, setContent] = useState("");

  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateSubmission() {
    setMessage(null);

    if (!studentId || !activityId || !content) {
      setMessage({
        type: "error",
        text: "Preencha todos os campos.",
      });

      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("submissions")
      .insert({
        student_id: studentId,
        activity_id: activityId,
        content,
      });

    setLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: "Erro ao enviar atividade.",
      });

      return;
    }

    setMessage({
      type: "success",
      text: "Atividade enviada com sucesso!",
    });

    setStudentId("");
    setActivityId("");
    setContent("");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">
        Nova entrega
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

      <div className="mt-6 grid gap-4">
        <select
          value={studentId}
          onChange={(event) =>
            setStudentId(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">
            Selecione o aluno
          </option>

          {students.map((student) => (
            <option
              key={student.id}
              value={student.id}
            >
              {student.name}
            </option>
          ))}
        </select>

        <select
          value={activityId}
          onChange={(event) =>
            setActivityId(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">
            Selecione a atividade
          </option>

          {activities.map((activity) => (
            <option
              key={activity.id}
              value={activity.id}
            >
              {activity.title}
            </option>
          ))}
        </select>

        <textarea
          placeholder="Resposta do aluno..."
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          rows={5}
          className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />
      </div>

      <button
        onClick={handleCreateSubmission}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading
          ? "Enviando..."
          : "Enviar atividade"}
      </button>
    </div>
  );
}