"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  Search,
  Star,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_id?: string | null;
};

type Activity = {
  id: string;
  title: string;
};

type ClassItem = {
  id: string;
  name: string;
};

export function NewSubmissionForm({
  students,
  activities,
  classes = [],
}: {
  students: Student[];
  activities: Activity[];
  classes?: ClassItem[];
}) {
  const [studentId, setStudentId] = useState("");
  const [activityId, setActivityId] = useState("");
  const [content, setContent] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const visibleStudents = useMemo(() => {
    const search = normalizeText(studentSearch);

    return students.filter((student) => {
      const matchesClass = classFilter
        ? student.class_id === classFilter
        : true;

      const matchesSearch = search
        ? normalizeText(student.name).includes(search)
        : true;

      return matchesClass && matchesSearch;
    });
  }, [students, classFilter, studentSearch]);

  const visibleActivities = useMemo(() => {
    return activities.filter((activity) => !!activity.title);
  }, [activities]);

  async function handleCreateSubmission() {
    setMessage(null);

    if (!studentId || !activityId) {
      setMessage({
        type: "error",
        text: "Selecione o aluno e a atividade.",
      });

      return;
    }

    setLoading(true);

    const parsedGrade =
      grade.trim() !== ""
        ? Number(grade.replace(",", "."))
        : null;

    const submissionStatus =
      parsedGrade !== null ? "Corrigida" : "Pendente";

    const { error: submissionError } = await supabase
      .from("submissions")
      .insert({
        student_id: studentId,
        activity_id: activityId,
        content: content.trim() || null,
        grade: parsedGrade,
        status: submissionStatus,
      });

    if (submissionError) {
      setLoading(false);

      setMessage({
        type: "error",
        text: "Erro ao registrar entrega.",
      });

      return;
    }

    if (parsedGrade !== null) {
      const activity = activities.find(
        (item) => item.id === activityId
      );

      await supabase.from("grades").insert({
        student_id: studentId,
        title: activity?.title || "Atividade",
        score: parsedGrade,
        date: new Date().toISOString(),
      });
    }

    setLoading(false);

    setMessage({
      type: "success",
      text: "Entrega registrada com sucesso!",
    });

    setStudentId("");
    setActivityId("");
    setContent("");
    setStudentSearch("");
    setGrade("");

    setTimeout(() => {
      window.location.reload();
    }, 900);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Nova entrega
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Registre atividades entregues e notas dos alunos.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-300">
          <Users size={16} />
          {visibleStudents.length} aluno(s)
        </div>
      </div>

      {message && (
        <div
          className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
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

      <div className="mt-5 grid gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={classFilter}
            onChange={(event) => {
              setClassFilter(event.target.value);
              setStudentId("");
            }}
            className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
          >
            <option value="">
              Todas as turmas
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

          <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 focus-within:border-violet-400">
            <Search
              size={17}
              className="text-slate-500"
            />

            <input
              type="text"
              value={studentSearch}
              onChange={(event) =>
                setStudentSearch(event.target.value)
              }
              placeholder="Pesquisar aluno..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <select
          value={studentId}
          onChange={(event) =>
            setStudentId(event.target.value)
          }
          className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
        >
          <option value="">
            Selecione o aluno
          </option>

          {visibleStudents.map((student) => (
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
          className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
        >
          <option value="">
            Selecione a atividade
          </option>

          {visibleActivities.map((activity) => (
            <option
              key={activity.id}
              value={activity.id}
            >
              {activity.title}
            </option>
          ))}
        </select>

        <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 focus-within:border-yellow-400">
          <Star
            size={16}
            className="text-yellow-400"
          />

          <input
            type="number"
            step="0.1"
            min="0"
            max="10"
            value={grade}
            onChange={(event) =>
              setGrade(event.target.value)
            }
            placeholder="Nota da atividade"
            className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>

        <textarea
          placeholder="Resposta do aluno... opcional"
          value={content}
          onChange={(event) =>
            setContent(event.target.value)
          }
          rows={3}
          className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
        />
      </div>

      <button
        onClick={handleCreateSubmission}
        disabled={loading}
        className="mt-4 rounded-2xl bg-violet-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Salvando..."
          : "Registrar entrega"}
      </button>
    </div>
  );
}