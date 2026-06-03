"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Save,
  Search,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type SchoolClass = {
  id: string;
  name: string;
};

type Submission = {
  id: string;
  activity_id: string;
  content: string | null;
  status: string | null;
  grade: number | null;
  feedback: string | null;
  student_id: string;
  student_name: string;
  student_class_id: string | null;
  activity_title: string;
  activity_due_date: string | null;
  activity_class_id: string | null;
  class_name: string;
  created_at: string | null;
};

type SubmissionGroup = {
  key: string;
  activity_id: string;
  activity_title: string;
  activity_due_date: string | null;
  class_id: string | null;
  class_name: string;
  submissions: Submission[];
  pendingCount: number;
  correctedCount: number;
  totalCount: number;
  isOverdue: boolean;
};

type EditState = {
  grade: string;
  feedback: string;
};

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string | null) {
  if (!date) {
    return "Sem data";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function isSubmissionCorrected(submission: Submission) {
  if (submission.grade !== null && submission.grade !== undefined) {
    return true;
  }

  const status = normalizeText(submission.status ?? "");

  return (
    status === "corrigida" ||
    status === "corrigido" ||
    status === "avaliada" ||
    status === "avaliado"
  );
}

function getVisibleStatus(submission: Submission, isOverdue: boolean) {
  if (isSubmissionCorrected(submission)) {
    return "Corrigida";
  }

  if (isOverdue) {
    return "Atrasada";
  }

  return submission.status || "Pendente";
}

function parseGrade(value: string) {
  const cleanValue = value.trim().replace(",", ".");

  if (!cleanValue) {
    return null;
  }

  const numberValue = Number(cleanValue);

  if (!Number.isFinite(numberValue)) {
    return "invalid";
  }

  return numberValue;
}

function getGroupKey(submission: Submission) {
  const classId =
    submission.activity_class_id || submission.student_class_id || "sem-turma";

  return `${submission.activity_id || "sem-atividade"}-${classId}`;
}

function buildGroups(submissions: Submission[]) {
  const today = getTodayDate();
  const groupsMap = new Map<string, SubmissionGroup>();

  submissions.forEach((submission) => {
    const key = getGroupKey(submission);
    const classId =
      submission.activity_class_id || submission.student_class_id || null;

    const existingGroup = groupsMap.get(key);

    if (existingGroup) {
      existingGroup.submissions.push(submission);
      return;
    }

    groupsMap.set(key, {
      key,
      activity_id: submission.activity_id,
      activity_title: submission.activity_title || "Atividade",
      activity_due_date: submission.activity_due_date,
      class_id: classId,
      class_name: submission.class_name || "Turma",
      submissions: [submission],
      pendingCount: 0,
      correctedCount: 0,
      totalCount: 0,
      isOverdue: false,
    });
  });

  const groups = Array.from(groupsMap.values()).map((group) => {
    const sortedSubmissions = [...group.submissions].sort((a, b) =>
      a.student_name.localeCompare(b.student_name, "pt-BR")
    );

    const isOverdue = Boolean(
      group.activity_due_date && group.activity_due_date < today
    );

    const correctedCount = sortedSubmissions.filter((submission) =>
      isSubmissionCorrected(submission)
    ).length;

    const totalCount = sortedSubmissions.length;
    const pendingCount = totalCount - correctedCount;

    return {
      ...group,
      submissions: sortedSubmissions,
      correctedCount,
      totalCount,
      pendingCount,
      isOverdue: isOverdue && pendingCount > 0,
    };
  });

  return groups.sort((a, b) => {
    if (a.isOverdue !== b.isOverdue) {
      return a.isOverdue ? -1 : 1;
    }

    if (a.pendingCount !== b.pendingCount) {
      return b.pendingCount - a.pendingCount;
    }

    const dateA = a.activity_due_date || "9999-12-31";
    const dateB = b.activity_due_date || "9999-12-31";

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB);
    }

    return a.activity_title.localeCompare(b.activity_title, "pt-BR");
  });
}

