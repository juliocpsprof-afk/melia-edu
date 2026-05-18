"use client";

import { useMemo, useState } from "react";
import {
  Clipboard,
  Edit3,
  Eye,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { supabase } from "../lib/supabase";

type AttendanceItem = {
  id: string;
  date: string;
  status: string;
  arrival_time: string | null;
  notes: string | null;
  students: { name: string } | null;
  classes: { name: string } | null;
  lesson_diary: { content: string } | null;
};

type AttendanceStatus = "Presente" | "Falta" | "Atraso";

type EditRecord = {
  status: AttendanceStatus;
  arrival_time: string;
  notes: string;
};

export function AttendanceHistoryFilter({
  attendance,
}: {
  attendance: AttendanceItem[];
}) {
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  const [openGroup, setOpenGroup] = useState("");
  const [editingGroup, setEditingGroup] = useState("");
  const [editRecords, setEditRecords] = useState<Record<string, EditRecord>>({});

  const classes = Array.from(
    new Set(attendance.map((item) => item.classes?.name).filter(Boolean))
  );

  const filteredAttendance = attendance.filter((item) => {
    const matchesClass = classFilter ? item.classes?.name === classFilter : true;
    const matchesDate = dateFilter ? item.date === dateFilter : true;

    const text = `${item.students?.name ?? ""} ${item.lesson_diary?.content ?? ""}`.toLowerCase();

    const matchesSearch = search ? text.includes(search.toLowerCase()) : true;

    return matchesClass && matchesDate && matchesSearch;
  });

  const groupedCalls = useMemo(() => {
    const groups: Record<string, AttendanceItem[]> = {};

    filteredAttendance.forEach((item) => {
      const key = `${item.date}-${item.classes?.name}-${item.lesson_diary?.content}`;

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(item);
    });

    return Object.entries(groups).map(([key, items]) => ({
      key,
      date: items[0].date,
      className: items[0].classes?.name ?? "Sem turma",
      lessonContent: items[0].lesson_diary?.content ?? "Sem conteúdo vinculado",
      items,
    }));
  }, [filteredAttendance]);

  function startEditGroup(groupKey: string, items: AttendanceItem[]) {
    const initialRecords: Record<string, EditRecord> = {};

    items.forEach((item) => {
      initialRecords[item.id] = {
        status: item.status as AttendanceStatus,
        arrival_time: item.arrival_time ?? "",
        notes: item.notes ?? "",
      };
    });

    setEditingGroup(groupKey);
    setOpenGroup(groupKey);
    setEditRecords(initialRecords);
  }

  function cancelEditGroup() {
    setEditingGroup("");
    setEditRecords({});
  }

  function updateEditRecord(
    id: string,
    field: keyof EditRecord,
    value: string
  ) {
    setEditRecords((current) => ({
      ...current,
      [id]: {
        ...current[id],
        [field]: value,
      },
    }));
  }

  async function saveOneRecord(id: string) {
    const record = editRecords[id];

    if (!record) return;

    const { error } = await supabase
      .from("attendance")
      .update({
        status: record.status,
        arrival_time: record.status === "Atraso" ? record.arrival_time : "",
        notes: record.notes,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao salvar registro.");
      console.error(error);
      return;
    }

    toast.success("Registro atualizado!");
    setTimeout(() => window.location.reload(), 700);
  }

  async function saveWholeCall(items: AttendanceItem[]) {
    const updates = items.map((item) => {
      const record = editRecords[item.id];

      return supabase
        .from("attendance")
        .update({
          status: record?.status ?? item.status,
          arrival_time:
            record?.status === "Atraso" ? record?.arrival_time ?? "" : "",
          notes: record?.notes ?? item.notes ?? "",
        })
        .eq("id", item.id);
    });

    const results = await Promise.all(updates);
    const hasError = results.some((result) => result.error);

    if (hasError) {
      toast.error("Erro ao salvar chamada completa.");
      console.error(results);
      return;
    }

    toast.success("Chamada completa atualizada!");
    setTimeout(() => window.location.reload(), 700);
  }

  async function deleteOneRecord(id: string) {
    const confirmed = confirm("Deseja excluir este registro de chamada?");

    if (!confirmed) return;

    const { error } = await supabase.from("attendance").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir registro.");
      console.error(error);
      return;
    }

    toast.success("Registro excluído!");
    setTimeout(() => window.location.reload(), 700);
  }

  async function deleteWholeCall(items: AttendanceItem[]) {
    const confirmed = confirm(
      "Deseja excluir a chamada inteira? Isso apagará todos os registros desta aula."
    );

    if (!confirmed) return;

    const ids = items.map((item) => item.id);

    const { error } = await supabase.from("attendance").delete().in("id", ids);

    if (error) {
      toast.error("Erro ao excluir chamada.");
      console.error(error);
      return;
    }

    toast.success("Chamada inteira excluída!");
    setTimeout(() => window.location.reload(), 700);
  }

  async function copyReport(group: {
    date: string;
    className: string;
    lessonContent: string;
    items: AttendanceItem[];
  }) {
    const formattedDate = new Date(group.date).toLocaleDateString("pt-BR");

    const lines = group.items.map((item) => {
      const record = editRecords[item.id];

      const status = record?.status ?? item.status;
      const arrivalTime = record?.arrival_time ?? item.arrival_time;
      const notes = record?.notes ?? item.notes;

      const icon =
        status === "Presente" ? "✅" : status === "Atraso" ? "⚠️" : "❌";

      const time =
        status === "Atraso" && arrivalTime ? ` (${arrivalTime})` : "";

      const note = notes ? ` — Obs.: ${notes}` : "";

      return `${icon} ${item.students?.name ?? "Aluno"} — ${status}${time}${note}`;
    });

    const report = `📚 Chamada - ${group.className}
📅 ${formattedDate}
📖 Aula: ${group.lessonContent}

${lines.join("\n")}`;

    await navigator.clipboard.writeText(report);
    toast.success("Relatório copiado!");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Filtrar chamadas</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          >
            <option value="">Todas as turmas</option>

            {classes.map((className) => (
              <option key={className} value={className ?? ""}>
                {className}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />

          <div className="flex items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
            <Search size={18} className="text-slate-400" />

            <input
              placeholder="Buscar aluno ou aula..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <p className="mt-4 text-sm text-slate-400">
          {groupedCalls.length} chamada(s) encontrada(s).
        </p>
      </div>

      <div className="space-y-4">
        {groupedCalls.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
            Nenhuma chamada encontrada.
          </div>
        ) : (
          groupedCalls.map((group) => {
            const presentes = group.items.filter(
              (item) => item.status === "Presente"
            ).length;

            const faltas = group.items.filter(
              (item) => item.status === "Falta"
            ).length;

            const atrasos = group.items.filter(
              (item) => item.status === "Atraso"
            ).length;

            const isOpen = openGroup === group.key;
            const isEditingGroup = editingGroup === group.key;

            return (
              <div
                key={group.key}
                className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
              >
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="text-xl font-bold">
                      Chamada — {group.className}
                    </h3>

                    <p className="mt-2 text-slate-400">
                      {new Date(group.date).toLocaleDateString("pt-BR")} •{" "}
                      {group.lessonContent}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <Badge text={`✅ Presentes: ${presentes}`} />
                      <Badge text={`❌ Faltas: ${faltas}`} />
                      <Badge text={`⚠️ Atrasos: ${atrasos}`} />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setOpenGroup(isOpen ? "" : group.key)}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-white/5"
                    >
                      <Eye size={16} />
                      {isOpen ? "Ocultar" : "Ver detalhes"}
                    </button>

                    <button
                      onClick={() => copyReport(group)}
                      className="flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-2 font-medium text-white transition hover:bg-violet-400"
                    >
                      <Clipboard size={16} />
                      Copiar relatório
                    </button>

                    {isEditingGroup ? (
                      <>
                        <button
                          onClick={() => saveWholeCall(group.items)}
                          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-emerald-300 transition hover:bg-emerald-500/20"
                        >
                          <Save size={16} />
                          Salvar chamada
                        </button>

                        <button
                          onClick={cancelEditGroup}
                          className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-white/5"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEditGroup(group.key, group.items)}
                          className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300 transition hover:bg-white/5"
                        >
                          <Edit3 size={16} />
                          Editar chamada
                        </button>

                        <button
                          onClick={() => deleteWholeCall(group.items)}
                          className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-red-300 transition hover:bg-red-500/20"
                        >
                          <Trash2 size={16} />
                          Excluir chamada
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-6 space-y-3">
                    {group.items.map((item) => {
                      const isEditing = isEditingGroup;
                      const record = editRecords[item.id] ?? {
                        status: item.status as AttendanceStatus,
                        arrival_time: item.arrival_time ?? "",
                        notes: item.notes ?? "",
                      };

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                        >
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="font-semibold">
                                {item.students?.name ?? "Aluno"}
                              </p>

                              {!isEditing && (
                                <p className="text-sm text-slate-400">
                                  {item.status}
                                  {item.arrival_time
                                    ? ` • Chegada: ${item.arrival_time}`
                                    : ""}
                                </p>
                              )}
                            </div>

                            {!isEditing && <StatusBadge status={item.status} />}
                          </div>

                          {isEditing ? (
                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                              <select
                                value={record.status}
                                onChange={(event) =>
                                  updateEditRecord(
                                    item.id,
                                    "status",
                                    event.target.value as AttendanceStatus
                                  )
                                }
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                              >
                                <option value="Presente">Presente</option>
                                <option value="Falta">Falta</option>
                                <option value="Atraso">Atraso</option>
                              </select>

                              <input
                                type="time"
                                value={record.arrival_time}
                                disabled={record.status !== "Atraso"}
                                onChange={(event) =>
                                  updateEditRecord(
                                    item.id,
                                    "arrival_time",
                                    event.target.value
                                  )
                                }
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 disabled:opacity-40"
                              />

                              <input
                                placeholder="Observação"
                                value={record.notes}
                                onChange={(event) =>
                                  updateEditRecord(
                                    item.id,
                                    "notes",
                                    event.target.value
                                  )
                                }
                                className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                              />

                              <div className="flex flex-wrap gap-3 md:col-span-3">
                                <button
                                  onClick={() => saveOneRecord(item.id)}
                                  className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-emerald-300 transition hover:bg-emerald-500/20"
                                >
                                  <Save size={16} />
                                  Salvar este aluno
                                </button>

                                <button
                                  onClick={() => deleteOneRecord(item.id)}
                                  className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-red-300 transition hover:bg-red-500/20"
                                >
                                  <Trash2 size={16} />
                                  Excluir este aluno
                                </button>
                              </div>
                            </div>
                          ) : (
                            item.notes && (
                              <p className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/10 p-3 text-sm text-violet-200">
                                Obs.: {item.notes}
                              </p>
                            )
                          )}
                        </div>
                      );
                    })}
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

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-slate-300">
      {text}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Presente"
      ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
      : status === "Falta"
        ? "bg-red-500/10 text-red-300 border-red-500/20"
        : "bg-amber-500/10 text-amber-300 border-amber-500/20";

  return (
    <span className={`rounded-full border px-3 py-1 text-sm ${styles}`}>
      {status}
    </span>
  );
}