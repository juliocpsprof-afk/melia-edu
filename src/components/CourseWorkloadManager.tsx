"use client";

import { BookOpenCheck, Clock3, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type CourseWorkload = {
  id: string;
  name: string;
  status: string | null;
  total_workload_minutes: number;
};

function formatHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function CourseWorkloadManager({ courses }: { courses: CourseWorkload[] }) {
  const activeCourses = useMemo(
    () => courses.filter((course) => course.status !== "Arquivado"),
    [courses]
  );
  const [hoursByCourse, setHoursByCourse] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      courses.map((course) => [
        course.id,
        course.total_workload_minutes > 0
          ? String(course.total_workload_minutes / 60)
          : "",
      ])
    )
  );
  const [savingId, setSavingId] = useState("");
  const [feedback, setFeedback] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function save(course: CourseWorkload) {
    const value = Number((hoursByCourse[course.id] ?? "").replace(",", "."));

    if (!Number.isFinite(value) || value <= 0) {
      setFeedback({
        id: course.id,
        type: "error",
        text: "Informe a carga horária total do curso em horas.",
      });
      return;
    }

    setSavingId(course.id);
    setFeedback(null);

    const { error } = await supabase
      .from("courses")
      .update({ total_workload_minutes: Math.round(value * 60) })
      .eq("id", course.id);

    setSavingId("");

    if (error) {
      setFeedback({ id: course.id, type: "error", text: error.message });
      return;
    }

    setFeedback({
      id: course.id,
      type: "success",
      text: "Carga horária do curso atualizada.",
    });
  }

  return (
    <section className="rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-300">
          <BookOpenCheck size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Carga horária total dos cursos</h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">
            Esta carga é a base do progresso individual. Ajustes feitos em um aluno ficam registrados somente na trajetória dele.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {activeCourses.map((course) => (
          <div key={course.id} className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="truncate text-lg font-black text-white">{course.name}</h3>
                <p className="mt-1 text-xs text-slate-500">Atual: {formatHours(course.total_workload_minutes)}</p>
              </div>
              <div className="rounded-xl bg-slate-900 p-2 text-violet-300">
                <Clock3 size={18} />
              </div>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-bold text-slate-400">Carga total do curso (horas)</span>
              <input
                type="number"
                min="1"
                step="0.5"
                value={hoursByCourse[course.id] ?? ""}
                onChange={(event) =>
                  setHoursByCourse((current) => ({ ...current, [course.id]: event.target.value }))
                }
                placeholder="Ex.: 160"
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-violet-400"
              />
            </label>

            {feedback?.id === course.id && (
              <div className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
                feedback.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                  : "border-red-500/30 bg-red-500/10 text-red-200"
              }`}>
                {feedback.text}
              </div>
            )}

            <button
              type="button"
              onClick={() => save(course)}
              disabled={savingId === course.id}
              className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-black text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              {savingId === course.id ? <Loader2 size={17} className="animate-spin" /> : <Save size={17} />}
              Salvar carga
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
