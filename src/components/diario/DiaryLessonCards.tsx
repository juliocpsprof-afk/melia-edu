"use client";

import { ReactNode, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  Eye,
  FilterX,
  GraduationCap,
  Pencil,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";

export type LessonDiary = {
  id: string;
  class_id?: string | null;
  lesson_date: string;
  content: string | null;
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

type ClassItem = {
  id: string;
  name: string;
  course_id?: string | null;
};

type DiaryLessonCardsProps = {
  lessons: LessonDiary[];
  classes?: ClassItem[];
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getClassName(lesson: LessonDiary) {
  if (!lesson.classes) {
    return "Sem turma";
  }

  if (Array.isArray(lesson.classes)) {
    return lesson.classes[0]?.name || "Sem turma";
  }

  return lesson.classes.name || "Sem turma";
}

function formatDate(date: string | null | undefined) {
  if (!date) {
    return "Sem data";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sem data";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function getMainLessonTitle(content: string | null) {
  if (!content?.trim()) {
    return "Aula sem título";
  }

  const lines = content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "Aula sem título";
  }

  const firstLine = lines[0];

  if (firstLine.length <= 85) {
    return firstLine;
  }

  return `${firstLine.slice(0, 85)}...`;
}

function getShortContent(content: string | null) {
  if (!content?.trim()) {
    return "Sem conteúdo registrado.";
  }

  const compact = content.replace(/\s+/g, " ").trim();

  if (compact.length <= 160) {
    return compact;
  }

  return `${compact.slice(0, 160)}...`;
}

export function DiaryLessonCards({
  lessons,
  classes = [],
}: DiaryLessonCardsProps) {
  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedDate, setSelectedDate] = useState("");

  const [openLessonId, setOpenLessonId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editDate, setEditDate] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredLessons = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return lessons.filter((lesson) => {
      const className = getClassName(lesson);

      const matchesSearch =
        !normalizedSearch ||
        normalizeText(`
          ${className}
          ${lesson.lesson_date}
          ${lesson.content || ""}
          ${lesson.notes || ""}
        `).includes(normalizedSearch);

      const matchesClass =
        selectedClassId === "all" || lesson.class_id === selectedClassId;

      const matchesDate =
        !selectedDate || lesson.lesson_date === selectedDate;

      return matchesSearch && matchesClass && matchesDate;
    });
  }, [lessons, search, selectedClassId, selectedDate]);

  const hasFilters =
    search.trim() !== "" || selectedClassId !== "all" || selectedDate !== "";

  function clearFilters() {
    setSearch("");
    setSelectedClassId("all");
    setSelectedDate("");
  }

  function toggleDetails(lessonId: string) {
    setOpenLessonId((current) => (current === lessonId ? null : lessonId));
  }

  function startEditing(lesson: LessonDiary) {
    setEditingId(lesson.id);
    setOpenLessonId(lesson.id);
    setEditDate(lesson.lesson_date);
    setEditContent(lesson.content || "");
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
      toast.error(`Erro ao atualizar aula: ${error.message}`);
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
      toast.error(`Erro ao excluir aula: ${error.message}`);
      return;
    }

    toast.success("Aula excluída do diário!");

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Aulas registradas
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Pesquise, filtre, edite e consulte os registros do diário sem
              deixar a tela poluída.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-300">
            {filteredLessons.length} de {lessons.length} aula(s)
          </div>
        </div>

        <div className="mt-6 grid gap-3 xl:grid-cols-[1.4fr_0.8fr_0.7fr_auto]">
          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
            <Search size={18} className="text-slate-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por turma, data, assunto ou observação..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="h-12 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
          >
            <option value="all">Todas as turmas</option>

            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(event) => setSelectedDate(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="h-12 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
          />

          <button
            type="button"
            onClick={clearFilters}
            disabled={!hasFilters}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <FilterX size={17} />
            Limpar
          </button>
        </div>
      </div>

      {filteredLessons.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
          Nenhuma aula encontrada com os filtros atuais.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredLessons.map((lesson) => {
            const isOpen = openLessonId === lesson.id;
            const isEditing = editingId === lesson.id;
            const isLoading = loadingId === lesson.id;

            return (
              <div
                key={lesson.id}
                className={`rounded-3xl border p-5 transition ${
                  isEditing
                    ? "border-violet-400/60 bg-violet-500/10 shadow-lg shadow-violet-500/10"
                    : "border-slate-800 bg-slate-900/40 hover:border-violet-500/30"
                }`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        icon={<GraduationCap size={16} />}
                        text={getClassName(lesson)}
                      />

                      <Badge
                        icon={<CalendarDays size={16} />}
                        text={formatDate(lesson.lesson_date)}
                      />

                      {isEditing && (
                        <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-3 py-1 text-sm font-semibold text-violet-200">
                          Editando
                        </span>
                      )}
                    </div>

                    <h3 className="mt-4 line-clamp-2 text-xl font-bold text-white">
                      {getMainLessonTitle(lesson.content)}
                    </h3>

                    {!isOpen && !isEditing && (
                      <p className="mt-2 line-clamp-1 text-sm text-slate-400">
                        {getShortContent(lesson.content)}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <ActionButton
                      icon={
                        isOpen ? (
                          <ChevronUp size={15} />
                        ) : (
                          <ChevronDown size={15} />
                        )
                      }
                      text={isOpen ? "Ocultar" : "Detalhes"}
                      onClick={() => toggleDetails(lesson.id)}
                    />

                    <ActionButton
                      icon={<Pencil size={15} />}
                      text="Editar"
                      onClick={() => startEditing(lesson)}
                    />

                    <ActionButton
                      icon={<Trash2 size={15} />}
                      text={isLoading ? "Excluindo..." : "Excluir"}
                      danger
                      disabled={isLoading}
                      onClick={() => deleteLesson(lesson.id)}
                    />
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-5 rounded-2xl border border-violet-500/20 bg-slate-950/50 p-4">
                    <div className="grid gap-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Data da aula
                        </label>

                        <input
                          type="date"
                          value={editDate}
                          onChange={(event) => setEditDate(event.target.value)}
                          style={{ colorScheme: "dark" }}
                          className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Conteúdo da aula
                        </label>

                        <textarea
                          value={editContent}
                          onChange={(event) =>
                            setEditContent(event.target.value)
                          }
                          rows={5}
                          placeholder="Conteúdo registrado..."
                          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-300">
                          Observações
                        </label>

                        <textarea
                          value={editNotes}
                          onChange={(event) => setEditNotes(event.target.value)}
                          rows={3}
                          placeholder="Observações da aula..."
                          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
                        />
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => updateLesson(lesson.id)}
                          disabled={isLoading}
                          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                        >
                          <Save size={16} />
                          {isLoading ? "Salvando..." : "Salvar alterações"}
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  isOpen && (
                    <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div>
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-violet-300">
                            <BookOpen size={17} />
                            Conteúdo completo
                          </div>

                          <div className="whitespace-pre-line rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm leading-7 text-slate-300">
                            {lesson.content || "Sem conteúdo registrado."}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-cyan-300">
                            <Eye size={17} />
                            Observações
                          </div>

                          <div className="whitespace-pre-line rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm leading-7 text-slate-300">
                            {lesson.notes || "Sem observações."}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}
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
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-sm font-semibold text-slate-300">
      <span className="text-violet-400">{icon}</span>
      {text}
    </span>
  );
}

function ActionButton({
  icon,
  text,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: ReactNode;
  text: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${
        danger
          ? "border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500/20"
          : "border-violet-500/20 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20"
      }`}
    >
      {icon}
      {text}
    </button>
  );
}