"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck, Check, Loader2, RotateCcw, Save, Sparkles, X } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { CourseAxesStep, ProgressCards } from "./CourseAxesStep";
import { CourseManualLessonForm, CourseSpreadsheetImporter } from "./CourseManualLessonForm";
import type { AxisDraft, CourseFeedback, LessonDraft } from "./types";
import {
  cloneAxes,
  createCourseStudioKey,
  createLessonTitle,
  inferAxesFromLessons,
  normalizeCourseText,
  parseCourseSpreadsheet,
  parsePositiveInteger,
} from "./utils";

const inputClass = "h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400";
const steps = [[1,"Dados do curso","Nome, descrição e carga total"],[2,"Eixos temáticos","Distribuição da carga horária"],[3,"Grade de aulas","Uma aula para cada hora"]] as const;

export function CourseBuilderWizard() {
  const [step,setStep]=useState(1);
  const [name,setName]=useState("");
  const [description,setDescription]=useState("");
  const [totalHours,setTotalHours]=useState("");
  const [axes,setAxes]=useState<AxisDraft[]>([]);
  const [axisName,setAxisName]=useState("");
  const [axisHours,setAxisHours]=useState("");
  const [lessons,setLessons]=useState<LessonDraft[]>([]);
  const [lessonAxis,setLessonAxis]=useState("");
  const [lessonSubject,setLessonSubject]=useState("");
  const [lessonType,setLessonType]=useState("Aula");
  const [lessonContent,setLessonContent]=useState("");
  const [sheet,setSheet]=useState("");
  const [feedback,setFeedback]=useState<CourseFeedback>(null);
  const [saving,setSaving]=useState(false);

  const total=parsePositiveInteger(totalHours);
  const allocated=axes.reduce((sum,axis)=>sum+parsePositiveInteger(axis.hours),0);
  const lessonCountByAxis=useMemo(()=>{
    const map=new Map<string,number>();
    lessons.forEach((lesson)=>{const key=normalizeCourseText(lesson.axis);map.set(key,(map.get(key)??0)+1);});
    return map;
  },[lessons]);

  function reset(){setStep(1);setName("");setDescription("");setTotalHours("");setAxes([]);setAxisName("");setAxisHours("");setLessons([]);setLessonAxis("");setLessonSubject("");setLessonType("Aula");setLessonContent("");setSheet("");setFeedback(null);}
  function validate(target=step){
    if(!name.trim()){setFeedback({type:"error",text:"Informe o nome do curso."});return false;}
    if(!total){setFeedback({type:"error",text:"Informe a carga horária total em horas inteiras."});return false;}
    if(target>=3&&!axes.length){setFeedback({type:"error",text:"Cadastre pelo menos um eixo temático."});return false;}
    if(allocated>total){setFeedback({type:"error",text:"A soma dos eixos ultrapassa a carga do curso."});return false;}
    setFeedback(null);return true;
  }
  function goTo(next:number){if(next<=step||validate(next))setStep(next);}
  function addAxis(){
    const axis=axisName.trim(),hours=parsePositiveInteger(axisHours);
    if(!axis||!hours){setFeedback({type:"error",text:"Informe o nome e a carga horária do eixo."});return;}
    if(axes.some((item)=>normalizeCourseText(item.name)===normalizeCourseText(axis))){setFeedback({type:"error",text:"Esse eixo já foi cadastrado."});return;}
    if(allocated+hours>total){setFeedback({type:"error",text:`O eixo ultrapassa as ${total}h do curso.`});return;}
    setAxes((current)=>[...current,{key:createCourseStudioKey("axis"),name:axis,hours:String(hours)}]);
    if(!lessonAxis)setLessonAxis(axis);setAxisName("");setAxisHours("");setFeedback(null);
  }
  function removeAxis(key:string){
    const axis=axes.find((item)=>item.key===key);if(!axis)return;
    const linked=lessons.some((lesson)=>normalizeCourseText(lesson.axis)===normalizeCourseText(axis.name));
    if(linked&&!confirm(`Remover o eixo ${axis.name} e todas as aulas vinculadas?`))return;
    setAxes((current)=>current.filter((item)=>item.key!==key));
    setLessons((current)=>current.filter((lesson)=>normalizeCourseText(lesson.axis)!==normalizeCourseText(axis.name)).map((lesson,index)=>({...lesson,order:index+1})));
  }
  function addLesson(){
    const axis=axes.find((item)=>normalizeCourseText(item.name)===normalizeCourseText(lessonAxis));
    if(!axis||!lessonContent.trim()){setFeedback({type:"error",text:"Selecione o eixo e informe o conteúdo da aula."});return;}
    const used=lessonCountByAxis.get(normalizeCourseText(axis.name))??0;
    if(used>=parsePositiveInteger(axis.hours)){setFeedback({type:"error",text:`O eixo ${axis.name} já atingiu sua carga horária.`});return;}
    if(lessons.length>=total){setFeedback({type:"error",text:"A grade já atingiu a carga horária do curso."});return;}
    setLessons((current)=>[...current,{key:createCourseStudioKey("lesson"),order:current.length+1,axis:axis.name,subject:lessonSubject.trim(),type:lessonType.trim()||"Aula",content:lessonContent.trim()}]);
    setLessonSubject("");setLessonContent("");setFeedback(null);
  }
  function importSheet(mode:"replace"|"append"){
    const parsed=parseCourseSpreadsheet(sheet);if(!parsed.length){setFeedback({type:"error",text:"Nenhuma aula válida foi encontrada na planilha."});return;}
    const combined=(mode==="replace"?parsed:[...lessons,...parsed]).map((lesson,index)=>({...lesson,order:index+1}));
    if(combined.length>total){setFeedback({type:"error",text:`A importação resultaria em ${combined.length} aulas, acima das ${total}h do curso.`});return;}
    const nextAxes=cloneAxes(axes);
    inferAxesFromLessons(combined).forEach(({name:axis,count})=>{const found=nextAxes.find((item)=>normalizeCourseText(item.name)===normalizeCourseText(axis));if(found){if(parsePositiveInteger(found.hours)<count)found.hours=String(count);}else nextAxes.push({key:createCourseStudioKey("axis"),name:axis,hours:String(count)});});
    if(nextAxes.reduce((sum,axis)=>sum+parsePositiveInteger(axis.hours),0)>total){setFeedback({type:"error",text:"Os eixos da planilha ultrapassam a carga total do curso."});return;}
    setAxes(nextAxes);setLessons(combined);setSheet("");setFeedback({type:"success",text:`${parsed.length} aula(s) importada(s).`});
  }
  async function save(status:"in_progress"|"ready"){
    if(!validate(3))return;
    if(status==="ready"&&allocated!==total){setFeedback({type:"error",text:`Distribua exatamente ${total}h entre os eixos.`});return;}
    if(status==="ready"&&lessons.length!==total){setFeedback({type:"error",text:`Cadastre exatamente ${total} aulas de 1h para concluir.`});return;}
    setSaving(true);setFeedback(null);
    const {data:course,error:courseError}=await supabase.from("courses").insert({name:name.trim(),description:description.trim()||null,status:"Ativo",total_workload_minutes:total*60,curriculum_status:status}).select("id").single();
    if(courseError||!course){setSaving(false);setFeedback({type:"error",text:courseError?.message||"Erro ao criar curso."});return;}
    const {data:insertedAxes,error:axesError}=await supabase.from("course_axes").insert(axes.map((axis,index)=>({course_id:course.id,name:axis.name.trim(),workload_hours:parsePositiveInteger(axis.hours),axis_order:index+1}))).select("id, name");
    if(axesError||!insertedAxes){await supabase.from("courses").delete().eq("id",course.id);setSaving(false);setFeedback({type:"error",text:axesError?.message||"Erro ao salvar os eixos."});return;}
    const ids=new Map(insertedAxes.map((axis)=>[normalizeCourseText(String(axis.name)),String(axis.id)]));
    if(lessons.length){const {error}=await supabase.from("curriculum_lessons").insert(lessons.map((lesson,index)=>({course_id:course.id,axis_id:ids.get(normalizeCourseText(lesson.axis))||null,title:createLessonTitle(index+1,lesson.subject,lesson.content),subject:lesson.subject.trim()||null,lesson_type:lesson.type.trim()||"Aula",content:lesson.content.trim(),notes:"",lesson_order:index+1,duration_minutes:60})));if(error){await supabase.from("courses").delete().eq("id",course.id);setSaving(false);setFeedback({type:"error",text:error.message});return;}}
    setSaving(false);reset();window.location.reload();
  }

  return <section className="overflow-hidden rounded-[32px] border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-slate-950/80 to-cyan-500/10 shadow-2xl">
    <div className="border-b border-slate-800 px-5 py-6 sm:px-7">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between"><div className="flex items-start gap-3"><div className="rounded-2xl bg-violet-500/20 p-3 text-violet-200"><Sparkles size={25}/></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-violet-300">Novo fluxo</p><h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">Criar curso completo</h2><p className="mt-2 text-sm text-slate-400">Dados, eixos e grade de aulas no mesmo fluxo.</p></div></div><button type="button" onClick={reset} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm font-bold text-slate-300"><RotateCcw size={17}/> Limpar</button></div>
      <div className="mt-6 grid gap-3 lg:grid-cols-3">{steps.map(([number,title,subtitle])=>{const active=step===number,completed=step>number;return <button key={number} type="button" onClick={()=>goTo(number)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left ${active?"border-violet-400 bg-violet-500/15":completed?"border-emerald-500/25 bg-emerald-500/5":"border-slate-800 bg-slate-950/40"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${active?"bg-violet-500 text-white":completed?"bg-emerald-500 text-slate-950":"bg-slate-800 text-slate-400"}`}>{completed?<Check size={17}/>:number}</span><span><strong className="block text-white">{title}</strong><span className="text-xs text-slate-500">{subtitle}</span></span></button>;})}</div>
    </div>
    <div className="p-5 sm:p-7">
      {feedback&&<div className={`mb-5 rounded-2xl border px-4 py-3 text-sm ${feedback.type==="error"?"border-red-500/30 bg-red-500/10 text-red-200":feedback.type==="success"?"border-emerald-500/30 bg-emerald-500/10 text-emerald-200":"border-cyan-500/30 bg-cyan-500/10 text-cyan-200"}`}>{feedback.text}</div>}
      {step===1&&<CourseBasicsStep name={name} description={description} totalHours={totalHours} onNameChange={setName} onDescriptionChange={setDescription} onTotalHoursChange={setTotalHours}/>} 
      {step===2&&<CourseAxesStep totalHours={total} axes={axes} axisName={axisName} axisHours={axisHours} lessonCountByAxis={lessonCountByAxis} onAxisNameChange={setAxisName} onAxisHoursChange={setAxisHours} onAddAxis={addAxis} onRemoveAxis={removeAxis}/>} 
      {step===3&&<><ProgressCards total={total} allocated={allocated} lessons={lessons.length}/><div className="mt-6 grid gap-5 xl:grid-cols-2"><CourseManualLessonForm axes={axes} axis={lessonAxis} subject={lessonSubject} lessonType={lessonType} content={lessonContent} onAxisChange={setLessonAxis} onSubjectChange={setLessonSubject} onTypeChange={setLessonType} onContentChange={setLessonContent} onAdd={addLesson}/><CourseSpreadsheetImporter text={sheet} onTextChange={setSheet} onImport={importSheet}/></div><LessonTable lessons={lessons} onRemove={(key)=>setLessons((current)=>current.filter((lesson)=>lesson.key!==key).map((lesson,index)=>({...lesson,order:index+1})))}/></>}
      <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-800 pt-5 sm:flex-row sm:items-center sm:justify-between"><button type="button" disabled={step===1} onClick={()=>setStep((current)=>Math.max(1,current-1))} className="h-11 rounded-xl border border-slate-700 px-5 text-sm font-bold text-slate-300 disabled:opacity-30">Voltar</button>{step<3?<button type="button" onClick={()=>goTo(step+1)} className="h-11 rounded-xl bg-violet-500 px-6 text-sm font-black text-white">Continuar</button>:<div className="flex flex-col gap-2 sm:flex-row"><button type="button" onClick={()=>save("in_progress")} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 text-sm font-black text-violet-200"><Save size={17}/> Salvar em construção</button><button type="button" onClick={()=>save("ready")} disabled={saving} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-black text-slate-950">{saving?<Loader2 size={17} className="animate-spin"/>:<Check size={17}/>} Concluir curso</button></div>}</div>
    </div>
  </section>;
}

export function CourseBasicsStep({name,description,totalHours,onNameChange,onDescriptionChange,onTotalHoursChange}:{name:string;description:string;totalHours:string;onNameChange:(value:string)=>void;onDescriptionChange:(value:string)=>void;onTotalHoursChange:(value:string)=>void;}){
  return <div className="grid gap-5 lg:grid-cols-[1fr_260px]"><div className="grid gap-4"><Field label="Nome do curso"><input value={name} onChange={(event)=>onNameChange(event.target.value)} placeholder="Ex.: Informática Essencial" className={inputClass}/></Field><Field label="Descrição"><textarea value={description} onChange={(event)=>onDescriptionChange(event.target.value)} rows={4} placeholder="Objetivo, público e contexto do curso" className={`${inputClass} h-auto resize-none py-3`}/></Field></div><div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5"><BookOpenCheck size={24} className="text-cyan-300"/><p className="mt-4 text-xs font-black uppercase tracking-wide text-cyan-200">Carga horária total</p><div className="mt-3 flex items-end gap-2"><input type="number" min="1" step="1" value={totalHours} onChange={(event)=>onTotalHoursChange(event.target.value)} placeholder="136" className="h-14 min-w-0 flex-1 rounded-2xl border border-cyan-500/30 bg-slate-950 px-4 text-2xl font-black text-white outline-none"/><span className="pb-3 text-sm font-black text-cyan-200">horas</span></div><p className="mt-3 text-xs text-slate-400">Uma hora corresponde a uma unidade de aula.</p></div></div>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">{label}</span>{children}</label>;}
function LessonTable({lessons,onRemove}:{lessons:LessonDraft[];onRemove:(key:string)=>void}){return <div className="mt-6 overflow-hidden rounded-3xl border border-slate-800"><div className="border-b border-slate-800 bg-slate-900/70 px-4 py-3"><h3 className="font-black text-white">Prévia da grade</h3><p className="text-xs text-slate-500">{lessons.length} aula(s)</p></div><div className="max-h-[460px] overflow-auto"><table className="min-w-full text-left text-sm"><thead className="sticky top-0 bg-slate-950 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Nº</th><th className="px-4 py-3">Eixo</th><th className="px-4 py-3">Matéria</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Conteúdo</th><th></th></tr></thead><tbody className="divide-y divide-slate-800">{lessons.map((lesson)=><tr key={lesson.key}><td className="px-4 py-3 font-black text-violet-300">{lesson.order}</td><td className="px-4 py-3 text-slate-300">{lesson.axis}</td><td className="px-4 py-3 text-slate-300">{lesson.subject||"—"}</td><td className="px-4 py-3 text-slate-400">{lesson.type}</td><td className="min-w-[320px] px-4 py-3 text-white">{lesson.content}</td><td className="px-2"><button type="button" onClick={()=>onRemove(lesson.key)} className="p-2 text-slate-500 hover:text-red-300"><X size={15}/></button></td></tr>)}{!lessons.length&&<tr><td colSpan={6} className="px-4 py-10 text-center text-slate-500">Adicione aulas manualmente ou importe a planilha.</td></tr>}</tbody></table></div></div>;}
