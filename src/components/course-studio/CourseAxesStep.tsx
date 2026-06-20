"use client";

import { Plus, Trash2 } from "lucide-react";

import type { AxisDraft } from "./types";
import { normalizeCourseText, parsePositiveInteger } from "./utils";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400";

export function CourseAxesStep({
  totalHours,
  axes,
  axisName,
  axisHours,
  lessonCountByAxis,
  onAxisNameChange,
  onAxisHoursChange,
  onAddAxis,
  onRemoveAxis,
}: {
  totalHours: number;
  axes: AxisDraft[];
  axisName: string;
  axisHours: string;
  lessonCountByAxis: Map<string, number>;
  onAxisNameChange: (value: string) => void;
  onAxisHoursChange: (value: string) => void;
  onAddAxis: () => void;
  onRemoveAxis: (key: string) => void;
}) {
  const allocated = axes.reduce(
    (sum, axis) => sum + parsePositiveInteger(axis.hours),
    0
  );
  const remaining = Math.max(0, totalHours - allocated);
  const overflow = Math.max(0, allocated - totalHours);

  return (
    <div>
      <ProgressCards
        total={totalHours}
        allocated={allocated}
        lessons={Array.from(lessonCountByAxis.values()).reduce(
          (sum, value) => sum + value,
          0
        )}
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_180px_auto]">
        <Field label="Nome do eixo temático">
          <input
            value={axisName}
            onChange={(event) => onAxisNameChange(event.target.value)}
            placeholder="Ex.: Fundamentos Digitais"
            className={inputClass}
          />
        </Field>

        <Field label="Carga do eixo">
          <input
            type="number"
            min="1"
            step="1"
            value={axisHours}
            onChange={(event) => onAxisHoursChange(event.target.value)}
            placeholder="40"
            className={inputClass}
          />
        </Field>

        <button
          type="button"
          onClick={onAddAxis}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-5 text-sm font-black text-white hover:bg-violet-400"
        >
          <Plus size={17} /> Adicionar eixo
        </button>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {axes.map((axis, index) => {
          const planned = parsePositiveInteger(axis.hours);
          const filled =
            lessonCountByAxis.get(normalizeCourseText(axis.name)) ?? 0;
          const progress = planned
            ? Math.min(100, (filled / planned) * 100)
            : 0;

          return (
            <div
              key={axis.key}
              className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-violet-300">
                    Eixo {index + 1}
                  </p>
                  <p className="mt-1 font-black text-white">{axis.name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveAxis(axis.key)}
                  className="rounded-lg p-2 text-slate-500 hover:bg-red-500/10 hover:text-red-300"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                {filled}/{planned} aulas • {planned}h
              </p>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-900">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          );
        })}

        {axes.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/35 p-6 text-center text-sm text-slate-500">
            Distribua a carga do curso por eixos temáticos ou matérias.
          </div>
        )}
      </div>

      <div
        className={`mt-5 rounded-2xl border px-4 py-3 text-sm ${
          overflow
            ? "border-red-500/30 bg-red-500/10 text-red-200"
            : remaining
            ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
        }`}
      >
        {overflow
          ? `Os eixos ultrapassam a carga total em ${overflow}h.`
          : remaining
          ? `Ainda faltam distribuir ${remaining}h entre os eixos.`
          : "Toda a carga horária foi distribuída entre os eixos."}
      </div>
    </div>
  );
}

export function ProgressCards({
  total,
  allocated,
  lessons,
}: {
  total: number;
  allocated: number;
  lessons: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <ProgressCard title="Carga total" value={`${total}h`} ready={total > 0} />
      <ProgressCard
        title="Carga nos eixos"
        value={`${allocated}h`}
        ready={allocated === total && total > 0}
      />
      <ProgressCard
        title="Aulas cadastradas"
        value={`${lessons}/${total}`}
        ready={lessons === total && total > 0}
      />
    </div>
  );
}

function ProgressCard({
  title,
  value,
  ready,
}: {
  title: string;
  value: string;
  ready: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        ready
          ? "border-emerald-500/25 bg-emerald-500/5"
          : "border-amber-500/25 bg-amber-500/5"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">
        {label}
      </span>
      {children}
    </label>
  );
}
