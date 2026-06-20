"use client";

import { BookOpenCheck } from "lucide-react";

const inputClass =
  "h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400";

export function CourseBasicsStep({
  name,
  description,
  totalHours,
  onNameChange,
  onDescriptionChange,
  onTotalHoursChange,
}: {
  name: string;
  description: string;
  totalHours: string;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTotalHoursChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
      <div className="grid gap-4">
        <Field label="Nome do curso">
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Ex.: Informática Essencial"
            className={inputClass}
          />
        </Field>

        <Field label="Descrição">
          <textarea
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={4}
            placeholder="Objetivo, público e contexto do curso"
            className={`${inputClass} h-auto resize-none py-3`}
          />
        </Field>
      </div>

      <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
        <BookOpenCheck size={24} className="text-cyan-300" />
        <p className="mt-4 text-xs font-black uppercase tracking-wide text-cyan-200">
          Carga horária total
        </p>
        <div className="mt-3 flex items-end gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={totalHours}
            onChange={(event) => onTotalHoursChange(event.target.value)}
            placeholder="136"
            className="h-14 min-w-0 flex-1 rounded-2xl border border-cyan-500/30 bg-slate-950 px-4 text-2xl font-black text-white outline-none focus:border-cyan-300"
          />
          <span className="pb-3 text-sm font-black text-cyan-200">horas</span>
        </div>
        <p className="mt-3 text-xs leading-5 text-slate-400">
          Uma hora corresponde a uma unidade de aula na grade curricular.
        </p>
      </div>
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
