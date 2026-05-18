"use client";

import jsPDF from "jspdf";

type Grade = {
  title: string;
  score: number;
  date: string;
  feedback?: string;
};

type Attendance = {
  status: string;
  date: string;
};

type Observation = {
  category: string;
  content: string;
  created_at: string;
};

export function ExportStudentPdfButton({
  studentName,
  className,
  average,
  grades,
  attendance,
  observations,
}: {
  studentName: string;
  className: string;
  average: string;
  grades: Grade[];
  attendance: Attendance[];
  observations: Observation[];
}) {
  function handleExportPdf() {
    const pdf = new jsPDF();

    let y = 20;

    pdf.setFontSize(18);
    pdf.text("Boletim Pedagógico - Melia EDU", 20, y);

    y += 15;
    pdf.setFontSize(12);
    pdf.text(`Aluno: ${studentName}`, 20, y);

    y += 8;
    pdf.text(`Turma: ${className || "Sem turma"}`, 20, y);

    y += 8;
    pdf.text(`Média: ${average}`, 20, y);

    y += 15;
    pdf.setFontSize(14);
    pdf.text("Histórico de Notas", 20, y);

    y += 10;
    pdf.setFontSize(11);

    grades.forEach((grade) => {
      pdf.text(
        `${grade.date} - ${grade.title}: ${grade.score}`,
        20,
        y
      );

      y += 7;

      if (grade.feedback) {
        const feedbackLines = pdf.splitTextToSize(
          `Feedback: ${grade.feedback}`,
          170
        );

        pdf.text(feedbackLines, 20, y);
        y += feedbackLines.length * 7;
      }

      y += 4;
    });

    y += 8;
    pdf.setFontSize(14);
    pdf.text("Histórico de Frequência", 20, y);

    y += 10;
    pdf.setFontSize(11);

    attendance.forEach((item) => {
      pdf.text(`${item.date} - ${item.status}`, 20, y);
      y += 7;
    });

    y += 8;
    pdf.setFontSize(14);
    pdf.text("Observações Pedagógicas", 20, y);

    y += 10;
    pdf.setFontSize(11);

    observations.forEach((observation) => {
      const text = `${observation.category}: ${observation.content}`;
      const lines = pdf.splitTextToSize(text, 170);

      pdf.text(lines, 20, y);
      y += lines.length * 7 + 5;
    });

    pdf.save(`boletim-${studentName}.pdf`);
  }

  return (
    <button
      onClick={handleExportPdf}
      className="rounded-2xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400"
    >
      Exportar PDF
    </button>
  );
}