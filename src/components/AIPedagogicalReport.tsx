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

export function AIPedagogicalReport({
  studentName,
  average,
  attendance,
  observations,
  grades,
}: {
  studentName: string;
  average: number;
  attendance: Attendance[];
  observations: Observation[];
  grades: Grade[];
}) {
  const presencas = attendance.filter((item) => item.status === "Presente").length;
  const faltas = attendance.filter((item) => item.status === "Falta").length;
  const atrasos = attendance.filter((item) => item.status === "Atraso").length;

  const totalAttendance = attendance.length;

  const attendanceRate =
    totalAttendance > 0 ? (presencas / totalAttendance) * 100 : 0;

  const latestObservation = observations[0]?.content;

  const report = generateReport({
    studentName,
    average,
    attendanceRate,
    faltas,
    atrasos,
    latestObservation,
    gradesCount: grades.length,
  });

  return (
    <div className="rounded-3xl border border-violet-500/20 bg-violet-500/10 p-6">
      <h2 className="text-2xl font-bold text-violet-200">
        Parecer pedagógico automático
      </h2>

      <p className="mt-2 text-sm text-violet-300">
        Análise gerada a partir de notas, frequência e observações registradas.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
        <p className="leading-8 text-slate-300">{report}</p>
      </div>
    </div>
  );
}

function generateReport({
  studentName,
  average,
  attendanceRate,
  faltas,
  atrasos,
  latestObservation,
  gradesCount,
}: {
  studentName: string;
  average: number;
  attendanceRate: number;
  faltas: number;
  atrasos: number;
  latestObservation?: string;
  gradesCount: number;
}) {
  let desempenho = "";

  if (average >= 8) {
    desempenho =
      "apresenta ótimo desempenho acadêmico, demonstrando domínio consistente dos conteúdos trabalhados";
  } else if (average >= 7) {
    desempenho =
      "apresenta desempenho satisfatório, com bom aproveitamento geral nas atividades avaliativas";
  } else if (average >= 5) {
    desempenho =
      "apresenta desempenho em desenvolvimento, necessitando de acompanhamento mais próximo em alguns conteúdos";
  } else {
    desempenho =
      "apresenta desempenho abaixo do esperado, exigindo intervenção pedagógica mais sistemática";
  }

  let frequencia = "";

  if (attendanceRate >= 85) {
    frequencia =
      "A frequência registrada é positiva e contribui para a continuidade do processo de aprendizagem.";
  } else if (attendanceRate >= 70) {
    frequencia =
      "A frequência merece atenção, pois algumas ausências ou atrasos podem impactar a consolidação dos conteúdos.";
  } else {
    frequencia =
      "A frequência encontra-se em nível preocupante, podendo comprometer significativamente a aprendizagem.";
  }

  const observacao = latestObservation
    ? `Também há registro recente indicando: "${latestObservation}".`
    : "Até o momento, não há observações pedagógicas recentes registradas.";

  return `${studentName} ${desempenho}. Foram consideradas ${gradesCount} avaliação(ões) no histórico do aluno. ${frequencia} Foram identificadas ${faltas} falta(s) e ${atrasos} atraso(s). ${observacao} Recomenda-se manter acompanhamento contínuo, com devolutivas claras, atividades de reforço quando necessário e diálogo com o aluno para fortalecer sua evolução.`;
}