export function SubmissionManager({
  submissions,
  classes,
}: {
  submissions: Submission[];
  classes: SchoolClass[];
}) {
  const [localSubmissions, setLocalSubmissions] =
    useState<Submission[]>(submissions);

  const [search, setSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [onlyPending, setOnlyPending] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [edits, setEdits] = useState<Record<string, EditState>>(() => {
    const initialEdits: Record<string, EditState> = {};

    submissions.forEach((submission) => {
      initialEdits[submission.id] = {
        grade:
          submission.grade === null || submission.grade === undefined
            ? ""
            : String(submission.grade),
        feedback: submission.feedback ?? "",
      };
    });

    return initialEdits;
  });

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const groups = useMemo(() => buildGroups(localSubmissions), [localSubmissions]);

  const filteredGroups = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return groups.filter((group) => {
      const matchesClass = selectedClassId
        ? group.class_id === selectedClassId
        : true;

      const matchesPending = onlyPending ? group.pendingCount > 0 : true;

      const searchableText = [
        group.activity_title,
        group.class_name,
        formatDate(group.activity_due_date),
        ...group.submissions.map((submission) => submission.student_name),
      ].join(" ");

      const matchesSearch = normalizedSearch
        ? normalizeText(searchableText).includes(normalizedSearch)
        : true;

      return matchesClass && matchesPending && matchesSearch;
    });
  }, [groups, search, selectedClassId, onlyPending]);

  const totalPending = groups.reduce((sum, group) => sum + group.pendingCount, 0);
  const totalOverdue = groups
    .filter((group) => group.isOverdue)
    .reduce((sum, group) => sum + group.pendingCount, 0);

  function toggleGroup(groupKey: string) {
    setOpenGroups((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }));
  }

  function updateEdit(submissionId: string, field: keyof EditState, value: string) {
    setEdits((current) => ({
      ...current,
      [submissionId]: {
        grade: current[submissionId]?.grade ?? "",
        feedback: current[submissionId]?.feedback ?? "",
        [field]: value,
      },
    }));
  }

  async function saveSubmission(submission: Submission) {
    setMessage(null);

    const currentEdit = edits[submission.id] ?? {
      grade: "",
      feedback: "",
    };

    const parsedGrade = parseGrade(currentEdit.grade);

    if (parsedGrade === "invalid") {
      setMessage({
        type: "error",
        text: "Digite uma nota válida.",
      });

      return;
    }

    setSavingId(submission.id);

    const nextStatus = parsedGrade === null ? "Pendente" : "Corrigida";

    const { error } = await supabase
      .from("submissions")
      .update({
        grade: parsedGrade,
        feedback: currentEdit.feedback.trim() || null,
        status: nextStatus,
      })
      .eq("id", submission.id);

    setSavingId(null);

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao salvar correção: ${error.message}`,
      });

      return;
    }

    setLocalSubmissions((current) =>
      current.map((item) =>
        item.id === submission.id
          ? {
              ...item,
              grade: parsedGrade,
              feedback: currentEdit.feedback.trim() || null,
              status: nextStatus,
            }
          : item
      )
    );

    setMessage({
      type: "success",
      text: `Correção de ${submission.student_name} salva com sucesso.`,
    });
  }

  async function deleteSubmission(submission: Submission) {
    const confirmed = window.confirm(
      `Deseja excluir a entrega de ${submission.student_name}?`
    );

    if (!confirmed) {
      return;
    }

    setMessage(null);
    setDeletingId(submission.id);

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submission.id);

    setDeletingId(null);

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao excluir entrega: ${error.message}`,
      });

      return;
    }

    setLocalSubmissions((current) =>
      current.filter((item) => item.id !== submission.id)
    );

    setMessage({
      type: "success",
      text: "Entrega excluída com sucesso.",
    });
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Correção das entregas</h2>

          <p className="mt-1 text-sm text-slate-400">
            As entregas automáticas ficam agrupadas por atividade e turma.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-500/15 p-2 text-violet-300">
                <Users size={18} />
              </div>

              <div>
                <p className="text-xs text-slate-500">Pendentes</p>
                <p className="text-2xl font-bold text-white">{totalPending}</p>
              </div>
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${
              totalOverdue > 0
                ? "animate-pulse border-red-500/40 bg-red-500/10"
                : "border-slate-800 bg-slate-950/70"
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`rounded-xl p-2 ${
                  totalOverdue > 0
                    ? "bg-red-500/15 text-red-300"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {totalOverdue > 0 ? (
                  <AlertTriangle size={18} />
                ) : (
                  <CheckCircle2 size={18} />
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500">Atrasadas</p>
                <p className="text-2xl font-bold text-white">{totalOverdue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={20} />
          ) : (
            <XCircle size={20} />
          )}

          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_240px_180px]">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <Search size={18} className="text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por atividade, turma ou aluno..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>

        <select
          value={selectedClassId}
          onChange={(event) => setSelectedClassId(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
        >
          <option value="">Todas as turmas</option>

          {classes.map((classItem) => (
            <option key={classItem.id} value={classItem.id}>
              {classItem.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => setOnlyPending((current) => !current)}
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
            onlyPending
              ? "border-yellow-400 bg-yellow-400 text-slate-950"
              : "border-slate-700 text-slate-300 hover:bg-slate-800"
          }`}
        >
          Só pendentes
        </button>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-6 text-center text-slate-400">
          Nenhuma entrega encontrada.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredGroups.map((group) => {
            const isOpen = openGroups[group.key] ?? group.isOverdue;

            return (
              <div
                key={group.key}
                className={`overflow-hidden rounded-3xl border transition ${
                  group.isOverdue
                    ? "border-red-500/40 bg-red-500/10 shadow-lg shadow-red-950/20"
                    : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-slate-900/50 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div
                      className={`mt-1 rounded-2xl p-3 ${
                        group.isOverdue
                          ? "bg-red-500/15 text-red-300"
                          : "bg-violet-500/15 text-violet-300"
                      }`}
                    >
                      {isOpen ? (
                        <ChevronDown size={22} />
                      ) : (
                        <ChevronRight size={22} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {group.isOverdue && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
                            <AlertTriangle size={13} />
                            Atrasada
                          </span>
                        )}

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                          {group.class_name}
                        </span>

                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold text-slate-300">
                          <Clock size={13} />
                          Entrega: {formatDate(group.activity_due_date)}
                        </span>
                      </div>

                      <h3 className="mt-3 truncate text-xl font-bold text-white">
                        {group.activity_title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {group.totalCount} aluno(s) • {group.correctedCount}{" "}
                        corrigida(s) • {group.pendingCount} pendente(s)
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center lg:min-w-[300px]">
                    <div className="rounded-2xl bg-slate-900 px-3 py-2">
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-lg font-bold text-white">
                        {group.totalCount}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-emerald-500/10 px-3 py-2">
                      <p className="text-xs text-emerald-300">Corrigidas</p>
                      <p className="text-lg font-bold text-emerald-300">
                        {group.correctedCount}
                      </p>
                    </div>

                    <div
                      className={`rounded-2xl px-3 py-2 ${
                        group.pendingCount > 0
                          ? "bg-yellow-500/10"
                          : "bg-slate-900"
                      }`}
                    >
                      <p className="text-xs text-yellow-300">Pendentes</p>
                      <p className="text-lg font-bold text-yellow-300">
                        {group.pendingCount}
                      </p>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 p-5">
                    <div className="grid gap-4">
                      {group.submissions.map((submission) => {
                        const visibleStatus = getVisibleStatus(
                          submission,
                          group.isOverdue
                        );

                        const currentEdit = edits[submission.id] ?? {
                          grade: "",
                          feedback: "",
                        };

                        const corrected = isSubmissionCorrected(submission);

                        return (
                          <div
                            key={submission.id}
                            className={`rounded-3xl border p-4 transition ${
                              group.isOverdue && !corrected
                                ? "border-red-500/30 bg-red-500/10"
                                : corrected
                                ? "border-emerald-500/20 bg-emerald-500/10"
                                : "border-slate-800 bg-slate-900/50"
                            }`}
                          >
                            <div className="grid gap-4 xl:grid-cols-[minmax(180px,260px)_120px_minmax(240px,1fr)_auto] xl:items-start">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`rounded-xl p-2 ${
                                      corrected
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : group.isOverdue
                                        ? "bg-red-500/15 text-red-300"
                                        : "bg-yellow-500/15 text-yellow-300"
                                    }`}
                                  >
                                    <UserCheck size={17} />
                                  </div>

                                  <div className="min-w-0">
                                    <p className="truncate font-bold text-white">
                                      {submission.student_name}
                                    </p>

                                    <p
                                      className={`text-xs font-semibold ${
                                        corrected
                                          ? "text-emerald-300"
                                          : group.isOverdue
                                          ? "text-red-300"
                                          : "text-yellow-300"
                                      }`}
                                    >
                                      {visibleStatus}
                                    </p>
                                  </div>
                                </div>

                                {submission.content && (
                                  <p className="mt-3 rounded-2xl bg-slate-950/60 p-3 text-sm leading-6 text-slate-300">
                                    {submission.content}
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-400">
                                  Nota
                                </label>

                                <input
                                  value={currentEdit.grade}
                                  onChange={(event) =>
                                    updateEdit(
                                      submission.id,
                                      "grade",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Ex.: 8,5"
                                  inputMode="decimal"
                                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
                                />
                              </div>

                              <div>
                                <label className="mb-2 block text-xs font-semibold text-slate-400">
                                  Observação do professor
                                </label>

                                <textarea
                                  value={currentEdit.feedback}
                                  onChange={(event) =>
                                    updateEdit(
                                      submission.id,
                                      "feedback",
                                      event.target.value
                                    )
                                  }
                                  placeholder="Escreva uma orientação, elogio ou correção..."
                                  rows={3}
                                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2 xl:justify-end">
                                <button
                                  type="button"
                                  onClick={() => saveSubmission(submission)}
                                  disabled={savingId === submission.id}
                                  className="flex items-center gap-2 rounded-2xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
                                >
                                  <Save size={16} />
                                  {savingId === submission.id
                                    ? "Salvando..."
                                    : "Salvar"}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteSubmission(submission)}
                                  disabled={deletingId === submission.id}
                                  className="flex items-center gap-2 rounded-2xl border border-red-500/30 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  <Trash2 size={16} />
                                  {deletingId === submission.id
                                    ? "Excluindo..."
                                    : "Excluir"}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}