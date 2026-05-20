"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  BookOpen,
  CheckCircle,
  Clock3,
  Edit3,
  History,
  Save,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type SchoolClass = {
  id: string;
  name: string;
};

type Submission = {
  id: string;
  content: string | null;
  status: string | null;
  grade: number | null;
  feedback: string | null;
  student_id: string;
  student_name: string;
  student_class_id: string | null;
  activity_title: string;
};

export function SubmissionManager({
  submissions,
  classes,
}: {
  submissions: Submission[];
  classes: SchoolClass[];
}) {
  const [historySearch, setHistorySearch] = useState("");
  const [historyClass, setHistoryClass] = useState("");
  const [showHistory, setShowHistory] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editGrade, setEditGrade] = useState("");
  const [editFeedback, setEditFeedback] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const pendingSubmissions = submissions.filter(
    (submission) => submission.status !== "Corrigida"
  );

  const correctedSubmissions = submissions.filter(
    (submission) => submission.status === "Corrigida"
  );

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const visibleHistory = useMemo(() => {
    const search = normalizeText(historySearch);

    return correctedSubmissions.filter((submission) => {
      const matchesClass = historyClass
        ? submission.student_class_id === historyClass
        : true;

      const matchesSearch = search
        ? normalizeText(
            `${submission.student_name} ${submission.activity_title}`
          ).includes(search)
        : true;

      return matchesClass && matchesSearch;
    });
  }, [correctedSubmissions, historySearch, historyClass]);

  function startEditing(submission: Submission) {
    setEditingId(submission.id);
    setEditContent(submission.content || "");
    setEditGrade(
      submission.grade === null || submission.grade === undefined
        ? ""
        : String(submission.grade)
    );
    setEditFeedback(submission.feedback || "");
  }

  function cancelEditing() {
    setEditingId(null);
    setEditContent("");
    setEditGrade("");
    setEditFeedback("");
  }

  async function deleteSubmission(submissionId: string) {
    const confirmed = confirm("Tem certeza que deseja excluir esta entrega?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", submissionId);

    if (error) {
      alert("Erro ao excluir entrega.");
      return;
    }

    window.location.reload();
  }

  async function saveEdit(submissionId: string) {
    setSavingId(submissionId);

    const { error } = await supabase
      .from("submissions")
      .update({
        content: editContent.trim() || null,
        grade: editGrade ? Number(editGrade) : null,
        feedback: editFeedback.trim() || null,
      })
      .eq("id", submissionId);

    setSavingId(null);

    if (error) {
      alert("Erro ao editar entrega.");
      return;
    }

    window.location.reload();
  }

  async function correctSubmission(submission: Submission, grade: string, feedback: string) {
    if (!grade) {
      alert("Digite uma nota antes de salvar.");
      return;
    }

    const { error } = await supabase
      .from("submissions")
      .update({
        grade: Number(grade),
        feedback: feedback.trim() || null,
        status: "Corrigida",
      })
      .eq("id", submission.id);

    if (error) {
      alert("Erro ao corrigir entrega.");
      return;
    }

    await supabase.from("grades").insert({
      student_id: submission.student_id,
      title: submission.activity_title,
      score: Number(grade),
      feedback: feedback.trim() || null,
      date: new Date().toISOString().split("T")[0],
    });

    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Pendentes de correção
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Apenas atividades aguardando avaliação ficam expostas aqui.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
            {pendingSubmissions.length} pendente(s)
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {pendingSubmissions.length === 0 ? (
            <EmptyMessage text="Nenhuma entrega pendente." />
          ) : (
            pendingSubmissions.map((submission) => (
              <SubmissionCard
                key={submission.id}
                submission={submission}
                editingId={editingId}
                editContent={editContent}
                editGrade={editGrade}
                editFeedback={editFeedback}
                savingId={savingId}
                onEditContent={setEditContent}
                onEditGrade={setEditGrade}
                onEditFeedback={setEditFeedback}
                onStartEditing={startEditing}
                onCancelEditing={cancelEditing}
                onSaveEdit={saveEdit}
                onDelete={deleteSubmission}
                onCorrect={correctSubmission}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
              <History size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Histórico de corrigidas
              </h2>
              <p className="text-sm text-slate-400">
                Pesquise por aluno, atividade ou turma.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowHistory((current) => !current)}
            className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            {showHistory ? "Ocultar histórico" : "Ver histórico"} ·{" "}
            {correctedSubmissions.length}
          </button>
        </div>

        {showHistory && (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2">
              <select
                value={historyClass}
                onChange={(event) => setHistoryClass(event.target.value)}
                className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-emerald-400"
              >
                <option value="">Todas as turmas</option>

                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name}
                  </option>
                ))}
              </select>

              <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 focus-within:border-emerald-400">
                <Search size={17} className="text-slate-500" />
                <input
                  value={historySearch}
                  onChange={(event) => setHistorySearch(event.target.value)}
                  placeholder="Pesquisar aluno ou atividade..."
                  className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="grid gap-3">
              {visibleHistory.length === 0 ? (
                <EmptyMessage text="Nenhuma atividade encontrada no histórico." />
              ) : (
                visibleHistory.map((submission) => (
                  <SubmissionCard
                    key={submission.id}
                    submission={submission}
                    compact
                    editingId={editingId}
                    editContent={editContent}
                    editGrade={editGrade}
                    editFeedback={editFeedback}
                    savingId={savingId}
                    onEditContent={setEditContent}
                    onEditGrade={setEditGrade}
                    onEditFeedback={setEditFeedback}
                    onStartEditing={startEditing}
                    onCancelEditing={cancelEditing}
                    onSaveEdit={saveEdit}
                    onDelete={deleteSubmission}
                    onCorrect={correctSubmission}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function SubmissionCard({
  submission,
  compact = false,
  editingId,
  editContent,
  editGrade,
  editFeedback,
  savingId,
  onEditContent,
  onEditGrade,
  onEditFeedback,
  onStartEditing,
  onCancelEditing,
  onSaveEdit,
  onDelete,
  onCorrect,
}: {
  submission: Submission;
  compact?: boolean;
  editingId: string | null;
  editContent: string;
  editGrade: string;
  editFeedback: string;
  savingId: string | null;
  onEditContent: (value: string) => void;
  onEditGrade: (value: string) => void;
  onEditFeedback: (value: string) => void;
  onStartEditing: (submission: Submission) => void;
  onCancelEditing: () => void;
  onSaveEdit: (submissionId: string) => void;
  onDelete: (submissionId: string) => void;
  onCorrect: (submission: Submission, grade: string, feedback: string) => void;
}) {
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  const isEditing = editingId === submission.id;
  const isCorrected = submission.status === "Corrigida";

  return (
    <div
      className={`rounded-3xl border border-slate-800 bg-slate-900/40 transition hover:border-violet-500/30 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge icon={<UserRound size={14} />} text={submission.student_name} />
        <Badge icon={<BookOpen size={14} />} text={submission.activity_title} />
        <Badge
          icon={isCorrected ? <CheckCircle size={14} /> : <Clock3 size={14} />}
          text={submission.status || "Pendente"}
        />
      </div>

      {isEditing ? (
        <div className="mt-4 grid gap-3">
          <textarea
            value={editContent}
            onChange={(event) => onEditContent(event.target.value)}
            placeholder="Conteúdo da entrega..."
            rows={2}
            className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400"
          />

          <div className="grid gap-3 md:grid-cols-[120px_1fr_auto_auto]">
            <input
              type="number"
              min="0"
              max="10"
              step="0.1"
              value={editGrade}
              onChange={(event) => onEditGrade(event.target.value)}
              placeholder="Nota"
              className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
            />

            <input
              value={editFeedback}
              onChange={(event) => onEditFeedback(event.target.value)}
              placeholder="Feedback..."
              className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
            />

            <button
              onClick={() => onSaveEdit(submission.id)}
              disabled={savingId === submission.id}
              className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              <Save size={15} />
              {savingId === submission.id ? "Salvando..." : "Salvar"}
            </button>

            <button
              onClick={onCancelEditing}
              className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <X size={15} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
            <p className="text-sm leading-6 text-slate-300">
              {submission.content || "Sem conteúdo enviado."}
            </p>
          </div>

          {isCorrected && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <div className="rounded-xl bg-emerald-500/10 px-3 py-2 font-medium text-emerald-300">
                Nota: {submission.grade ?? "-"}
              </div>

              {submission.feedback && (
                <div className="rounded-xl bg-slate-800 px-3 py-2 text-slate-300">
                  {submission.feedback}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={() => onStartEditing(submission)}
              className="flex items-center gap-2 rounded-xl border border-violet-500/20 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-300 transition hover:bg-violet-500/20"
            >
              <Edit3 size={15} />
              Editar
            </button>

            <button
              onClick={() => onDelete(submission.id)}
              className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
            >
              <Trash2 size={15} />
              Excluir
            </button>
          </div>

          {!isCorrected && (
            <div className="mt-4 grid gap-3 lg:grid-cols-[120px_1fr_auto]">
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                placeholder="Nota"
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
                className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
              />

              <textarea
                placeholder="Feedback pedagógico..."
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                rows={2}
                className="min-h-11 resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
              />

              <button
                onClick={() => onCorrect(submission, grade, feedback)}
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                <CheckCircle size={16} />
                Salvar
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Badge({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-xs text-slate-300">
      <span className="text-violet-400">{icon}</span>
      {text}
    </div>
  );
}

function EmptyMessage({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
      {text}
    </div>
  );
}