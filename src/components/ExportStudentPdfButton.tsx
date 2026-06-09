"use client";

import jsPDF from "jspdf";
import { CheckCircle2, Download, MessageCircle } from "lucide-react";
import { useState } from "react";

type Grade = {
  title: string;
  score: number;
  date: string;
  feedback?: string | null;
};

type Attendance = {
  status: string | null;
  date: string | null;
};

type Observation = {
  category: string | null;
  content: string;
  created_at: string | null;
};

type Goal = {
  id?: string;
  title: string;
  description?: string | null;
  status?: string | null;
  created_at?: string | null;
};

type ExportStudentPdfButtonProps = {
  studentName: string;
  className: string | null;
  courseName?: string | null;
  email?: string | null;
  phone?: string | null;
  birthDate?: string | null;
  status?: string | null;
  average: string;
  frequency?: number;
  grades: Grade[];
  attendance: Attendance[];
  observations: Observation[];
  goals?: Goal[];
};

type Tone = "positive" | "attention" | "negative" | "neutral";

type ToneInfo = {
  tone: Tone;
  label: string;
  shortLabel: string;
  whatsappMark: string;
  pdfText: [number, number, number];
  pdfFill: [number, number, number];
  pdfBorder: [number, number, number];
};

const toneMap: Record<Tone, ToneInfo> = {
  positive: {
    tone: "positive",
    label: "POSITIVO",
    shortLabel: "Bom",
    whatsappMark: "🟢 POSITIVO",
    pdfText: [4, 120, 87],
    pdfFill: [236, 253, 245],
    pdfBorder: [110, 231, 183],
  },
  attention: {
    tone: "attention",
    label: "ATENÇÃO",
    shortLabel: "Atenção",
    whatsappMark: "🟡 ATENÇÃO",
    pdfText: [180, 83, 9],
    pdfFill: [255, 251, 235],
    pdfBorder: [252, 211, 77],
  },
  negative: {
    tone: "negative",
    label: "INTERVENÇÃO",
    shortLabel: "Crítico",
    whatsappMark: "🔴 INTERVENÇÃO",
    pdfText: [185, 28, 28],
    pdfFill: [254, 242, 242],
    pdfBorder: [252, 165, 165],
  },
  neutral: {
    tone: "neutral",
    label: "REGISTRO",
    shortLabel: "Neutro",
    whatsappMark: "⚪ REGISTRO",
    pdfText: [71, 85, 105],
    pdfFill: [248, 250, 252],
    pdfBorder: [203, 213, 225],
  },
};

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Não informado";
  }

  const cleanValue = value.slice(0, 10);
  const date = new Date(`${cleanValue}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Não informado";
  }

  return date.toLocaleDateString("pt-BR");
}

function formatShortDate(value: string | null | undefined) {
  const formatted = formatDate(value);

  if (formatted === "Não informado") {
    return "s/data";
  }

  return formatted.slice(0, 5);
}

function sanitizeFileName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .toLowerCase();
}

function truncateText(value: string | null | undefined, maxLength: number) {
  const cleanValue = (value || "").trim().replace(/\s+/g, " ");

  if (!cleanValue) {
    return "";
  }

  if (cleanValue.length <= maxLength) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, maxLength - 3)}...`;
}

