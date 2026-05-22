"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Save,
  Search,
  Star,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Grade = {
  id?: string | null;
  student_id?: string | null;
  title: string | null;
  score: number | string | null;
  date: string | null;
  feedback?: string | null;
};

type Student = {
  id: string;
  name: string;
  class_name: string | null;
  grades?: Grade[];
};

type EditForm = {
  title: string;
  score: string;
  date: string;
  feedback: string;
  reason: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getInputDate(date: string | null) {
  if (!date) {
    return getTodayDate();
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(date)) {
    return date.slice(0, 10);
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return getTodayDate();
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, "0");
  const day = String(parsedDate.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Sem data";
  }

  const parsedDate = new Date(
    `${date}`.includes("T") ? date : `${date}T00:00:00`
  );

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function formatScore(score: number | string | null) {
  const numericScore = Number(score);

  if (Number.isNaN(numericScore)) {
    return "0.0";
  }

  return numericScore.toFixed(1);
}

function getAverage(grades: Grade[]) {
  const validGrades = grades
    .map((grade) => Number(grade.score))
    .filter((score) => !Number.isNaN(score));

  if (validGrades.length === 0) {
    return 0;
  }

  return (
    validGrades.reduce((sum, score) => sum + score, 0) / validGrades.length
  );
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Não foi possível concluir a operação.";
}

export function GradesHistory({ students }: { students: Student[] }) {
  const [search, setSearch] = useState("");
  const [openStudentId, setOpenStudentId] = useState<string | null>(null);

  const [editingGradeId, setEditingGradeId] = useState<string | null>(null);
  const [savingGradeId, setSavingGradeId] = useState<string | null>(null);
  const [deletingGradeId, setDeletingGradeId] = useState<string | null>(null);

  const [message, setMessage] = useState<Message | null>(null);

  const [editForm, setEditForm] = useState<EditForm>({
    title: "",
    score: "",
    date: "",
    feedback: "",
    reason: "",
  });

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) => {
      const gradesText = (student.grades ?? [])
        .map(
          (grade) =>
            `${grade.title ?? ""} ${grade.date ?? ""} ${grade.feedback ?? ""}`
        )
        .join(" ");

      const searchableText = normalizeText(`
        ${student.name}
        ${student.class_name ?? ""}
        ${gradesText}
      `);

      return searchableText.includes(normalizedSearch);
    });
  }, [students, search]);

  function updateEditForm(field: keyof EditForm, value: string) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit(grade: Grade) {
    setMessage(null);

    const gradeId = grade.id ? String(grade.id) : "";

    if (!gradeId) {
      setMessage({
        type: "error",
        text: "Esta nota não carregou o ID. Envie o arquivo src/app/dashboard/notas/page.tsx para eu ajustar o carregamento das notas.",
      });

      return;
    }

    setEditingGradeId(gradeId);
    setSavingGradeId(null);
    setDeletingGradeId(null);

    setEditForm({
      title: grade.title || "",
      score: String(grade.score ?? ""),
      date: getInputDate(grade.date),
      feedback: grade.feedback || "",
      reason: "",
    });
  }

  function cancelEdit() {
    setEditingGradeId(null);
    setSavingGradeId(null);

    setEditForm({
      title: "",
      score: "",
      date: "",
      feedback: "",
      reason: "",
    });
  }

  async function recalculateStudentAverage(studentId: string) {
    const { data, error } = await supabase
      .from("grades")
      .select("score")
      .eq("student_id", studentId);

    if (error) {
      throw error;
    }

    const scores =
      data
        ?.map((item) => Number(item.score))
        .filter((score) => !Number.isNaN(score)) ?? [];

    const average =
      scores.length > 0
        ? Number(
            (
              scores.reduce((sum, score) => sum + score, 0) / scores.length
            ).toFixed(1)
          )
        : 0;

    const { error: updateStudentError } = await supabase
      .from("students")
      .update({ average })
      .eq("id", studentId);

    if (updateStudentError) {
      throw updateStudentError;
    }
  }

  async function saveEdit(studentId: string, gradeId: string) {
    setMessage(null);

    if (!gradeId) {
      setMessage({
        type: "error",
        text: "Esta nota não carregou o ID. Não é possível editar sem o ID da nota.",
      });

      return;
    }

    if (!editForm.title.trim()) {
      setMessage({
        type: "error",
        text: "Informe o título da nota.",
      });

      return;
    }

    const numericScore = Number(editForm.score);

    if (Number.isNaN(numericScore)) {
      setMessage({
        type: "error",
        text: "Informe uma nota válida.",
      });

      return;
    }

    if (!editForm.reason.trim()) {
      setMessage({
        type: "error",
        text: "Informe a observação explicando o motivo da alteração.",
      });

      return;
    }

    setSavingGradeId(gradeId);

    try {
      const auditNote = `Alteração registrada em ${new Date().toLocaleString(
        "pt-BR"
      )}: ${editForm.reason.trim()}`;

      const finalFeedback = editForm.feedback.trim()
        ? `${editForm.feedback.trim()}\n\n${auditNote}`
        : auditNote;

      const { error } = await supabase
        .from("grades")
        .update({
          title: editForm.title.trim(),
          score: numericScore,
          date: editForm.date || null,
          feedback: finalFeedback,
        })
        .eq("id", gradeId);

      if (error) {
        throw error;
      }

      await recalculateStudentAverage(studentId);

      setMessage({
        type: "success",
        text: "Nota editada e média recalculada com sucesso.",
      });

      cancelEdit();

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao editar nota: ${getErrorMessage(error)}`,
      });

      setSavingGradeId(null);
    }
  }

  async function deleteGrade(studentId: string, gradeId: string) {
    setMessage(null);

    if (!gradeId) {
      setMessage({
        type: "error",
        text: "Esta nota não carregou o ID. Não é possível excluir sem o ID da nota.",
      });

      return;
    }

    const confirmed = window.confirm(
      "Tem certeza que deseja excluir esta nota? Ela sairá do histórico e do cálculo da média do aluno."
    );

    if (!confirmed) {
      return;
    }

    setDeletingGradeId(gradeId);

    try {
      const { error } = await supabase
        .from("grades")
        .delete()
        .eq("id", gradeId);

      if (error) {
        throw error;
      }

      await recalculateStudentAverage(studentId);

      setMessage({
        type: "success",
        text: "Nota excluída e média recalculada com sucesso.",
      });

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao excluir nota: ${getErrorMessage(error)}`,
      });

      setDeletingGradeId(null);
    }
  }

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Histórico de notas
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Clique no aluno para abrir as notas. Use Editar ou Excluir em cada
            card.
          </p>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 lg:w-[420px]">
          <Search size={18} className="text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por aluno, turma, atividade ou data..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      {message && (
        <div
          className={`mt-5 rounded-2xl border px-4 py-3 text-sm font-semibold ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="mt-5 text-sm text-slate-400">
        {filteredStudents.length} aluno(s) encontrado(s)
      </div>

      <div className="mt-6 space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-slate-400">
            Nenhum aluno encontrado.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const grades = student.grades ?? [];
            const average = getAverage(grades);
            const isOpen = openStudentId === student.id;

            return (
              <div
                key={student.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-violet-500/30"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenStudentId(isOpen ? null : student.id)
                  }
                  className="flex w-full flex-col gap-3 text-left md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                      <UserRound size={20} />
                    </div>

                    <div>
                      <p className="text-lg font-semibold text-white">
                        {student.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        {student.class_name || "Sem turma"}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="rounded-xl bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
                      Média: {average.toFixed(1)}
                    </div>

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300">
                      {isOpen ? (
                        <ChevronUp size={18} />
                      ) : (
                        <ChevronDown size={18} />
                      )}
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {grades.length === 0 ? (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-500">
                        Nenhuma nota lançada.
                      </div>
                    ) : (
                      grades.map((grade, index) => {
                        const gradeId = grade.id ? String(grade.id) : "";
                        const isEditing =
                          Boolean(gradeId) && editingGradeId === gradeId;
                        const isSaving =
                          Boolean(gradeId) && savingGradeId === gradeId;
                        const isDeleting =
                          Boolean(gradeId) && deletingGradeId === gradeId;

                        return (
                          <div
                            key={`${student.id}-${gradeId || index}`}
                            className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                          >
                            {!isEditing ? (
                              <>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate font-medium text-white">
                                      {grade.title || "Nota sem título"}
                                    </p>

                                    <p className="mt-1 text-xs text-slate-500">
                                      {formatDate(grade.date)}
                                    </p>
                                  </div>

                                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-500/10 text-lg font-black text-violet-300">
                                    {formatScore(grade.score)}
                                  </div>
                                </div>

                                {grade.feedback && (
                                  <div className="mt-3 whitespace-pre-line rounded-xl border border-slate-800 bg-slate-950/50 p-3 text-xs leading-5 text-slate-300">
                                    {grade.feedback}
                                  </div>
                                )}

                                <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                                  <Star
                                    size={14}
                                    className="text-violet-400"
                                  />
                                  Nota registrada
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => startEdit(grade)}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-400"
                                  >
                                    <Edit3 size={16} />
                                    Editar
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      deleteGrade(student.id, gradeId)
                                    }
                                    disabled={isDeleting}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                                  >
                                    <Trash2 size={16} />
                                    {isDeleting ? "Excluindo..." : "Excluir"}
                                  </button>
                                </div>
                              </>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-3">
                                  <h3 className="font-semibold text-white">
                                    Editar nota
                                  </h3>

                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800"
                                  >
                                    <X size={16} />
                                  </button>
                                </div>

                                <input
                                  value={editForm.title}
                                  onChange={(event) =>
                                    updateEditForm("title", event.target.value)
                                  }
                                  placeholder="Título da nota"
                                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-400"
                                />

                                <div className="grid gap-3 sm:grid-cols-2">
                                  <input
                                    type="number"
                                    value={editForm.score}
                                    onChange={(event) =>
                                      updateEditForm(
                                        "score",
                                        event.target.value
                                      )
                                    }
                                    placeholder="Nota"
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-400"
                                  />

                                  <input
                                    type="date"
                                    value={editForm.date}
                                    onChange={(event) =>
                                      updateEditForm("date", event.target.value)
                                    }
                                    style={{ colorScheme: "dark" }}
                                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
                                  />
                                </div>

                                <textarea
                                  value={editForm.feedback}
                                  onChange={(event) =>
                                    updateEditForm(
                                      "feedback",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Observação/feedback da nota"
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-violet-400"
                                />

                                <textarea
                                  value={editForm.reason}
                                  onChange={(event) =>
                                    updateEditForm("reason", event.target.value)
                                  }
                                  placeholder="Motivo obrigatório da alteração"
                                  rows={3}
                                  className="w-full resize-none rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100 outline-none placeholder:text-amber-200/50 focus:border-amber-300"
                                />

                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => saveEdit(student.id, gradeId)}
                                    disabled={isSaving}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                                  >
                                    <Save size={16} />
                                    {isSaving ? "Salvando..." : "Salvar"}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                                  >
                                    <X size={16} />
                                    Cancelar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
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