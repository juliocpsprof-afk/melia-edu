"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Pencil,
  Save,
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "../../lib/supabase";

export type LessonDiary = {
  id: string;
  lesson_date: string;
  content: string;
  notes: string | null;
  classes:
    | {
        name?: string | null;
      }
    | {
        name?: string | null;
      }[]
    | null;
};

type DiaryLessonCardsProps = {
  lessons: LessonDiary[];
};

function getClassName(lesson: LessonDiary) {
  if (!lesson.classes) {
    return "Sem turma";
  }

  if (Array.isArray(lesson.classes)) {
    return lesson.classes[0]?.name || "Sem turma";
  }

  return lesson.classes.name || "Sem turma";
}

export function DiaryLessonCards({ lessons }: DiaryLessonCardsProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  function startEditing(lesson: LessonDiary) {
    setEditingId(lesson.id);
    setEditDate(lesson.lesson_date);
    setEditContent(lesson.content);
    setEditNotes(lesson.notes ?? "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditDate("");
    setEditContent("");
    setEditNotes("");
  }

  async function updateLesson(lessonId: string) {
    if (!editDate || !editContent.trim()) {
      toast.error("Informe a data e o conteúdo da aula.");
      return;
    }

    setLoadingId(lessonId);

    const { error } = await supabase
      .from("lesson_diary")
      .update({
        lesson_date: editDate,
        content: editContent.trim(),
        notes: editNotes.trim() || null,
      })
      .eq("id", lessonId);

    setLoadingId(null);

    if (error) {
      toast.error("Erro ao atualizar aula.");
      console.error(error);
      return;
    }

    toast.success("Aula atualizada com sucesso!");

    cancelEditing();

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  async function deleteLesson(lessonId: string) {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta aula do diário? Essa ação não pode ser desfeita."
    );

    if (!confirmed) {
      return;
    }

    setLoadingId(lessonId);

    const { error } = await supabase
      .from("lesson_diary")
      .delete()
      .eq("id", lessonId);

    setLoadingId(null);

    if (error) {
      toast.error("Erro ao excluir aula.");
      console.error(error);
      return;
    }

    toast.success("Aula excluída do diário!");

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Aulas registradas</h2>

          <p className="mt-1 text-sm text-slate-400">
            Edite ou exclua registros lançados no diário de classe.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {lessons.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
            Nenhuma aula registrada no diário.
          </div>
        ) : (
          lessons.map((lesson) => {
            const isEditing = editingId === lesson.id;
            const isLoading = loadingId === lesson.id;

            return (
              <div
                key={lesson.id}
                className={`rounded-3xl border p-6 transition ${
                  isEditing
                    ? "border-violet-400/60 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-slate-800 bg-slate-900/40"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge
                      icon={<GraduationCap size={16} />}
                      text={getClassName(lesson)}
                    />

                    <Badge
                      icon={<CalendarDays size={16} />}
                      text={new Date(lesson.lesson_date).toLocaleDateString(
                        "pt-BR"
                      )}
                    />

                    {isEditing && (
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-sm font-semibold text-violet-200">
                        Editando aula
                      </span>
                    )}
                  </div>

                  {!isEditing && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(lesson)}
                        className="flex items-center gap-2 rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/20"
                      >
                        <Pencil size={16} />
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteLesson(lesson.id)}
                        disabled={isLoading}
                        className="flex items-center gap-2 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Excluir
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-6 space-y-4">
                    <input
                      type="date"
                      value={editDate}
                      onChange={(event) => setEditDate(event.target.value)}
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    />

                    <input
                      value={editContent}
                      onChange={(event) => setEditContent(event.target.value)}
                      placeholder="Conteúdo ministrado"
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    />

                    <textarea
                      value={editNotes}
                      onChange={(event) => setEditNotes(event.target.value)}
                      placeholder="Observações da aula"
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    />

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => updateLesson(lesson.id)}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
                      >
                        <Save size={18} />
                        {isLoading ? "Salvando..." : "Salvar alterações"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEditing}
                        disabled={isLoading}
                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
                      >
                        <X size={18} />
                        Cancelar edição
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex items-start gap-4">
                    <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
                      <BookOpen size={28} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold">{lesson.content}</h2>

                      {lesson.notes && (
                        <p className="mt-3 leading-7 text-slate-400">
                          {lesson.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function Badge({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-sm text-slate-300">
      <span className="text-violet-400">{icon}</span>
      {text}
    </div>
  );
}