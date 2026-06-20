"use client";

import { ClipboardPaste, Download, FileSpreadsheet, Plus } from "lucide-react";
import type { AxisDraft } from "./types";
import { downloadCourseSpreadsheetTemplate } from "./utils";

const fieldClass = "h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400";

export function CourseManualLessonForm({ axes, axis, subject, lessonType, content, onAxisChange, onSubjectChange, onTypeChange, onContentChange, onAdd }: {
  axes: AxisDraft[]; axis: string; subject: string; lessonType: string; content: string;
  onAxisChange: (value: string) => void; onSubjectChange: (value: string) => void;
  onTypeChange: (value: string) => void; onContentChange: (value: string) => void; onAdd: () => void;
}) {
  return <section className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
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
  </section>;
}

export function CourseSpreadsheetImporter({ text, onTextChange, onImport }: {
  text: string; onTextChange: (value: string) => void; onImport: (mode: "replace" | "append") => void;
}) {
  return <section className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3"><FileSpreadsheet className="text-emerald-300" /><div>
        <h3 className="font-black text-white">Copiar do Excel</h3><p className="text-xs text-slate-500">Selecione as células, copie e cole abaixo.</p>
      </div></div>
      <button type="button" onClick={downloadCourseSpreadsheetTemplate} className="inline-flex h-9 items-center gap-2 rounded-xl border border-emerald-500/30 px-3 text-xs font-bold text-emerald-200"><Download size={14} /> Modelo</button>
    </div>
    <textarea value={text} onChange={(event) => onTextChange(event.target.value)} rows={7} placeholder={"Nº Aula\tEixo\tMatéria\tTipo\tConteúdo\n1\tFundamentos Digitais\tIntrodução à Informática\tPlataforma\tHistória dos computadores"} className="mt-4 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-xs text-white outline-none focus:border-emerald-400" />
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => onImport("append")} className="inline-flex h-10 items-center gap-2 rounded-xl bg-emerald-500 px-3 text-xs font-black text-slate-950"><ClipboardPaste size={15} /> Adicionar à grade</button>
      <button type="button" onClick={() => onImport("replace")} className="h-10 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 text-xs font-bold text-amber-200">Substituir grade</button>
    </div>
  </section>;
}
