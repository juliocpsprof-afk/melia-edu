"use client";

import { CalendarDays, Clock3, Loader2, Save } from "lucide-react";
import { useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

type ClassLearningSettings = {
  id: string;
  name: string;
  status: string | null;
  schedule_days: number[];
  weekly_workload_minutes: number;
  default_session_minutes: number;
};

type Draft = {
  scheduleDays: number[];
  weeklyHours: string;
  sessionMinutes: string;
};

const weekDays = [
  { value: 1, short: "Seg", label: "Segunda-feira" },
  { value: 2, short: "Ter", label: "Terça-feira" },
  { value: 3, short: "Qua", label: "Quarta-feira" },
  { value: 4, short: "Qui", label: "Quinta-feira" },
  { value: 5, short: "Sex", label: "Sexta-feira" },
  { value: 6, short: "Sáb", label: "Sábado" },
  { value: 7, short: "Dom", label: "Domingo" },
];

function initialDraft(item: ClassLearningSettings): Draft {
  return {
    scheduleDays: item.schedule_days ?? [],
    weeklyHours:
      item.weekly_workload_minutes > 0
        ? String(item.weekly_workload_minutes / 60)
        : "",
    sessionMinutes: String(item.default_session_minutes || 60),
  };
}

function formatWeeklyHours(minutes: number) {
  if (!minutes) return "Não configurada";
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h por semana`;
}

export function ClassLearningSettingsManager({
  classes,
}: {
  classes: ClassLearningSettings[];
}) {
  const activeClasses = useMemo(
    () => classes.filter((item) => item.status !== "Arquivada"),
    [classes]
  );
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(classes.map((item) => [item.id, initialDraft(item)]))
  );
  const [savingId, setSavingId] = useState("");
  const [message, setMessage] = useState<{
    id: string;
    type: "success" | "error";
    text: string;
  } | null>(null);

  function updateDraft(id: string, update: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [id]: {
        ...(current[id] ?? {
          scheduleDays: [],
          weeklyHours: "",
          sessionMinutes: "60",
        }),
        ...update,
      },
    }));
  }

  function toggleDay(id: string, day: number) {
    const current = drafts[id]?.scheduleDays ?? [];
    updateDraft(id, {
      scheduleDays: current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b),
    });
  }

  async function save(item: ClassLearningSettings) {
    const draft = drafts[item.id] ?? initialDraft(item);
    const weeklyHours = Number(draft.weeklyHours.replace(",", "."));
    const sessionMinutes = Number(draft.sessionMinutes);

    if (!Number.isFinite(weeklyHours) || weeklyHours <= 0) {
      setMessage({
        id: item.id,
        type: "error",
        text: "Informe uma carga horária semanal maior que zero.",
      });
      return;
    }

    if (!Number.isFinite(sessionMinutes) || sessionMinutes <= 0) {
      setMessage({
        id: item.id,
        type: "error",
        text: "Informe a duração padrão de cada chamada.",
      });
      return;
    }

    if (draft.scheduleDays.length === 0) {
      setMessage({
        id: item.id,
        type: "error",
        text: "Selecione pelo menos um dia de aula.",
      });
      return;
    }

    setSavingId(item.id);
    setMessage(null);

    const { error } = await supabase
      .from("classes")
      .update({
        schedule_days: draft.scheduleDays,
        weekly_workload_minutes: Math.round(weeklyHours * 60),
        default_session_minutes: Math.round(sessionMinutes),
      })
      .eq("id", item.id);

    setSavingId("");

    if (error) {
      setMessage({ id: item.id, type: "error", text: error.message });
      return;
    }

    setMessage({
      id: item.id,
      type: "success",
      text: "Rotina e carga horária salvas.",
    });
  }

  return (
    <section className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
          <CalendarDays size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            Rotina e carga horária das turmas
          </h2>
          <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">
            A turma é permanente. Estes dados representam apenas a rotina atual
            usada para ponderar cada chamada e estimar o tempo restante dos
            alunos que estão nela.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        {activeClasses.map((item) => {
          const draft = drafts[item.id] ?? initialDraft(item);

          return (
            <div
              key={item.id}
              className="rounded-3xl border border-slate-800 bg-slate-950/55 p-5"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">{item.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatWeeklyHours(item.weekly_workload_minutes)} • chamada
                    padrão de {item.default_session_minutes || 60} min
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-cyan-200">
                  <Clock3 size={14} />
                  Configuração atual
                </div>
              </div>

              <div className="mt-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Dias de aula — schedule_days
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {weekDays.map((day) => {
                    const selected = draft.scheduleDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        title={day.label}
                        onClick={() => toggleDay(item.id, day.value)}
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          selected
                            ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                            : "border-slate-700 bg-slate-900 text-slate-400 hover:border-cyan-500/40"
                        }`}
                      >
                        {day.short}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-400">
                    Carga semanal da turma (horas)
                  </span>
                  <input
                    type="number"
                    min="0.25"
                    step="0.25"
                    value={draft.weeklyHours}
                    onChange={(event) =>
                      updateDraft(item.id, { weeklyHours: event.target.value })
                    }
                    placeholder="Ex.: 4"
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>

                <label>
                  <span className="mb-1.5 block text-xs font-bold text-slate-400">
                    Duração padrão da chamada (minutos)
                  </span>
                  <input
                    type="number"
                    min="15"
                    step="15"
                    value={draft.sessionMinutes}
                    onChange={(event) =>
                      updateDraft(item.id, {
                        sessionMinutes: event.target.value,
                      })
                    }
                    placeholder="Ex.: 120"
                    className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </label>
              </div>

              {message?.id === item.id && (
                <div
                  className={`mt-4 rounded-xl border px-3 py-2 text-sm ${
                    message.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-200"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="button"
                onClick={() => save(item)}
                disabled={savingId === item.id}
                className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {savingId === item.id ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Save size={17} />
                )}
                Salvar rotina
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
