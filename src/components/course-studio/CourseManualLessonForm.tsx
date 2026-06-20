"use client";

import { Plus } from "lucide-react";
import type { AxisDraft } from "./types";

const fieldClass = "h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400";

export function CourseManualLessonForm({ axes, axis, subject, lessonType, content, onAxisChange, onSubjectChange, onTypeChange, onContentChange, onAdd }: {
  axes: AxisDraft[];
  axis: string;
  subject: string;
  lessonType: string;
  content: string;
  onAxisChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onAdd: () => void;
}) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
      <h3 className="font-black text-white">Adicionar aula manualmente</h3>
      <p className="mt-1 text-xs text-slate-500">Cada registro representa uma unidade de 1 hora.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <select value={axis} onChange={(event) => onAxisChange(event.target.value)} className={fieldClass}>
          <option value="">Selecione o eixo</option>
          {axes.map((item) => <option key={item.key} value={item.name}>{item.name}</option>)}
        </select>
        <input value={subject} onChange={(event) => onSubjectChange(event.target.value)} placeholder="Matéria" className={fieldClass} />
        <input value={lessonType} onChange={(event) => onTypeChange(event.target.value)} placeholder="Tipo: Plataforma, prática..." className={`${fieldClass} sm:col-span-2`} />
        <textarea value={content} onChange={(event) => onContentChange(event.target.value)} rows={3} placeholder="Conteúdo da aula" className={`${fieldClass} h-auto resize-none py-3 sm:col-span-2`} />
      </div>
      <button type="button" onClick={onAdd} className="mt-4 inline-flex h-11 items-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-black text-white hover:bg-violet-400">
        <Plus size={17} /> Inserir aula
      </button>
    </section>
  );
}
