"use client";

import { useState } from "react";
import {
  CalendarDays,
  CheckCircle,
  Link2,
  Loader2,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type StudentItem = {
  id: string;
};

type ActivityLink = {
  label: string;
  url: string;
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function normalizeUrl(value: string) {
  const url = value.trim();

  if (!url) {
    return "";
  }

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `https://${url}`;
}

export function NewActivityForm({ classes }: { classes: ClassItem[] }) {
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(getTodayDate());
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [activityLinks, setActivityLinks] = useState<ActivityLink[]>([]);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function handleAddLink() {
    setMessage(null);

    if (!linkUrl.trim()) {
      setMessage({
        type: "error",
        text: "Informe o link antes de adicionar.",
      });

      return;
    }

    const normalizedUrl = normalizeUrl(linkUrl);

    setActivityLinks((current) => [
      ...current,
      {
        label: linkLabel.trim() || `Link ${current.length + 1}`,
        url: normalizedUrl,
      },
    ]);

    setLinkLabel("");
    setLinkUrl("");
  }

  function handleRemoveLink(indexToRemove: number) {
    setActivityLinks((current) =>
      current.filter((_, index) => index !== indexToRemove)
    );
  }

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

    const { data: createdActivity, error: activityError } = await supabase
      .from("activities")
      .insert({
        class_id: classId,
        title: title.trim(),
        description: description.trim(),
        start_date: startDate,
        due_date: dueDate,
        archived: false,
        activity_links: activityLinks,
      })
      .select("id")
      .single();

    if (activityError || !createdActivity?.id) {
      setLoading(false);

      setMessage({
        type: "error",
        text: `Erro ao criar atividade: ${
          activityError?.message ?? "o Supabase não retornou a atividade criada."
        }`,
      });

      return;
    }

    const { data: classStudents, error: studentsError } = await supabase
      .from("students")
      .select("id")
      .eq("class_id", classId);

    if (studentsError) {
      setLoading(false);

      setMessage({
        type: "error",
        text: `A atividade foi criada, mas houve erro ao buscar os alunos da turma: ${studentsError.message}`,
      });

      return;
    }

    const students = (classStudents as StudentItem[] | null) ?? [];

    if (students.length > 0) {
      const automaticSubmissions = students.map((student) => ({
        activity_id: createdActivity.id,
        student_id: student.id,
        content: null,
        status: "Pendente",
        grade: null,
        feedback: null,
      }));

      const { error: submissionsError } = await supabase
        .from("submissions")
        .insert(automaticSubmissions);

      if (submissionsError) {
        setLoading(false);

        setMessage({
          type: "error",
          text: `A atividade foi criada, mas houve erro ao criar as entregas automáticas: ${submissionsError.message}`,
        });

        return;
      }
    }

    setLoading(false);

    setMessage({
      type: "success",
      text:
        students.length > 0
          ? `Atividade criada com sucesso! ${students.length} entrega(s) foram geradas automaticamente.`
          : "Atividade criada com sucesso! Nenhuma entrega automática foi criada porque essa turma não possui alunos.",
    });

    setClassId("");
    setTitle("");
    setDescription("");
    setStartDate(getTodayDate());
    setDueDate("");
    setActivityLinks([]);
    setLinkLabel("");
    setLinkUrl("");

    setTimeout(() => {
      window.location.reload();
    }, 900);
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
            Ao criar uma atividade, o sistema já gera automaticamente uma
            entrega pendente para cada aluno da turma.
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert"
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
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400 [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:invert"
          />
        </div>

        <textarea
          placeholder="Descrição da atividade. Se você digitar links aqui, eles também ficarão clicáveis para o aluno."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={4}
          className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
        />
      </div>

      <div className="mt-5 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
            <Link2 size={20} />
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">
              Links da atividade
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Adicione vídeos, formulários, documentos, sites ou ferramentas
              específicas para esta atividade.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1.4fr_auto]">
          <input
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="Nome do link, opcional"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
          />

          <input
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleAddLink();
              }
            }}
            placeholder="Cole o link aqui. Ex.: youtube.com/..."
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
          />

          <button
            type="button"
            onClick={handleAddLink}
            className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-400"
          >
            <Plus size={17} />
            Adicionar
          </button>
        </div>

        {activityLinks.length > 0 && (
          <div className="mt-4 grid gap-2">
            {activityLinks.map((link, index) => (
              <div
                key={`${link.url}-${index}`}
                className="flex flex-col gap-3 rounded-2xl border border-cyan-500/20 bg-slate-950/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-cyan-100">{link.label}</p>

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {link.url}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveLink(index)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                >
                  <Trash2 size={14} />
                  Remover
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={handleCreateActivity}
        disabled={loading}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        {loading && <Loader2 size={18} className="animate-spin" />}
        {loading ? "Criando atividade e entregas..." : "Criar atividade"}
      </button>
    </div>
  );
}