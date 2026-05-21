"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type CourseItem = {
  id: string;
  name: string;
};

type Props = {
  classes: ClassItem[];
  courses: CourseItem[];
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function splitLine(line: string) {
  if (line.includes("\t")) {
    return line.split("\t").map((item) => item.trim());
  }

  if (line.includes(";")) {
    return line.split(";").map((item) => item.trim());
  }

  return line.split(",").map((item) => item.trim());
}

export function BulkStudentImport({ classes }: Props) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function handleImport() {
    setMessage(null);

    if (!text.trim()) {
      setMessage({
        type: "error",
        text: "Cole os dados da planilha antes de importar.",
      });
      return;
    }

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const dataLines = lines.filter((line) => {
      const normalizedLine = normalizeText(line);
      return !normalizedLine.includes("nome") || !normalizedLine.includes("turma");
    });

    const studentsToInsert = [];

    for (const line of dataLines) {
      const columns = splitLine(line);

      const name = columns[0]?.trim() || "";
      const phone = columns[1]?.trim() || "";
      const className = columns[2]?.trim() || "";

      if (!name) {
        continue;
      }

      const selectedClass = className
        ? classes.find(
            (item) => normalizeText(item.name) === normalizeText(className)
          )
        : null;

      studentsToInsert.push({
        name,
        phone: phone || null,
        email: null,

        class_id: selectedClass?.id || null,
        class_name: selectedClass?.name || className || null,

        course_id: null,
        course_name: null,

        average: 0,
        attendance: 0,
        status: "Regular",
      });
    }

    if (studentsToInsert.length === 0) {
      setMessage({
        type: "error",
        text: "Nenhum aluno com nome foi encontrado.",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("students").insert(studentsToInsert);

    setLoading(false);

    if (error) {
      console.error(error);

      setMessage({
        type: "error",
        text: `Erro ao importar alunos: ${error.message}`,
      });

      return;
    }

    setMessage({
      type: "success",
      text: `${studentsToInsert.length} aluno(s) importado(s) com sucesso!`,
    });

    setText("");

    setTimeout(() => {
      window.location.reload();
    }, 1000);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Cadastro em massa</h2>

      <p className="mt-1 text-sm text-slate-400">
        Copie do Excel nesta ordem: Nome, Telefone e Turma.
      </p>

      <p className="mt-2 text-xs text-slate-500">
        Apenas o nome é indispensável. Telefone e turma podem ficar vazios para
        serem concluídos depois.
      </p>

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

      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={8}
        placeholder={`Nome do aluno\tTelefone\tTurma`}
        className="mt-6 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-violet-400"
      />

      <button
        onClick={handleImport}
        disabled={loading}
        className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading ? "Importando..." : "Importar alunos"}
      </button>
    </div>
  );
}