function parseNumber(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  const normalized = String(value ?? "0")
    .replace("%", "")
    .replace(",", ".")
    .trim();

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getAttendanceSummary(attendance: Attendance[]) {
  const presencas = attendance.filter((item) => item.status === "Presente").length;
  const faltas = attendance.filter((item) => item.status === "Falta").length;
  const atrasos = attendance.filter((item) => item.status === "Atraso").length;
  const total = attendance.length;
  const positive = presencas + atrasos;
  const percentage = total > 0 ? Math.round((positive / total) * 100) : 0;
  const absenceRate = total > 0 ? Math.round((faltas / total) * 100) : 0;

  return {
    presencas,
    faltas,
    atrasos,
    total,
    percentage,
    absenceRate,
  };
}

function getToneInfo(tone: Tone) {
  return toneMap[tone];
}

function getAverageTone(average: string) {
  const value = parseNumber(average);

  if (value >= 7) {
    return getToneInfo("positive");
  }

  if (value >= 5) {
    return getToneInfo("attention");
  }

  return getToneInfo("negative");
}

function getGradeTone(score: number) {
  if (score >= 7) {
    return getToneInfo("positive");
  }

  if (score >= 5) {
    return getToneInfo("attention");
  }

  return getToneInfo("negative");
}

function getFrequencyTone(frequency: number) {
  if (frequency >= 85) {
    return getToneInfo("positive");
  }

  if (frequency >= 75) {
    return getToneInfo("attention");
  }

  return getToneInfo("negative");
}

function getAbsenceTone(summary: ReturnType<typeof getAttendanceSummary>) {
  if (summary.total === 0 || summary.faltas === 0) {
    return getToneInfo("positive");
  }

  if (summary.absenceRate <= 15) {
    return getToneInfo("attention");
  }

  return getToneInfo("negative");
}

function getAttendanceTone(status: string | null | undefined) {
  if (status === "Presente") {
    return getToneInfo("positive");
  }

  if (status === "Atraso") {
    return getToneInfo("attention");
  }

  if (status === "Falta") {
    return getToneInfo("negative");
  }

  return getToneInfo("neutral");
}

function getObservationTone(observation: Observation) {
  const text = `${observation.category || ""} ${observation.content || ""}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const negativeWords = [
    "falta",
    "ausencia",
    "risco",
    "dificuldade",
    "baixo",
    "indisciplina",
    "conflito",
    "atraso",
    "desatencao",
    "nao realizou",
    "nao entregou",
    "familia",
    "encaminhamento",
    "intervencao",
  ];

  const positiveWords = [
    "evolucao",
    "melhora",
    "bom desempenho",
    "participa",
    "responsavel",
    "compromisso",
    "progresso",
    "superou",
    "destaque",
    "autonomia",
  ];

  if (negativeWords.some((word) => text.includes(word))) {
    return getToneInfo("negative");
  }

  if (positiveWords.some((word) => text.includes(word))) {
    return getToneInfo("positive");
  }

  return getToneInfo("attention");
}

function getGoalTone(goal: Goal) {
  const status = (goal.status || "").toLowerCase();

  if (status.includes("conclu")) {
    return getToneInfo("positive");
  }

  if (status.includes("atras") || status.includes("risco") || status.includes("cancel")) {
    return getToneInfo("negative");
  }

  return getToneInfo("attention");
}

function getStatusShortLabel(status: string | null | undefined) {
  if (status === "Presente") {
    return "P";
  }

  if (status === "Atraso") {
    return "A";
  }

  if (status === "Falta") {
    return "F";
  }

  return "SR";
}

function getPerformanceText(tone: ToneInfo, positiveText: string, attentionText: string, negativeText: string) {
  if (tone.tone === "positive") {
    return positiveText;
  }

  if (tone.tone === "attention") {
    return attentionText;
  }

  if (tone.tone === "negative") {
    return negativeText;
  }

  return "Registro sem classificação.";
}

function buildWhatsAppMessage({
  studentName,
  className,
  courseName,
  average,
  frequency,
  grades,
  attendance,
  observations,
  goals,
  status,
}: ExportStudentPdfButtonProps) {
  const summary = getAttendanceSummary(attendance);
  const effectiveFrequency = frequency ?? summary.percentage;
  const averageTone = getAverageTone(average);
  const frequencyTone = getFrequencyTone(effectiveFrequency);
  const absenceTone = getAbsenceTone(summary);
  const lastGrades = grades.slice(0, 5);
  const lastObservations = observations.slice(0, 3);
  const activeGoals = (goals ?? []).filter((goal) => goal.status !== "Concluída");

  const attendanceLine = attendance.length
    ? attendance
        .slice(0, 12)
        .map((item) => {
          const tone = getAttendanceTone(item.status);
          return `${tone.whatsappMark.split(" ")[0]} ${formatShortDate(item.date)} ${getStatusShortLabel(item.status)}`;
        })
        .join(" | ")
    : "Sem registros de frequência.";

  const gradeLines =
    lastGrades.length > 0
      ? lastGrades
          .map((grade) => {
            const tone = getGradeTone(Number(grade.score));
            return `${tone.whatsappMark} - ${Number(grade.score).toFixed(1)} - ${truncateText(
              grade.title,
              44
            )} (${formatShortDate(grade.date)})`;
          })
          .join("\n")
      : "- Nenhuma nota registrada.";

  const observationLines =
    lastObservations.length > 0
      ? lastObservations
          .map((observation) => {
            const tone = getObservationTone(observation);
            return `${tone.whatsappMark} - ${observation.category || "Pedagógica"}: ${truncateText(
              observation.content,
              130
            )}`;
          })
          .join("\n")
      : "- Nenhuma observação registrada.";

  const goalLines =
    activeGoals.length > 0
      ? activeGoals
          .slice(0, 3)
          .map((goal) => {
            const tone = getGoalTone(goal);
            return `${tone.whatsappMark} - ${truncateText(goal.title, 70)}${
              goal.description ? `: ${truncateText(goal.description, 100)}` : ""
            }`;
          })
          .join("\n")
      : "- Nenhuma meta ativa cadastrada.";

  return `*BOLETIM PEDAGÓGICO - MELIA EDU*\n\n*Aluno:* ${studentName}\n*Turma:* ${
    className || "Sem turma"
  }\n*Curso:* ${courseName || "Sem curso"}\n*Situação geral:* ${status || "Regular"}\n\n*LEITURA RÁPIDA*\n${
    averageTone.whatsappMark
  } - Média: *${average}* - ${getPerformanceText(
    averageTone,
    "rendimento satisfatório.",
    "rendimento exige acompanhamento.",
    "rendimento exige intervenção prioritária."
  )}\n${frequencyTone.whatsappMark} - Frequência: *${effectiveFrequency}%* - ${getPerformanceText(
    frequencyTone,
    "frequência adequada.",
    "frequência próxima do limite.",
    "frequência abaixo do esperado."
  )}\n${absenceTone.whatsappMark} - Faltas: *${summary.faltas}* de ${summary.total} registro(s).\n\n*FREQUÊNCIA RECENTE*\n${attendanceLine}\nLegenda: P=presente | A=atraso | F=falta\n\n*NOTAS RECENTES*\n${gradeLines}\n\n*OBSERVAÇÕES PEDAGÓGICAS*\n${observationLines}\n\n*METAS E ENCAMINHAMENTOS*\n${goalLines}\n\n*Legenda visual:*\n🟢 POSITIVO = situação favorável\n🟡 ATENÇÃO = acompanhar de perto\n🔴 INTERVENÇÃO = ação prioritária\n\n_Registro para acompanhamento pedagógico._`;
}

export function ExportStudentPdfButton({
  studentName,
  className,
  courseName,
  email,
  phone,
  birthDate,
  status,
  average,
  frequency,
  grades,
  attendance,
  observations,
  goals = [],
}: ExportStudentPdfButtonProps) {
  const [whatsAppCopied, setWhatsAppCopied] = useState(false);

  const summary = getAttendanceSummary(attendance);
  const effectiveFrequency = frequency ?? summary.percentage;
  const averageTone = getAverageTone(average);
  const frequencyTone = getFrequencyTone(effectiveFrequency);
  const absenceTone = getAbsenceTone(summary);

  function handleExportPdf() {
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const gap = 4;

    let y = 12;

    function ensureSpace(requiredHeight: number) {
      if (y + requiredHeight <= pageHeight - 13) {
        return;
      }

      pdf.addPage();
      y = 12;
    }

    function setColor(color: [number, number, number], type: "text" | "fill" | "draw") {
      if (type === "text") {
        pdf.setTextColor(color[0], color[1], color[2]);
      }

      if (type === "fill") {
        pdf.setFillColor(color[0], color[1], color[2]);
      }

      if (type === "draw") {
        pdf.setDrawColor(color[0], color[1], color[2]);
      }
    }

    function addFooter() {
      const pageCount = pdf.getNumberOfPages();

      for (let page = 1; page <= pageCount; page += 1) {
        pdf.setPage(page);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(7.5);
        pdf.setTextColor(120, 132, 154);
        pdf.text(`Melia EDU • Boletim pedagógico • ${page}/${pageCount}`, margin, pageHeight - 7);
        pdf.text(new Date().toLocaleDateString("pt-BR"), pageWidth - margin, pageHeight - 7, {
          align: "right",
        });
      }
    }

    function addSectionTitle(title: string) {
      ensureSpace(11);
      pdf.setFillColor(241, 245, 249);
      pdf.roundedRect(margin, y, contentWidth, 9, 2, 2, "F");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(30, 41, 59);
      pdf.text(title, margin + 4, y + 6.2);
      y += 12;
    }

    function addPill(x: number, pillY: number, label: string, tone: ToneInfo, width = 28) {
      setColor(tone.pdfFill, "fill");
      setColor(tone.pdfBorder, "draw");
      pdf.roundedRect(x, pillY, width, 5.5, 2, 2, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(5.6);
      setColor(tone.pdfText, "text");
      pdf.text(label, x + width / 2, pillY + 3.8, { align: "center" });
    }

    function addMetricCard(
      x: number,
      width: number,
      label: string,
      value: string,
      helper: string,
      tone: ToneInfo
    ) {
      setColor(tone.pdfFill, "fill");
      setColor(tone.pdfBorder, "draw");
      pdf.roundedRect(x, y, width, 20, 2.5, 2.5, "FD");

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.6);
      pdf.setTextColor(71, 85, 105);
      pdf.text(label.toUpperCase(), x + 3, y + 5);

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13.5);
      setColor(tone.pdfText, "text");
      pdf.text(truncateText(value, 14), x + 3, y + 12.2);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(6.6);
      pdf.setTextColor(71, 85, 105);
      pdf.text(truncateText(helper, 28), x + 3, y + 17);

      addPill(x + width - 27.5, y + 3, tone.shortLabel, tone, 24.5);
    }

    function addKeyValueLine(items: string[]) {
      ensureSpace(8);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.3);
      pdf.setTextColor(51, 65, 85);
      pdf.text(items.join("   •   "), margin + 3, y + 4.5);
      y += 8;
    }

    function addWrappedText(text: string, options?: { fontSize?: number; indent?: number; maxWidth?: number; lineHeight?: number }) {
      const fontSize = options?.fontSize ?? 8.2;
      const indent = options?.indent ?? 3;
      const maxWidth = options?.maxWidth ?? contentWidth - indent * 2;
      const lineHeight = options?.lineHeight ?? 4.2;
      const lines = pdf.splitTextToSize(text, maxWidth);
      ensureSpace(lines.length * lineHeight + 3);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(fontSize);
      pdf.setTextColor(51, 65, 85);
      pdf.text(lines, margin + indent, y);
      y += lines.length * lineHeight + 3;
    }

    function addCompactTableRow(
      columns: { text: string; width: number; bold?: boolean; align?: "left" | "right"; tone?: ToneInfo }[],
      height = 7,
      isHeader = false
    ) {
      ensureSpace(height + 1);
      let x = margin;

      pdf.setFillColor(isHeader ? 248 : 255, isHeader ? 250 : 255, isHeader ? 252 : 255);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, y, contentWidth, height, "FD");

      columns.forEach((column) => {
        pdf.setFont("helvetica", column.bold || isHeader ? "bold" : "normal");
        pdf.setFontSize(7.7);
        const text = truncateText(column.text, Math.max(10, Math.floor(column.width * 1.28)));

        if (column.tone) {
          setColor(column.tone.pdfFill, "fill");
          pdf.roundedRect(x + 1.2, y + 1.1, column.width - 2.4, height - 2.2, 1.6, 1.6, "F");
          setColor(column.tone.pdfText, "text");
        } else {
          pdf.setTextColor(isHeader ? 30 : 71, isHeader ? 41 : 85, isHeader ? 59 : 105);
        }

        pdf.text(text, column.align === "right" ? x + column.width - 2 : x + 2, y + 4.8, {
          align: column.align ?? "left",
        });
        x += column.width;
      });

      y += height;
    }

    function addAttendanceChips(items: Attendance[]) {
      if (items.length === 0) {
        addWrappedText("Nenhum registro de frequência localizado.");
        return;
      }

      ensureSpace(22);
      let x = margin + 3;
      let chipY = y;
      const chipHeight = 6.4;
      const rowGap = 2.2;
      const maxX = margin + contentWidth - 3;

      items.slice(0, 42).forEach((item) => {
        const label = `${formatShortDate(item.date)} ${getStatusShortLabel(item.status)}`;
        const chipWidth = Math.max(18, pdf.getTextWidth(label) + 6.5);
        const tone = getAttendanceTone(item.status);

        if (x + chipWidth > maxX) {
          x = margin + 3;
          chipY += chipHeight + rowGap;
        }

        ensureSpace(chipY - y + chipHeight + 4);
        setColor(tone.pdfFill, "fill");
        setColor(tone.pdfBorder, "draw");
        pdf.roundedRect(x, chipY, chipWidth, chipHeight, 2, 2, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(6.6);
        setColor(tone.pdfText, "text");
        pdf.text(label, x + chipWidth / 2, chipY + 4.3, { align: "center" });
        x += chipWidth + 2.2;
      });

      y = chipY + chipHeight + 5;
      addWrappedText("Legenda: P = presente | A = atraso | F = falta | SR = sem registro.", {
        fontSize: 7.2,
        lineHeight: 3.4,
      });
    }

    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(margin, y, contentWidth, 26, 4, 4, "F");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.setTextColor(255, 255, 255);
    pdf.text("Boletim Pedagógico", margin + 6, y + 10);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.4);
    pdf.setTextColor(203, 213, 225);
    pdf.text("Melia EDU • leitura visual da situação do estudante", margin + 6, y + 17);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(221, 214, 254);
    pdf.text(truncateText(studentName, 45), margin + 6, y + 23);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(226, 232, 240);
    pdf.text(
      `${className || "Sem turma"} • ${courseName || "Sem curso"}`,
      pageWidth - margin - 6,
      y + 23,
      { align: "right" }
    );

    y += 33;

    const cardWidth = (contentWidth - gap * 3) / 4;
    addMetricCard(margin, cardWidth, "Média", average, "rendimento", averageTone);
    addMetricCard(
      margin + cardWidth + gap,
      cardWidth,
      "Frequência",
      `${effectiveFrequency}%`,
      `${summary.total} registros`,
      frequencyTone
    );
    addMetricCard(
      margin + (cardWidth + gap) * 2,
      cardWidth,
      "Faltas",
      String(summary.faltas),
      `${summary.absenceRate}% ausência`,
      absenceTone
    );
    addMetricCard(
      margin + (cardWidth + gap) * 3,
      cardWidth,
      "Situação",
      status || "Regular",
      "acompanhamento",
      status && status.toLowerCase().includes("risco") ? getToneInfo("negative") : getToneInfo("neutral")
    );
    y += 27;

    addSectionTitle("Leitura pedagógica rápida");
    addCompactTableRow(
      [
        { text: "Indicador", width: 36, bold: true },
        { text: "Resultado", width: 33, bold: true, align: "right" },
        { text: "Classificação", width: 34, bold: true },
        { text: "Leitura", width: contentWidth - 103, bold: true },
      ],
      7,
      true
    );
    addCompactTableRow([
      { text: "Média", width: 36 },
      { text: average, width: 33, bold: true, align: "right", tone: averageTone },
      { text: averageTone.label, width: 34, bold: true, tone: averageTone },
      {
        text: getPerformanceText(
          averageTone,
          "Rendimento satisfatório.",
          "Exige acompanhamento.",
          "Exige intervenção prioritária."
        ),
        width: contentWidth - 103,
      },
    ]);
    addCompactTableRow([
      { text: "Frequência", width: 36 },
      { text: `${effectiveFrequency}%`, width: 33, bold: true, align: "right", tone: frequencyTone },
      { text: frequencyTone.label, width: 34, bold: true, tone: frequencyTone },
      {
        text: getPerformanceText(
          frequencyTone,
          "Frequência adequada.",
          "Próxima do limite mínimo.",
          "Abaixo do esperado."
        ),
        width: contentWidth - 103,
      },
    ]);
    addCompactTableRow([
      { text: "Faltas", width: 36 },
      { text: `${summary.faltas}/${summary.total}`, width: 33, bold: true, align: "right", tone: absenceTone },
      { text: absenceTone.label, width: 34, bold: true, tone: absenceTone },
      {
        text: getPerformanceText(
          absenceTone,
          "Sem impacto relevante.",
          "Monitorar reincidência.",
          "Priorizar contato e intervenção."
        ),
        width: contentWidth - 103,
      },
    ]);

    y += 4;
    addSectionTitle("Identificação");
    addKeyValueLine([`Nascimento: ${formatDate(birthDate)}`, `Telefone: ${phone || "Não informado"}`]);
    addKeyValueLine([`E-mail: ${email || "Não informado"}`, `Curso: ${courseName || "Sem curso"}`]);

    addSectionTitle("Resumo de frequência");
    addWrappedText(
      `Presenças: ${summary.presencas} | Atrasos: ${summary.atrasos} | Faltas: ${summary.faltas} | Total: ${summary.total} | Frequência geral: ${effectiveFrequency}%.`,
      { fontSize: 8.2 }
    );
    addAttendanceChips(attendance);

    addSectionTitle("Notas e avaliações");

    if (grades.length === 0) {
      addWrappedText("Nenhuma nota registrada até o momento.");
    } else {
      addCompactTableRow(
        [
          { text: "Data", width: 22, bold: true },
          { text: "Atividade", width: contentWidth - 82, bold: true },
          { text: "Nota", width: 20, bold: true, align: "right" },
          { text: "Situação", width: 40, bold: true },
        ],
        7,
        true
      );

      grades.forEach((grade) => {
        const tone = getGradeTone(Number(grade.score));
        addCompactTableRow([
          { text: formatDate(grade.date), width: 22 },
          { text: grade.title || "Atividade sem título", width: contentWidth - 82 },
          { text: Number(grade.score).toFixed(1), width: 20, bold: true, align: "right", tone },
          { text: tone.label, width: 40, bold: true, tone },
        ]);

        if (grade.feedback) {
          addWrappedText(`Feedback: ${truncateText(grade.feedback, 160)}`, {
            fontSize: 7.3,
            indent: 5,
            lineHeight: 3.5,
          });
        }
      });
    }

    addSectionTitle("Observações pedagógicas");

    if (observations.length === 0) {
      addWrappedText("Nenhuma observação registrada até o momento.");
    } else {
      observations.forEach((observation) => {
        const tone = getObservationTone(observation);
        const header = `${formatDate(observation.created_at)} • ${observation.category || "Pedagógica"}`;
        ensureSpace(10);
        setColor(tone.pdfFill, "fill");
        setColor(tone.pdfBorder, "draw");
        pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.7);
        setColor(tone.pdfText, "text");
        pdf.text(header, margin + 3, y + 5.2);
        pdf.text(tone.label, pageWidth - margin - 3, y + 5.2, { align: "right" });
        y += 10;
        addWrappedText(truncateText(observation.content, 420), {
          fontSize: 7.7,
          lineHeight: 3.7,
        });
      });
    }

    addSectionTitle("Metas e encaminhamentos");

    if (goals.length === 0) {
      addWrappedText("Nenhuma meta cadastrada até o momento.");
    } else {
      goals.forEach((goal) => {
        const tone = getGoalTone(goal);
        const statusText = goal.status || "Em andamento";
        ensureSpace(11);
        setColor(tone.pdfFill, "fill");
        setColor(tone.pdfBorder, "draw");
        pdf.roundedRect(margin, y, contentWidth, 8, 2, 2, "FD");
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(7.8);
        setColor(tone.pdfText, "text");
        pdf.text(`${truncateText(goal.title, 95)} (${statusText})`, margin + 3, y + 5.2);
        y += 10;

        if (goal.description) {
          addWrappedText(truncateText(goal.description, 300), {
            fontSize: 7.6,
            lineHeight: 3.7,
          });
        }
      });
    }

    addFooter();
    pdf.save(`boletim-${sanitizeFileName(studentName)}.pdf`);
  }

  async function handleCopyWhatsAppReport() {
    const message = buildWhatsAppMessage({
      studentName,
      className,
      courseName,
      email,
      phone,
      birthDate,
      status,
      average,
      frequency,
      grades,
      attendance,
      observations,
      goals,
    });

    await navigator.clipboard.writeText(message);
    setWhatsAppCopied(true);

    window.setTimeout(() => {
      setWhatsAppCopied(false);
    }, 2500);
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handleExportPdf}
        className="inline-flex items-center gap-2 rounded-2xl bg-violet-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-400"
      >
        <Download size={17} />
        Exportar PDF
      </button>

      <button
        type="button"
        onClick={handleCopyWhatsAppReport}
        className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-200 transition hover:bg-emerald-500/20"
      >
        {whatsAppCopied ? <CheckCircle2 size={17} /> : <MessageCircle size={17} />}
        {whatsAppCopied ? "Boletim copiado" : "Copiar boletim WhatsApp"}
      </button>
    </div>
  );
}
