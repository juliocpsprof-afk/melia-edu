"use client";

import { useState } from "react";

import {
  CheckCircle,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

export function NewStudentForm({
  classes,
}: {
  classes: ClassItem[];
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [classId, setClassId] = useState("");

  const [average, setAverage] = useState("");
  const [attendance, setAttendance] = useState("");

  const [status, setStatus] =
    useState("Regular");

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleCreateStudent() {
    setMessage(null);

    if (
      !name ||
      !email ||
      !classId ||
      !average ||
      !attendance
    ) {
      setMessage({
        type: "error",
        text: "Preencha todos os campos.",
      });

      return;
    }

    const selectedClass = classes.find(
      (item) => item.id === classId
    );

    setLoading(true);

    const { error } = await supabase
      .from("students")
      .insert({
        name,
        email,

        class_id: classId,

        class_name: selectedClass?.name,

        average: Number(average),

        attendance: Number(attendance),

        status,
      });

    setLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: "Erro ao cadastrar aluno.",
      });

      return;
    }

    setMessage({
      type: "success",
      text: "Aluno cadastrado com sucesso!",
    });

    setName("");
    setEmail("");
    setClassId("");
    setAverage("");
    setAttendance("");

    setStatus("Regular");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">
        Cadastrar novo aluno
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
          placeholder="Nome do aluno"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="E-mail"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <select
          value={classId}
          onChange={(event) =>
            setClassId(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">
            Selecione a turma
          </option>

          {classes.map((classItem) => (
            <option
              key={classItem.id}
              value={classItem.id}
            >
              {classItem.name}
            </option>
          ))}
        </select>

        <input
          placeholder="Média"
          type="number"
          value={average}
          onChange={(event) =>
            setAverage(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <input
          placeholder="Frequência"
          type="number"
          value={attendance}
          onChange={(event) =>
            setAttendance(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <select
          value={status}
          onChange={(event) =>
            setStatus(event.target.value)
          }
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="Regular">
            Regular
          </option>

          <option value="Atenção">
            Atenção
          </option>

          <option value="Excelente">
            Excelente
          </option>
        </select>
      </div>

      <button
        onClick={handleCreateStudent}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading
          ? "Salvando..."
          : "Salvar aluno"}
      </button>
    </div>
  );
}