"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Clipboard,
  Edit3,
  Eye,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type AttendanceItem = {
  id: string;
  date: string;
  status: string;
  arrival_time: string | null;
  notes: string | null;
  students: {
    name: string;
  } | null;
  classes: {
    name: string;
  } | null;
  lesson_diary: {
    content: string;
  } | null;
};

type EditRecord = {
  status: string;
  arrival_time: string;
  notes: string;
};

export function AttendanceHistoryFilter({
  attendance,
}: {
  attendance: AttendanceItem[];
}) {
  const [search, setSearch] = useState("");
  const [openGroup, setOpenGroup] = useState("");
  const [editingGroup, setEditingGroup] = useState("");
  const [editRecords, setEditRecords] = useState<Record<string, EditRecord>>(
    {}
  );

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const filteredAttendance = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) return attendance;

    return attendance.filter((item) => {
      const text = normalizeText(`
        ${item.students?.name || ""}
        ${item.classes?.name || ""}
        ${item.lesson_diary?.content || ""}
        ${item.status || ""}
        ${item.notes || ""}
      `);

      return text.includes(normalizedSearch);
    });
  }, [attendance, search]);

  const groups = useMemo(() => {
    const grouped = new Map<string, AttendanceItem[]>();

    filteredAttendance.forEach((item) => {
      const key = `${item.date}-${item.classes?.name || "Turma"}-${
        item.lesson_diary?.content || "Aula"
      }`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)?.push(item);
    });

    return Array.from(grouped.entries()).map(([key, items]) => ({
      key,
      items,
      date: items[0]?.date,
      className: items[0]?.classes?.name || "Turma",
      content: items[0]?.lesson_diary?.content || "Aula sem conteúdo",
      present: items.filter((item) => item.status === "Presente").length,
      absences: items.filter((item) => item.status === "Falta").length,
      delays: items.filter((item) => item.status === "Atraso").length,
    }));
  }, [filteredAttendance]);

  function copyGroupReport(items: AttendanceItem[]) {
    const first = items[0];

    const report = [
      `📚 ${first?.classes?.name || "Turma"}`,
      `📅 ${new Date(first?.date || "").toLocaleDateString("pt-BR")}`,
      `📖 ${first?.lesson_diary?.content || "Aula sem conteúdo"}`,
      "",
      ...items.map((item) => {
        const icon =
          item.status === "Presente"
            ? "✅"
            : item.status === "Atraso"
            ? "⚠️"
            : "❌";

        const time =
          item.status === "Atraso" && item.arrival_time
            ? ` (${item.arrival_time})`
            : "";

        const notes = item.notes ? ` — ${item.notes}` : "";

        return `${icon} ${item.students?.name || "Aluno"} — ${
          item.status
        }${time}${notes}`;
      }),
    ].join("\n");

    navigator.clipboard.writeText(report);
    toast.success("Relatório copiado!");
  }

  function startEditGroup(groupKey: string, items: AttendanceItem[]) {
    const records: Record<string, EditRecord> = {};

    items.forEach((item) => {
      records[item.id] = {
        status: item.status,
        arrival_time: item.arrival_time || "",
        notes: item.notes || "",
      };
    });

    setEditingGroup(groupKey);
    setOpenGroup(groupKey);
    setEditRecords(records);
  }

  function cancelEdit() {
    setEditingGroup("");
    setEditRecords({});
  }

  function updateEditRecord(
    attendanceId: string,
    field: keyof EditRecord,
    value: string
  ) {
    setEditRecords((current) => ({
      ...current,
      [attendanceId]: {
        ...current[attendanceId],
        [field]: value,
      },
    }));
  }

  async function saveEditGroup(items: AttendanceItem[]) {
    const updates = items.map((item) => {
      const record = editRecords[item.id];

      return supabase
        .from("attendance")
        .update({
          status: record.status,
          arrival_time: record.status === "Atraso" ? record.arrival_time : null,
          notes: record.notes.trim() || null,
        })
        .eq("id", item.id);
    });

    const results = await Promise.all(updates);
    const hasError = results.some((result) => result.error);

    if (hasError) {
      toast.error("Erro ao editar chamada.");
      return;
    }

    toast.success("Chamada editada com sucesso!");
    window.location.reload();
  }

  async function deleteWholeCall(items: AttendanceItem[]) {
    const confirmed = confirm("Deseja excluir esta chamada inteira?");

    if (!confirmed) return;

    const ids = items.map((item) => item.id);

    const { error } = await supabase.from("attendance").delete().in("id", ids);

    if (error) {
      toast.error("Erro ao excluir chamada.");
      return;
    }

    toast.success("Chamada excluída!");
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
          <Search size={18} className="text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por aluno, turma, aula, status ou observação..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="space-y-4">
        {groups.length === 0 ? (
          <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
            Nenhuma chamada encontrada.
          </div>
        ) : (
          groups.map((group) => {
            const isOpen = openGroup === group.key;
            const isEditing = editingGroup === group.key;

            return (
              <div
                key={group.key}
                className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {group.className}
                    </h2>

                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(group.date).toLocaleDateString("pt-BR")} ·{" "}
                      {group.content}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 xl:grid-cols-4">
                  <button
                    onClick={() => setOpenGroup(isOpen ? "" : group.key)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400"
                  >
                    <Eye size={16} />
                    Ver detalhes
                  </button>

                  <button
                    onClick={() => copyGroupReport(group.items)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    <Clipboard size={16} />
                    Copiar relatório
                  </button>

                  <button
                    onClick={() => startEditGroup(group.key, group.items)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-yellow-500 text-sm font-semibold text-black transition hover:bg-yellow-400"
                  >
                    <Edit3 size={16} />
                    Editar chamada
                  </button>

                  <button
                    onClick={() => deleteWholeCall(group.items)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 text-sm font-semibold text-white transition hover:bg-red-400"
                  >
                    <Trash2 size={16} />
                    Excluir chamada
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <StatusSummaryCard
                    title="Presentes"
                    value={group.present}
                    className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                  />

                  <StatusSummaryCard
                    title="Faltas"
                    value={group.absences}
                    className="border-red-500/20 bg-red-500/10 text-red-300"
                  />

                  <StatusSummaryCard
                    title="Atrasos"
                    value={group.delays}
                    className="border-yellow-500/20 bg-yellow-500/10 text-yellow-300"
                  />
                </div>

                {isOpen && (
                  <div className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
                    {group.items.map((item) => {
                      const editRecord = editRecords[item.id];

                      return (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3"
                        >
                          {isEditing ? (
                            <div className="grid gap-3 lg:grid-cols-[1fr_140px_120px_1fr] lg:items-center">
                              <div>
                                <p className="font-semibold text-white">
                                  {item.students?.name || "Aluno"}
                                </p>
                              </div>

                              <select
                                value={editRecord?.status || item.status}
                                onChange={(event) =>
                                  updateEditRecord(
                                    item.id,
                                    "status",
                                    event.target.value
                                  )
                                }
                                className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
                              >
                                <option value="Presente">Presente</option>
                                <option value="Falta">Falta</option>
                                <option value="Atraso">Atraso</option>
                              </select>

                              <input
                                type="time"
                                value={editRecord?.arrival_time || ""}
                                disabled={
                                  (editRecord?.status || item.status) !==
                                  "Atraso"
                                }
                                onChange={(event) =>
                                  updateEditRecord(
                                    item.id,
                                    "arrival_time",
                                    event.target.value
                                  )
                                }
                                className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400 disabled:opacity-40"
                              />

                              <input
                                value={editRecord?.notes || ""}
                                onChange={(event) =>
                                  updateEditRecord(
                                    item.id,
                                    "notes",
                                    event.target.value
                                  )
                                }
                                placeholder="Observação..."
                                className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                              <div>
                                <p className="font-semibold text-white">
                                  {item.students?.name || "Aluno"}
                                </p>

                                <p className="text-sm text-slate-400">
                                  {item.status}
                                  {item.status === "Atraso" &&
                                  item.arrival_time
                                    ? ` · ${item.arrival_time}`
                                    : ""}
                                </p>
                              </div>

                              {item.notes && (
                                <p className="text-sm text-slate-400">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {isEditing && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => saveEditGroup(group.items)}
                          className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          <Save size={16} />
                          Salvar edição
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
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

function StatusSummaryCard({
  title,
  value,
  className,
}: {
  title: string;
  value: number;
  className: string;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}