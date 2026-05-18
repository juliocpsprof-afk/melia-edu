type Attendance = {
  status: string;
  date: string;
};

export function PedagogicalInterventionPlan({
  average,
  attendance,
}: {
  average: number;
  attendance: Attendance[];
}) {
  const presencas = attendance.filter((item) => item.status === "Presente").length;
  const total = attendance.length;
  const attendanceRate = total > 0 ? (presencas / total) * 100 : 0;

  const actions = generateActions(average, attendanceRate);

  return (
    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-6">
      <h2 className="text-2xl font-bold text-emerald-200">
        Plano de intervenção pedagógica
      </h2>

      <p className="mt-2 text-sm text-emerald-300">
        Sugestões práticas com base no desempenho e na frequência do aluno.
      </p>

      <div className="mt-6 space-y-3">
        {actions.map((action, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
          >
            <p className="font-semibold text-slate-100">
              {index + 1}. {action.title}
            </p>

            <p className="mt-2 leading-7 text-slate-300">
              {action.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function generateActions(average: number, attendanceRate: number) {
  const actions = [];

  if (average < 5) {
    actions.push({
      title: "Reforço pedagógico imediato",
      description:
        "Propor atividades de recuperação com foco nos conteúdos essenciais ainda não consolidados.",
    });

    actions.push({
      title: "Avaliação diagnóstica",
      description:
        "Aplicar uma atividade simples para identificar quais habilidades precisam ser retomadas.",
    });
  } else if (average < 7) {
    actions.push({
      title: "Acompanhamento direcionado",
      description:
        "Revisar os conteúdos em que o aluno apresentou maior dificuldade e propor exercícios orientados.",
    });
  } else {
    actions.push({
      title: "Manutenção do progresso",
      description:
        "Continuar oferecendo desafios progressivos para fortalecer a autonomia e ampliar o desempenho.",
    });
  }

  if (attendanceRate < 70) {
    actions.push({
      title: "Contato com responsável",
      description:
        "Conversar com o responsável para compreender os motivos das ausências e construir um plano de regularização.",
    });
  } else if (attendanceRate < 85) {
    actions.push({
      title: "Monitoramento da frequência",
      description:
        "Acompanhar a frequência nas próximas aulas para evitar queda no vínculo e no rendimento.",
    });
  }

  actions.push({
    title: "Registro pedagógico contínuo",
    description:
      "Registrar observações após as próximas aulas para acompanhar se houve evolução após a intervenção.",
  });

  return actions;
}