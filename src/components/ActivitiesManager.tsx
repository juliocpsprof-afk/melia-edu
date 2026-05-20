"use client";

import { ReactNode, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Edit3,
  GraduationCap,
  History,
  Save,
  Trash2,
  Trophy,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type Activity = {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  class_id: string | null;
  class_name: string;
  archived: boolean;
};

type Student = {
  id: string;
  name: string;
  class_id: string | null;
};

type Submission = {
  id: string;
  activity_id: string;
  student_id: string;
  grade: number | null;
  status: string | null;
  student_name: string;
};

export function ActivitiesManager({
  activities,
  classes,
  students,
  submissions,
}: {
  activities: Activity[];
  classes: ClassItem[];
  students: Student[];
  submissions: Submission[];
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [editClassId, setEditClassId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const activeActivities = activities.filter((activity) => !activity.archived);
  const archivedActivities = activities.filter((activity) => activity.archived);

  function getShortName(name: string) {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length <= 2) return parts.join(" ");
    return `${parts[0]} ${parts[1]}`;
  }

  function getStats(activity: Activity) {
    const classStudents = students.filter(
      (student) => student.class_id === activity.class_id
    );

    const activitySubmissions = submissions.filter(
      (submission) => submission.activity_id === activity.id
    );

    const gradedSubmissions = activitySubmissions.filter(
      (submission) => typeof submission.grade === "number"
    );

    const average =
      gradedSubmissions.length > 0
        ? gradedSubmissions.reduce(
            (total, submission) => total + Number(submission.grade),
            0
          ) / gradedSubmissions.length
        : null;

    const sortedByGrade = [...gradedSubmissions].sort(
      (a, b) => Number(b.grade) - Number(a.grade)
    );

    return {
      totalStudents: classStudents.length,
      delivered: activitySubmissions.length,
      average,
      highest:
        sortedByGrade.length > 0
          ? `${Number(sortedByGrade[0].grade).toFixed(1)} · ${getShortName(
              sortedByGrade[0].student_name
            )}`
          : "-",
      lowest:
        sortedByGrade.length > 0
          ? `${Number(sortedByGrade[sortedByGrade.length - 1].grade).toFixed(
              1
            )} · ${getShortName(
              sortedByGrade[sortedByGrade.length - 1].student_name
            )}`
          : "-",
    };
  }

  function startEditing(activity: Activity) {
    setEditingId(activity.id);
    setEditClassId(activity.class_id || "");
    setEditTitle(activity.title);
    setEditDescription(activity.description || "");
    setEditDueDate(activity.due_date);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditClassId("");
    setEditTitle("");
    setEditDescription("");
    setEditDueDate("");
  }

  async function saveActivity(activityId: string) {
    if (!editClassId || !editTitle.trim() || !editDueDate) {
      alert("Preencha turma, título e data de entrega.");
      return;
    }

    setSavingId(activityId);

    const { error } = await supabase
      .from("activities")
      .update({
        class_id: editClassId,
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        due_date: editDueDate,
      })
      .eq("id", activityId);

    setSavingId(null);

    if (error) {
      alert("Erro ao editar atividade.");
      return;
    }

    window.location.reload();
  }

  async function deleteActivity(activityId: string) {
    const confirmed = confirm("Deseja excluir esta atividade?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("activities")
      .delete()
      .eq("id", activityId);

    if (error) {
      alert("Erro ao excluir atividade.");
      return;
    }

    window.location.reload();
  }

  async function archiveActivity(activityId: string) {
    const { error } = await supabase
      .from("activities")
      .update({ archived: true })
      .eq("id", activityId);

    if (error) {
      alert("Erro ao arquivar atividade.");
      return;
    }

    window.location.reload();
  }

  async function restoreActivity(activityId: string) {
    const { error } = await supabase
      .from("activities")
      .update({ archived: false })
      .eq("id", activityId);

    if (error) {
      alert("Erro ao restaurar atividade.");
      return;
    }

    window.location.reload();
  }

  return (
    <div className="mt-8 space-y-8">
      <section>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Atividades ativas
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Atividades ainda em andamento.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
            {activeActivities.length} atividade(s)
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {activeActivities.length === 0 ? (
            <Empty text="Nenhuma atividade ativa." />
          ) : (
            activeActivities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                classes={classes}
                stats={getStats(activity)}
                isArchived={false}
                isEditing={editingId === activity.id}
                editClassId={editClassId}
                editTitle={editTitle}
                editDescription={editDescription}
                editDueDate={editDueDate}
                savingId={savingId}
                onStartEditing={startEditing}
                onCancelEditing={cancelEditing}
                onSave={saveActivity}
                onDelete={deleteActivity}
                onArchive={archiveActivity}
                onRestore={restoreActivity}
                setEditClassId={setEditClassId}
                setEditTitle={setEditTitle}
                setEditDescription={setEditDescription}
                setEditDueDate={setEditDueDate}
              />
            ))
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-300">
              <History size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Histórico de arquivadas
              </h2>
              <p className="text-sm text-slate-400">
                Edite, exclua ou restaure atividades arquivadas.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowArchived((current) => !current)}
            className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
          >
            {showArchived ? "Ocultar histórico" : "Ver histórico"} ·{" "}
            {archivedActivities.length}
          </button>
        </div>

        {showArchived && (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {archivedActivities.length === 0 ? (
              <Empty text="Nenhuma atividade arquivada." />
            ) : (
              archivedActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  classes={classes}
                  stats={getStats(activity)}
                  isArchived
                  isEditing={editingId === activity.id}
                  editClassId={editClassId}
                  editTitle={editTitle}
                  editDescription={editDescription}
                  editDueDate={editDueDate}
                  savingId={savingId}
                  onStartEditing={startEditing}
                  onCancelEditing={cancelEditing}
                  onSave={saveActivity}
                  onDelete={deleteActivity}
                  onArchive={archiveActivity}
                  onRestore={restoreActivity}
                  setEditClassId={setEditClassId}
                  setEditTitle={setEditTitle}
                  setEditDescription={setEditDescription}
                  setEditDueDate={setEditDueDate}
                />
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function ActivityCard({
  activity,
  classes,
  stats,
  isArchived,
  isEditing,
  editClassId,
  editTitle,
  editDescription,
  editDueDate,
  savingId,
  onStartEditing,
  onCancelEditing,
  onSave,
  onDelete,
  onArchive,
  onRestore,
  setEditClassId,
  setEditTitle,
  setEditDescription,
  setEditDueDate,
}: {
  activity: Activity;
  classes: ClassItem[];
  stats: {
    totalStudents: number;
    delivered: number;
    average: number | null;
    highest: string;
    lowest: string;
  };
  isArchived: boolean;
  isEditing: boolean;
  editClassId: string;
  editTitle: string;
  editDescription: string;
  editDueDate: string;
  savingId: string | null;
  onStartEditing: (activity: Activity) => void;
  onCancelEditing: () => void;
  onSave: (activityId: string) => void;
  onDelete: (activityId: string) => void;
  onArchive: (activityId: string) => void;
  onRestore: (activityId: string) => void;
  setEditClassId: (value: string) => void;
  setEditTitle: (value: string) => void;
  setEditDescription: (value: string) => void;
  setEditDueDate: (value: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-violet-500/40">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
          <GraduationCap size={28} />
        </div>

        <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
          {activity.class_name}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <ActionButton
          icon={<Edit3 size={14} />}
          text="Editar"
          onClick={() => onStartEditing(activity)}
        />

        <ActionButton
          icon={<Trash2 size={14} />}
          text="Excluir"
          danger
          onClick={() => onDelete(activity.id)}
        />

        {isArchived ? (
          <ActionButton
            icon={<ArchiveRestore size={14} />}
            text="Restaurar"
            onClick={() => onRestore(activity.id)}
          />
        ) : (
          <ActionButton
            icon={<Archive size={14} />}
            text="Arquivar"
            onClick={() => onArchive(activity.id)}
          />
        )}
      </div>

      {isEditing ? (
        <div className="mt-4 grid gap-3">
          <select
            value={editClassId}
            onChange={(event) => setEditClassId(event.target.value)}
            className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
          >
            <option value="">Selecione a turma</option>

            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <input
            value={editTitle}
            onChange={(event) => setEditTitle(event.target.value)}
            placeholder="Título"
            className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
          />

          <input
            type="date"
            value={editDueDate}
            onChange={(event) => setEditDueDate(event.target.value)}
            className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400"
          />

          <textarea
            value={editDescription}
            onChange={(event) => setEditDescription(event.target.value)}
            rows={2}
            placeholder="Descrição"
            className="resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-violet-400"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => onSave(activity.id)}
              disabled={savingId === activity.id}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-violet-500 px-3 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              <Save size={15} />
              {savingId === activity.id ? "Salvando..." : "Salvar"}
            </button>

            <button
              onClick={onCancelEditing}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 px-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <X size={15} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          <h2 className="mt-4 text-xl font-bold text-white">{activity.title}</h2>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-400">
            {activity.description || "Sem descrição."}
          </p>

          <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
            <CalendarDays size={17} className="text-violet-400" />
            Entrega: {new Date(activity.due_date).toLocaleDateString("pt-BR")}
          </div>

          <div className="mt-4 space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <CompactStat
                icon={<Users size={14} />}
                label="Alunos"
                value={String(stats.totalStudents)}
              />

              <CompactStat
                icon={<CheckCircle size={14} />}
                label="Entregaram"
                value={String(stats.delivered)}
              />

              <CompactStat
                icon={<BookOpen size={14} />}
                label="Média"
                value={stats.average === null ? "-" : stats.average.toFixed(1)}
              />
            </div>

            <MiniStat
              icon={<Trophy size={15} />}
              label="Maior nota"
              value={stats.highest}
            />

            <MiniStat
              icon={<Trophy size={15} />}
              label="Menor nota"
              value={stats.lowest}
            />
          </div>
        </>
      )}
    </div>
  );
}

function CompactStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2">
      <div className="flex items-center gap-1 text-[11px] text-slate-400">
        <span className="text-violet-400">{icon}</span>
        {label}
      </div>

      <div className="mt-1 text-lg font-bold text-white">{value}</div>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm">
      <div className="flex items-center gap-2 text-slate-400">
        <span className="text-violet-400">{icon}</span>
        {label}
      </div>

      <span className="max-w-[180px] truncate text-right font-semibold text-slate-200">
        {value}
      </span>
    </div>
  );
}

function ActionButton({
  icon,
  text,
  onClick,
  danger = false,
}: {
  icon: ReactNode;
  text: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
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

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
      {text}
    </div>
  );
}