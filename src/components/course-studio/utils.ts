import type { AxisDraft, LessonDraft } from "./types";

export function createCourseStudioKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function normalizeCourseText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function parsePositiveInteger(value: string) {
  const number = Number(value.replace(",", "."));
  return Number.isInteger(number) && number > 0 ? number : 0;
}

export function formatCourseHours(minutes: number) {
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
}

export function createLessonTitle(
  order: number,
  subject: string,
  content: string
) {
  const base = subject.trim() || content.trim() || `Conteúdo ${order}`;
  return `Aula ${order} — ${base.slice(0, 100)}`;
}

function splitSpreadsheetLine(line: string) {
  if (line.includes("\t")) return line.split("\t");
  if (line.includes(";")) return line.split(";");
  return line.split(",");
}

export function parseCourseSpreadsheet(text: string): LessonDraft[] {
  const rows = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim());

  if (rows.length === 0) return [];

  const firstCells = splitSpreadsheetLine(rows[0]).map((cell) => cell.trim());
  const normalizedHeader = firstCells.map(normalizeCourseText);
  const hasHeader = normalizedHeader.some((cell) =>
    ["n aula", "numero aula", "eixo", "materia", "tipo", "conteudo"].includes(
      cell
    )
  );
  const headerMap = new Map<string, number>();

  if (hasHeader) {
    normalizedHeader.forEach((cell, index) => headerMap.set(cell, index));
  }

  function findIndex(candidates: string[], fallback: number) {
    for (const candidate of candidates) {
      const exact = headerMap.get(candidate);
      if (exact !== undefined) return exact;
      const partial = normalizedHeader.findIndex((cell) =>
        cell.includes(candidate)
      );
      if (partial >= 0) return partial;
    }
    return fallback;
  }

  const orderIndex = findIndex(["n aula", "numero aula", "aula"], 0);
  const axisIndex = findIndex(["eixo"], 1);
  const subjectIndex = findIndex(["materia", "disciplina"], 2);
  const typeIndex = findIndex(["tipo"], 3);
  const contentIndex = findIndex(["conteudo"], 4);
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((line, index) => {
      const cells = splitSpreadsheetLine(line).map((cell) => cell.trim());
      const requestedOrder = Number(cells[orderIndex]);
      const subject = cells[subjectIndex] || "";
      const content = cells[contentIndex] || "";

      if (!subject && !content) return null;

      return {
        key: createCourseStudioKey("lesson"),
        order:
          Number.isFinite(requestedOrder) && requestedOrder > 0
            ? requestedOrder
            : index + 1,
        axis: cells[axisIndex] || "Conteúdos gerais",
        subject,
        type: cells[typeIndex] || "Aula",
        content: content || subject,
      } satisfies LessonDraft;
    })
    .filter((item): item is LessonDraft => Boolean(item))
    .sort((a, b) => a.order - b.order)
    .map((item, index) => ({ ...item, order: index + 1 }));
}

export function inferAxesFromLessons(lessons: LessonDraft[]) {
  const countByAxis = new Map<string, number>();

  lessons.forEach((lesson) => {
    const name = lesson.axis.trim() || "Conteúdos gerais";
    countByAxis.set(name, (countByAxis.get(name) ?? 0) + 1);
  });

  return Array.from(countByAxis, ([name, count]) => ({ name, count }));
}

export function cloneAxes(axes: AxisDraft[]) {
  return axes.map((axis) => ({ ...axis }));
}

export function downloadCourseSpreadsheetTemplate() {
  const rows = [
    ["Nº Aula", "Eixo", "Matéria", "Tipo", "Conteúdo"],
    [
      "1",
      "Fundamentos Digitais",
      "Introdução à Informática",
      "Plataforma",
      "Aula 1 – História dos computadores, Teclado e Mouse",
    ],
    [
      "2",
      "Fundamentos Digitais",
      "Introdução à Informática",
      "Plataforma",
      "Aula 2 – Vídeo, Impressora e Dispositivos de Entrada/Saída",
    ],
  ];
  const csv = `\uFEFF${rows
    .map((row) =>
      row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(";")
    )
    .join("\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "modelo_grade_curso_melia.csv";
  link.click();
  URL.revokeObjectURL(url);
}
