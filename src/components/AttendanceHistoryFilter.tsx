"use client";

import { useMemo, useState, type MouseEvent, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  CalendarDays,
  ChevronDown,
  Clipboard,
  Edit3,
  Eye,
  RotateCcw,
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

type DateFilterMode = "all" | "day" | "week" | "month" | "custom";

type DateRange = {
  start: string;
  end: string;
} | null;

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

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseInputDate(value: string) {
  const [yearValue, monthValue, dayValue] = value.split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!year || !month || !day) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekRange(referenceDate: string): DateRange {
  const parsedDate = parseInputDate(referenceDate);

  if (!parsedDate) {
    return null;
  }

  const dayOfWeek = parsedDate.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(parsedDate);
  monday.setDate(parsedDate.getDate() + mondayOffset);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  return {
    start: toInputDate(monday),
    end: toInputDate(sunday),
  };
}

function getMonthRange(monthValue: string): DateRange {
  const [yearValue, monthNumberValue] = monthValue.split("-");
  const year = Number(yearValue);
  const monthNumber = Number(monthNumberValue);

  if (!year || !monthNumber) {
    return null;
  }

  const firstDay = new Date(year, monthNumber - 1, 1);
  const lastDay = new Date(year, monthNumber, 0);

  return {
    start: toInputDate(firstDay),
    end: toInputDate(lastDay),
  };
}

function getCustomRange(startValue: string, endValue: string): DateRange {
  if (!startValue && !endValue) {
    return null;
  }

  if (startValue && endValue && startValue > endValue) {
    return {
      start: endValue,
      end: startValue,
    };
  }

  return {
    start: startValue,
    end: endValue,
  };
}

function getContentSummary(value: string) {
  const cleanValue = value.trim().replace(/\s+/g, " ");

  return cleanValue || "Aula sem conteúdo";
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
  const todayValue = getTodayInputValue();

  const [search, setSearch] = useState("");
  const [selectedClassName, setSelectedClassName] = useState("");
  const [dateFilterMode, setDateFilterMode] =
    useState<DateFilterMode>("all");
  const [selectedDay, setSelectedDay] = useState(todayValue);
  const [selectedWeekReference, setSelectedWeekReference] =
    useState(todayValue);
  const [selectedMonth, setSelectedMonth] = useState(todayValue.slice(0, 7));
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
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

  const activeDateRange = useMemo<DateRange>(() => {
    if (dateFilterMode === "day") {
      return selectedDay
        ? {
            start: selectedDay,
            end: selectedDay,
          }
        : null;
    }

    if (dateFilterMode === "week") {
      return getWeekRange(selectedWeekReference);
    }

    if (dateFilterMode === "month") {
      return getMonthRange(selectedMonth);
    }

    if (dateFilterMode === "custom") {
      return getCustomRange(customStartDate, customEndDate);
    }

    return null;
  }, [
    dateFilterMode,
    selectedDay,
    selectedWeekReference,
    selectedMonth,
    customStartDate,
    customEndDate,
  ]);

  const filteredAttendance = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return attendance.filter((item) => {
      const className = item.classes?.name || "Turma";

      if (selectedClassName && className !== selectedClassName) {
        return false;
      }

      if (activeDateRange?.start && item.date < activeDateRange.start) {
        return false;
      }

      if (activeDateRange?.end && item.date > activeDateRange.end) {
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
  }, [attendance, search, selectedClassName, activeDateRange]);

  const activeDateRangeLabel = useMemo(() => {
    if (dateFilterMode === "all") {
      return "Todo o histórico";
    }

    if (!activeDateRange) {
      return "Selecione uma data";
    }

    if (activeDateRange.start && activeDateRange.end) {
      if (activeDateRange.start === activeDateRange.end) {
        return formatDate(activeDateRange.start);
      }

      return `${formatDate(activeDateRange.start)} até ${formatDate(
        activeDateRange.end
      )}`;
    }

    if (activeDateRange.start) {
      return `A partir de ${formatDate(activeDateRange.start)}`;
    }

    if (activeDateRange.end) {
      return `Até ${formatDate(activeDateRange.end)}`;
    }

    return "Período personalizado";
  }, [dateFilterMode, activeDateRange]);

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

  function resetFilters() {
    setSearch("");
    setSelectedClassName("");
    setDateFilterMode("all");
    setSelectedDay(todayValue);
    setSelectedWeekReference(todayValue);
    setSelectedMonth(todayValue.slice(0, 7));
    setCustomStartDate("");
    setCustomEndDate("");
    setOpenGroup("");
    setEditingGroup("");
    setEditRecords({});
  }

  function handleDateFilterModeChange(mode: DateFilterMode) {
    setDateFilterMode(mode);
    setOpenGroup("");
    setEditingGroup("");
    setEditRecords({});
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">Filtros do histórico</h2>
            <p className="mt-1 text-sm text-slate-400">
              Localize chamadas por turma, conteúdo, aluno ou período.
            </p>
          </div>

          <button
            type="button"
            onClick={resetFilters}
            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <RotateCcw size={16} />
            Limpar filtros
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[280px_minmax(0,1fr)]">
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
              placeholder="Pesquisar por aluno, assunto, status ou observação..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-white">
            <CalendarDays size={18} className="text-blue-300" />
            Período das aulas
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["all", "Todos"],
                ["day", "Um dia"],
                ["week", "Semana"],
                ["month", "Mês"],
                ["custom", "Período personalizado"],
              ] as [DateFilterMode, string][]
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => handleDateFilterModeChange(mode)}
                className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                  dateFilterMode === mode
                    ? "border-blue-300 bg-blue-500/20 text-blue-100"
                    : "border-slate-700 bg-slate-900 text-slate-400 hover:border-blue-500/40 hover:text-slate-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {dateFilterMode === "day" && (
            <div className="mt-4 max-w-xs">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Dia da aula
              </label>
              <input
                type="date"
                value={selectedDay}
                onChange={(event) => setSelectedDay(event.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
          )}

          {dateFilterMode === "week" && (
            <div className="mt-4 max-w-xs">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Escolha um dia da semana desejada
              </label>
              <input
                type="date"
                value={selectedWeekReference}
                onChange={(event) =>
                  setSelectedWeekReference(event.target.value)
                }
                style={{ colorScheme: "dark" }}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
          )}

          {dateFilterMode === "month" && (
            <div className="mt-4 max-w-xs">
              <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Mês das aulas
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                style={{ colorScheme: "dark" }}
                className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
              />
            </div>
          )}

          {dateFilterMode === "custom" && (
            <div className="mt-4 grid max-w-2xl gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Data inicial
                </label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(event) => setCustomStartDate(event.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
                  Data final
                </label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(event) => setCustomEndDate(event.target.value)}
                  style={{ colorScheme: "dark" }}
                  className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
                />
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
            <span className="text-slate-400">
              Período selecionado: {activeDateRangeLabel}
            </span>
            <span className="font-bold text-blue-200">
              {groups.length} chamada(s) encontrada(s)
            </span>
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
                  className="grid cursor-pointer gap-3 p-4 transition hover:bg-slate-800/40 xl:grid-cols-[minmax(150px,0.8fr)_minmax(260px,1.7fr)_120px_100px_auto] xl:items-center"
                >
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Turma
                    </p>
                    <p className="mt-1 truncate text-sm font-black uppercase tracking-wide text-white">
                      {group.className}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Assunto da aula
                    </p>
                    <p
                      title={getContentSummary(group.content)}
                      className="mt-1 line-clamp-2 text-sm font-semibold leading-5 text-slate-200"
                    >
                      {getContentSummary(group.content)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Data
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {formatDate(group.date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-wide text-slate-500">
                      Horário
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-300">
                      {formatTime(group.createdAt)}
                    </p>
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
