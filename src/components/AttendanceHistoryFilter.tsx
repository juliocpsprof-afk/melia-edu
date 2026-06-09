"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  ChevronDown,
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
  lesson_id: string | null;
  created_at: string | null;
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

const motivationalMessages = [
  "Cada presença é um passo a mais rumo ao seu primeiro grande resultado profissional.",
  "Disciplina hoje, oportunidade amanhã.",
  "Quem se prepara melhor chega mais confiante ao mercado de trabalho.",
  "Aprender é construir o futuro com as próprias mãos.",
  "A constância vence o talento quando o talento não é constante.",
  "Seu esforço de hoje pode abrir portas que você ainda nem imagina.",
  "Pontualidade, presença e atitude também são competências profissionais.",
  "Quem se compromete cedo chega mais longe.",
  "O jovem aprendiz que se dedica hoje se destaca amanhã.",
  "Não é só uma aula: é treino para a vida profissional.",
  "A melhor vaga começa com a melhor preparação.",
  "Responsabilidade é uma habilidade que o mercado valoriza muito.",
  "Você não precisa ser perfeito; precisa continuar evoluindo.",
  "Cada aula fortalece sua postura para o mundo do trabalho.",
  "O futuro profissional é construído nas pequenas escolhas diárias.",
  "Quem participa mais, aprende mais. Quem aprende mais, cresce mais.",
  "A oportunidade costuma encontrar quem está preparado.",
  "Estudar também é investir em liberdade de escolha.",
  "Seu comportamento em sala também comunica quem você será no trabalho.",
  "Foco, respeito e compromisso abrem caminhos.",
  "O mercado procura pessoas que aprendem, colaboram e persistem.",
  "Hoje você treina. Amanhã você entrega resultado.",
  "Pequenas melhorias todos os dias criam grandes mudanças.",
  "A presença mostra compromisso; a participação mostra atitude.",
  "Quem cuida do próprio aprendizado aumenta suas chances.",
  "A caminhada profissional começa antes do primeiro emprego.",
  "A melhor versão de você está sendo construída aos poucos.",
  "Não subestime uma aula: ela pode mudar uma decisão no futuro.",
  "Preparação é o que transforma chance em conquista.",
  "Você está aprendendo mais do que conteúdo: está treinando postura profissional.",
  "O hábito de cumprir compromissos vale muito no mercado.",
  "Persistir também é uma competência.",
  "A evolução aparece para quem continua tentando.",
  "Aprender hoje é ganhar voz, escolha e oportunidade amanhã.",
  "Quem leva a formação a sério chega mais forte à entrevista.",
  "Seu futuro agradece a dedicação que você escolhe hoje.",
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getShortStudentName(name: string) {
  const ignoredParticles = ["da", "de", "do", "das", "dos", "e"];

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !ignoredParticles.includes(part.toLowerCase()));

  if (parts.length <= 3) {
    return parts.join(" ");
  }

  return parts.slice(0, 3).join(" ");
}

function getMotivationalMessage(seed: string) {
  const normalizedSeed = normalizeText(seed);

  const hash = normalizedSeed.split("").reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);

  return motivationalMessages[hash % motivationalMessages.length];
}

function formatDate(date: string) {
  if (!date) {
    return "Sem data";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Sem data";
  }

  return parsedDate.toLocaleDateString("pt-BR");
}

function formatTime(value: string | null | undefined) {
  if (!value) {
    return "Sem horário";
  }

  const parsedDate = new Date(value);

  if (!Number.isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const timeMatch = value.match(/\d{2}:\d{2}/);

  return timeMatch?.[0] ?? "Sem horário";
}

function getStatusIcon(status: string) {
  if (status === "Presente") {
    return "✅";
  }

  if (status === "Atraso") {
    return "⚠️";
  }

  return "❌";
}

export function AttendanceHistoryFilter({
  attendance,
}: {
  attendance: AttendanceItem[];
}) {
  const [search, setSearch] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [openGroup, setOpenGroup] = useState("");
  const [editingGroup, setEditingGroup] = useState("");
  const [editRecords, setEditRecords] = useState<Record<string, EditRecord>>(
    {}
  );

  const classOptions = useMemo(() => {
    const classNames = attendance
      .map((item) => item.classes?.name || "Turma")
      .filter(Boolean);

    return Array.from(new Set(classNames)).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [attendance]);

  const filteredAttendance = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return attendance.filter((item) => {
      const className = item.classes?.name || "Turma";

      if (selectedClassName && className !== selectedClassName) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const text = normalizeText(`
        ${item.students?.name || ""}
        ${className}
        ${item.lesson_diary?.content || ""}
        ${item.status || ""}
        ${item.notes || ""}
        ${formatDate(item.date)}
        ${formatTime(item.created_at)}
      `);

      return text.includes(normalizedSearch);
    });
  }, [attendance, search, selectedClassName]);

  const groups = useMemo(() => {
    const grouped = new Map<string, AttendanceItem[]>();

    filteredAttendance.forEach((item) => {
      const key = `${item.date}-${item.lesson_id || "sem-aula"}-${
        item.classes?.name || "Turma"
      }-${item.lesson_diary?.content || "Aula"}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }

      grouped.get(key)?.push(item);
    });

    return Array.from(grouped.entries())
      .map(([key, items]) => {
        const first = items[0];

        return {
          key,
          items,
          date: first?.date || "",
          createdAt: first?.created_at || null,
          className: first?.classes?.name || "Turma",
          content: first?.lesson_diary?.content || "Aula sem conteúdo",
          present: items.filter((item) => item.status === "Presente").length,
          absences: items.filter((item) => item.status === "Falta").length,
          delays: items.filter((item) => item.status === "Atraso").length,
        };
      })
      .sort((a, b) => {
        const dateCompare = String(b.date).localeCompare(String(a.date));

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
  }, [filteredAttendance]);

  function copyGroupReport(items: AttendanceItem[]) {
    const first = items[0];

    if (!first) {
      toast.error("Nenhum item encontrado para copiar.");
      return;
    }

    const className = first.classes?.name || "Turma";
    const date = formatDate(first.date);
    const time = formatTime(first.created_at);
    const content = first.lesson_diary?.content || "Aula sem conteúdo";

    const presentItems = items.filter((item) => item.status === "Presente");
    const delayedItems = items.filter((item) => item.status === "Atraso");
    const absentItems = items.filter((item) => item.status === "Falta");

    function buildStudentLine(item: AttendanceItem) {
      const shortName = getShortStudentName(item.students?.name || "Aluno");

      const time =
        item.status === "Atraso" && item.arrival_time
          ? ` (${item.arrival_time})`
          : "";

      const notes = item.notes?.trim()
        ? `\n   _Obs.: ${item.notes.trim()}_`
        : "";

      return `• ${shortName}${time}${notes}`;
    }

    const presentLines =
      presentItems.length > 0
        ? presentItems.map(buildStudentLine).join("\n")
        : "• Nenhum registro";

    const delayedLines =
      delayedItems.length > 0
        ? delayedItems.map(buildStudentLine).join("\n")
        : "• Nenhum atraso";

    const absentLines =
      absentItems.length > 0
        ? absentItems.map(buildStudentLine).join("\n")
        : "• Nenhuma falta";

    const motivationalMessage = getMotivationalMessage(
      `${className}-${first.date}-${content}`
    );

    const report = `📌 *CHAMADA REGISTRADA*

🏫 *Turma:* ${className}
📅 *Data:* ${date}
🕒 *Horário:* ${time}

📚 *Aula / Conteúdo*
${content}

━━━━━━━━━━━━━━

✅ *Presentes (${presentItems.length})*
${presentLines}

⚠️ *Atrasos (${delayedItems.length})*
${delayedLines}

❌ *Faltas (${absentItems.length})*
${absentLines}

━━━━━━━━━━━━━━

📊 *Resumo*
✅ Presentes: ${presentItems.length}
⚠️ Atrasos: ${delayedItems.length}
❌ Faltas: ${absentItems.length}

💬 *Mensagem do dia*
_${motivationalMessage}_`;

    navigator.clipboard.writeText(report);
    toast.success("Relatório copiado para WhatsApp!");
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

  function toggleGroup(groupKey: string) {
    setOpenGroup((current) => (current === groupKey ? "" : groupKey));
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="relative">
            <select
              value={selectedClassName}
              onChange={(event) => {
                setSelectedClassName(event.target.value);
                setOpenGroup("");
                setEditingGroup("");
                setEditRecords({});
              }}
              className="h-12 w-full appearance-none rounded-2xl border border-slate-700 bg-slate-950 px-4 pr-10 text-sm text-white outline-none transition focus:border-blue-400"
            >
              <option value="">Todas as turmas</option>

              {classOptions.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
          </div>

          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
            <Search size={18} className="text-slate-500" />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar por aluno, aula, status ou observação..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
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
                className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleGroup(group.key)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggleGroup(group.key);
                    }
                  }}
                  className="grid cursor-pointer gap-3 p-4 transition hover:bg-slate-800/40 lg:grid-cols-[minmax(170px,1.3fr)_120px_100px_auto] lg:items-center"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black uppercase tracking-wide text-white">
                      {group.className}
                    </p>
                  </div>

                  <div className="text-sm font-semibold text-slate-300">
                    {formatDate(group.date)}
                  </div>

                  <div className="text-sm font-semibold text-slate-300">
                    {formatTime(group.createdAt)}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <IconActionButton
                      title="Detalhes"
                      onClick={(event) => {
                        event.stopPropagation();
                        toggleGroup(group.key);
                      }}
                      className="bg-blue-500 text-white hover:bg-blue-400"
                    >
                      <Eye size={16} />
                    </IconActionButton>

                    <IconActionButton
                      title="Copiar"
                      onClick={(event) => {
                        event.stopPropagation();
                        copyGroupReport(group.items);
                      }}
                      className="bg-emerald-500 text-white hover:bg-emerald-400"
                    >
                      <Clipboard size={16} />
                    </IconActionButton>

                    <IconActionButton
                      title="Editar"
                      onClick={(event) => {
                        event.stopPropagation();
                        startEditGroup(group.key, group.items);
                      }}
                      className="bg-yellow-500 text-black hover:bg-yellow-400"
                    >
                      <Edit3 size={16} />
                    </IconActionButton>

                    <IconActionButton
                      title="Excluir"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteWholeCall(group.items);
                      }}
                      className="bg-red-500 text-white hover:bg-red-400"
                    >
                      <Trash2 size={16} />
                    </IconActionButton>
                  </div>
                </div>

                {isOpen && (
                  <div className="space-y-4 border-t border-slate-800 bg-slate-950/30 p-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                        Aula / conteúdo
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-200">
                        {group.content}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
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

                    <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
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
                                    {getShortStudentName(
                                      item.students?.name || "Aluno"
                                    )}
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
                                  style={{ colorScheme: "dark" }}
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
                                    {getShortStudentName(
                                      item.students?.name || "Aluno"
                                    )}
                                  </p>

                                  <p className="text-sm text-slate-400">
                                    {getStatusIcon(item.status)} {item.status}
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

function IconActionButton({
  title,
  children,
  className,
  onClick,
}: {
  title: string;
  children: ReactNode;
  className: string;
  onClick: (event: MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold transition ${className}`}
    >
      {children}
    </button>
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
