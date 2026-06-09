"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle,
  Eraser,
  PlusCircle,
  Search,
  Sparkles,
  Wand2,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ObservationTemplate = {
  id: string;
  category: string;
  title: string;
  focus: string;
  text: string;
};

const observationCategories = [
  "Pedagógica",
  "Comportamental",
  "Familiar",
  "Intervenção",
  "Evolução",
  "Frequência",
  "Socioemocional",
  "Inclusão",
  "Encaminhamento",
];

const observationTemplates: ObservationTemplate[] = [
  {
    id: "ped-001",
    category: "Pedagógica",
    title: "Dificuldade de compreensão",
    focus: "Aprendizagem",
    text: "O aluno demonstra dificuldade em compreender parte dos conteúdos trabalhados, necessitando de retomadas pontuais, exemplos práticos e acompanhamento mais próximo durante as atividades.",
  },
  {
    id: "ped-002",
    category: "Pedagógica",
    title: "Necessidade de retomada",
    focus: "Aprendizagem",
    text: "Recomenda-se retomar os conceitos fundamentais da aula, utilizando linguagem objetiva, exercícios graduais e verificação constante de compreensão antes de avançar para novas etapas.",
  },
  {
    id: "ped-003",
    category: "Pedagógica",
    title: "Baixa autonomia",
    focus: "Rotina de estudo",
    text: "O aluno ainda apresenta baixa autonomia na realização das atividades, solicitando apoio frequente. Sugere-se propor tarefas com etapas curtas e estimular que registre dúvidas específicas antes da intervenção do professor.",
  },
  {
    id: "ped-004",
    category: "Pedagógica",
    title: "Boa participação",
    focus: "Potencialidade",
    text: "O aluno demonstra boa participação nas atividades propostas, contribuindo com perguntas e respostas pertinentes. Recomenda-se manter estímulos positivos e ampliar desafios para consolidar seu protagonismo.",
  },
  {
    id: "ped-005",
    category: "Pedagógica",
    title: "Organização dos estudos",
    focus: "Hábitos",
    text: "Observa-se necessidade de fortalecer a organização dos estudos. Foi orientado que o aluno registre prazos, revise os conteúdos da aula e mantenha os materiais em ordem para melhorar o acompanhamento das atividades.",
  },
  {
    id: "ped-006",
    category: "Pedagógica",
    title: "Defasagem pontual",
    focus: "Recomposição",
    text: "Foram identificadas lacunas pontuais de aprendizagem. Sugere-se recomposição com exercícios direcionados, monitoramento semanal e devolutivas curtas para acompanhar a evolução.",
  },
  {
    id: "ped-007",
    category: "Pedagógica",
    title: "Desempenho abaixo do esperado",
    focus: "Rendimento",
    text: "O desempenho atual está abaixo do esperado para o período. Recomenda-se plano de acompanhamento com metas simples, revisão orientada e verificação do cumprimento das atividades propostas.",
  },
  {
    id: "ped-008",
    category: "Pedagógica",
    title: "Evolução no conteúdo",
    focus: "Progresso",
    text: "O aluno apresentou evolução na compreensão dos conteúdos recentes, demonstrando maior segurança na execução das atividades. Recomenda-se valorizar o progresso e manter acompanhamento para consolidar os avanços.",
  },
  {
    id: "comp-001",
    category: "Comportamental",
    title: "Dispersão em sala",
    focus: "Atenção",
    text: "O aluno tem apresentado momentos de dispersão durante a aula, necessitando de redirecionamento para concluir as atividades. Foi orientado sobre foco, escuta ativa e compromisso com a rotina da turma.",
  },
  {
    id: "comp-002",
    category: "Comportamental",
    title: "Conversas paralelas",
    focus: "Postura",
    text: "Foram observadas conversas paralelas que interferem na concentração do aluno e dos colegas. Recomenda-se intervenção preventiva, combinados claros e acompanhamento da postura durante as próximas aulas.",
  },
  {
    id: "comp-003",
    category: "Comportamental",
    title: "Respeito às regras",
    focus: "Convivência",
    text: "O aluno foi orientado quanto à importância de respeitar os combinados da turma, os tempos de fala e as regras de convivência, visando melhorar sua participação e o clima de aprendizagem.",
  },
  {
    id: "comp-004",
    category: "Comportamental",
    title: "Postura colaborativa",
    focus: "Convivência",
    text: "O aluno demonstrou postura colaborativa nas atividades em grupo, contribuindo com os colegas e respeitando as orientações. Recomenda-se reforçar positivamente essa conduta.",
  },
  {
    id: "comp-005",
    category: "Comportamental",
    title: "Conflito entre pares",
    focus: "Mediação",
    text: "Houve necessidade de mediação em situação de conflito entre colegas. O aluno foi orientado a utilizar diálogo respeitoso, escuta e comunicação adequada para resolver divergências.",
  },
  {
    id: "comp-006",
    category: "Comportamental",
    title: "Uso inadequado do celular",
    focus: "Rotina",
    text: "Foi necessário orientar o aluno sobre o uso adequado do celular durante a aula. Recomenda-se reforçar os combinados e acompanhar se o uso do aparelho está prejudicando sua concentração.",
  },
  {
    id: "fam-001",
    category: "Familiar",
    title: "Contato com responsáveis",
    focus: "Intervenção familiar",
    text: "Recomenda-se contato com a família ou responsáveis para alinhar informações sobre frequência, participação e rotina de estudos, buscando construir estratégias conjuntas de acompanhamento.",
  },
  {
    id: "fam-002",
    category: "Familiar",
    title: "Orientação sobre frequência",
    focus: "Intervenção familiar",
    text: "Sugere-se comunicar a família sobre a importância da frequência regular, reforçando que ausências sucessivas podem comprometer o acompanhamento dos conteúdos e a evolução do aluno.",
  },
  {
    id: "fam-003",
    category: "Familiar",
    title: "Rotina de estudos em casa",
    focus: "Intervenção familiar",
    text: "A família pode ser orientada a apoiar a criação de uma rotina simples de estudos, com horário definido, organização de materiais e acompanhamento dos prazos de atividades.",
  },
  {
    id: "fam-004",
    category: "Familiar",
    title: "Devolutiva positiva à família",
    focus: "Fortalecimento de vínculo",
    text: "Recomenda-se compartilhar com a família os avanços observados, valorizando a evolução do aluno e reforçando a importância da continuidade do apoio familiar.",
  },
  {
    id: "fam-005",
    category: "Familiar",
    title: "Reunião de acompanhamento",
    focus: "Ação conjunta",
    text: "Sugere-se agendar reunião de acompanhamento com a família ou responsáveis para discutir estratégias de apoio, combinados de frequência, organização e participação nas atividades.",
  },
  {
    id: "int-001",
    category: "Intervenção",
    title: "Plano de curto prazo",
    focus: "Ação pedagógica",
    text: "Foi proposta intervenção de curto prazo com metas objetivas: retomar conteúdos essenciais, acompanhar entregas, monitorar frequência e realizar devolutiva ao aluno ao final do período combinado.",
  },
  {
    id: "int-002",
    category: "Intervenção",
    title: "Atividade complementar",
    focus: "Reforço",
    text: "Recomenda-se atividade complementar direcionada ao conteúdo em que o aluno apresentou maior dificuldade, com correção comentada e nova oportunidade de demonstrar aprendizagem.",
  },
  {
    id: "int-003",
    category: "Intervenção",
    title: "Tutoria entre pares",
    focus: "Colaboração",
    text: "Pode ser utilizada estratégia de tutoria entre pares, aproximando o aluno de colegas que demonstrem domínio do conteúdo, favorecendo colaboração, vínculo e aprendizagem ativa.",
  },
  {
    id: "int-004",
    category: "Intervenção",
    title: "Monitoramento semanal",
    focus: "Acompanhamento",
    text: "Recomenda-se monitoramento semanal da participação, frequência e entrega de atividades, registrando avanços e pontos de atenção para orientar novas intervenções.",
  },
  {
    id: "int-005",
    category: "Intervenção",
    title: "Combinados individuais",
    focus: "Responsabilidade",
    text: "Foram estabelecidos combinados individuais com o aluno, incluindo metas de participação, organização e cumprimento de atividades. Recomenda-se revisar os combinados na próxima aula.",
  },
  {
    id: "int-006",
    category: "Intervenção",
    title: "Reorganização da sala",
    focus: "Atenção",
    text: "Pode ser realizada mudança estratégica de lugar na sala, buscando reduzir distrações, favorecer a escuta e aproximar o aluno do acompanhamento do professor.",
  },
  {
    id: "evo-001",
    category: "Evolução",
    title: "Melhora na participação",
    focus: "Progresso",
    text: "O aluno apresentou melhora na participação, respondendo melhor às orientações e demonstrando maior envolvimento nas atividades propostas.",
  },
  {
    id: "evo-002",
    category: "Evolução",
    title: "Maior responsabilidade",
    focus: "Autonomia",
    text: "Observa-se maior responsabilidade do aluno em relação à rotina, aos materiais e às entregas. Recomenda-se manter reforços positivos para consolidar esse comportamento.",
  },
  {
    id: "evo-003",
    category: "Evolução",
    title: "Avanço na frequência",
    focus: "Assiduidade",
    text: "O aluno apresentou melhora na frequência, demonstrando esforço para manter presença mais regular. Recomenda-se acompanhar a continuidade desse avanço.",
  },
  {
    id: "evo-004",
    category: "Evolução",
    title: "Superação de dificuldade",
    focus: "Aprendizagem",
    text: "O aluno demonstrou avanço em conteúdo anteriormente considerado difícil, indicando que as estratégias de retomada e prática contribuíram para sua aprendizagem.",
  },
  {
    id: "freq-001",
    category: "Frequência",
    title: "Faltas recorrentes",
    focus: "Assiduidade",
    text: "O aluno apresenta faltas recorrentes, o que pode prejudicar a continuidade da aprendizagem. Recomenda-se conversar com o aluno e, se necessário, acionar a família para compreender os motivos.",
  },
  {
    id: "freq-002",
    category: "Frequência",
    title: "Atrasos frequentes",
    focus: "Pontualidade",
    text: "Foram identificados atrasos frequentes. O aluno foi orientado sobre a importância da pontualidade como compromisso escolar e competência valorizada na vida profissional.",
  },
  {
    id: "freq-003",
    category: "Frequência",
    title: "Retorno após ausência",
    focus: "Acolhimento",
    text: "Após período de ausência, recomenda-se acolher o aluno, verificar conteúdos perdidos e propor estratégia de recomposição para evitar prejuízos no acompanhamento da turma.",
  },
  {
    id: "freq-004",
    category: "Frequência",
    title: "Boa assiduidade",
    focus: "Fortalecimento",
    text: "O aluno tem mantido boa assiduidade e pontualidade. Recomenda-se reconhecer positivamente esse compromisso e estimular a continuidade da postura responsável.",
  },
  {
    id: "soc-001",
    category: "Socioemocional",
    title: "Baixa confiança",
    focus: "Autoconfiança",
    text: "O aluno demonstra insegurança para participar, mesmo quando apresenta condições de contribuir. Recomenda-se estimular pequenas participações, acolher tentativas e reforçar avanços.",
  },
  {
    id: "soc-002",
    category: "Socioemocional",
    title: "Desmotivação",
    focus: "Engajamento",
    text: "Foram observados sinais de desmotivação nas atividades. Recomenda-se escuta individual, identificação de interesses do aluno e propostas que conectem o conteúdo à sua realidade.",
  },
  {
    id: "soc-003",
    category: "Socioemocional",
    title: "Ansiedade diante de avaliações",
    focus: "Acolhimento",
    text: "O aluno demonstra tensão diante de avaliações ou apresentações. Recomenda-se orientar estratégias de preparação, dividir tarefas em etapas e oferecer devolutivas encorajadoras.",
  },
  {
    id: "soc-004",
    category: "Socioemocional",
    title: "Boa relação com colegas",
    focus: "Vínculo",
    text: "O aluno apresenta boa relação com os colegas, contribuindo para um ambiente de aprendizagem mais colaborativo e respeitoso.",
  },
  {
    id: "inc-001",
    category: "Inclusão",
    title: "Adaptação de atividade",
    focus: "Acessibilidade pedagógica",
    text: "Recomenda-se adaptar a atividade com instruções mais claras, etapas menores e verificação de compreensão, garantindo que o aluno tenha condições de participar com autonomia progressiva.",
  },
  {
    id: "inc-002",
    category: "Inclusão",
    title: "Tempo ampliado",
    focus: "Ritmo de aprendizagem",
    text: "O aluno pode se beneficiar de tempo ampliado para conclusão das atividades, sem redução da expectativa de aprendizagem, respeitando seu ritmo e favorecendo melhor desempenho.",
  },
  {
    id: "inc-003",
    category: "Inclusão",
    title: "Mediação individual",
    focus: "Acompanhamento",
    text: "Sugere-se mediação individual durante momentos-chave da atividade, com perguntas orientadoras e apoio para organização do raciocínio.",
  },
  {
    id: "inc-004",
    category: "Inclusão",
    title: "Instruções objetivas",
    focus: "Compreensão",
    text: "Recomenda-se apresentar instruções objetivas, preferencialmente em tópicos, confirmando se o aluno compreendeu a tarefa antes de iniciar a execução.",
  },
  {
    id: "enc-001",
    category: "Encaminhamento",
    title: "Coordenação pedagógica",
    focus: "Acompanhamento institucional",
    text: "Sugere-se encaminhar o caso para acompanhamento da coordenação pedagógica, compartilhando registros de frequência, desempenho, observações e intervenções já realizadas.",
  },
  {
    id: "enc-002",
    category: "Encaminhamento",
    title: "Conselho de classe",
    focus: "Discussão coletiva",
    text: "Recomenda-se levar o caso para discussão em conselho de classe, buscando alinhar percepções dos professores e definir estratégias comuns de acompanhamento.",
  },
  {
    id: "enc-003",
    category: "Encaminhamento",
    title: "Escuta individual",
    focus: "Acolhimento",
    text: "Sugere-se realizar escuta individual com o aluno para compreender fatores que possam estar interferindo em sua participação, frequência ou desempenho.",
  },
  {
    id: "enc-004",
    category: "Encaminhamento",
    title: "Registro preventivo",
    focus: "Documentação",
    text: "Registro realizado de forma preventiva para acompanhar a evolução do aluno e subsidiar futuras devolutivas pedagógicas, caso sejam necessárias novas intervenções.",
  },
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function NewObservationForm({ studentId }: { studentId: string }) {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Pedagógica");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState("Todos");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = normalizeText(templateSearch);

    return observationTemplates.filter((template) => {
      if (
        selectedTemplateCategory !== "Todos" &&
        template.category !== selectedTemplateCategory
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = normalizeText(`
        ${template.category}
        ${template.title}
        ${template.focus}
        ${template.text}
      `);

      return searchableText.includes(normalizedSearch);
    });
  }, [templateSearch, selectedTemplateCategory]);

  function useTemplate(template: ObservationTemplate) {
    setCategory(template.category);
    setContent(template.text);
    setMessage(null);
  }

  function appendTemplate(template: ObservationTemplate) {
    setCategory(template.category);
    setContent((current) => {
      const cleanCurrent = current.trim();

      if (!cleanCurrent) {
        return template.text;
      }

      return `${cleanCurrent}\n\n${template.text}`;
    });
    setMessage(null);
  }

  async function handleCreateObservation() {
    setMessage(null);

    if (!content.trim()) {
      setMessage({
        type: "error",
        text: "Digite uma observação ou escolha uma sugestão antes de salvar.",
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("observations").insert({
      student_id: studentId,
      content: content.trim(),
      category,
    });

    setLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao salvar observação: ${error.message}`,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Observação salva com sucesso!",
    });

    setContent("");
    setCategory("Pedagógica");
    setTemplateSearch("");
    setSelectedTemplateCategory("Todos");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-[2rem] border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-violet-200">
            <Sparkles size={14} />
            Banco pedagógico de sugestões
          </p>

          <h2 className="text-2xl font-black text-white">Nova observação</h2>

          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
            Escreva manualmente ou escolha uma sugestão pronta de intervenção
            familiar, pedagógica, comportamental, socioemocional, inclusão,
            frequência e encaminhamento. Depois ajuste o texto conforme a
            realidade do aluno.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-300">
          <strong className="text-violet-200">{observationTemplates.length}</strong>{" "}
          sugestões disponíveis
        </div>
      </div>

      {message && (
        <div
          className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-red-500/30 bg-red-500/10 text-red-300"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Categoria do registro
            </label>

            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            >
              {observationCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-300">
              Filtrar sugestões
            </label>

            <select
              value={selectedTemplateCategory}
              onChange={(event) => setSelectedTemplateCategory(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            >
              <option value="Todos">Todas as categorias</option>
              {observationCategories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
            <Search size={18} className="text-slate-500" />

            <input
              value={templateSearch}
              onChange={(event) => setTemplateSearch(event.target.value)}
              placeholder="Buscar intervenção..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setContent("");
              setCategory("Pedagógica");
              setMessage(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <Eraser size={16} />
            Limpar texto
          </button>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-300">
            Observação manual ou adaptada
          </label>

          <textarea
            placeholder="Digite manualmente ou escolha uma sugestão pronta abaixo..."
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 leading-7 outline-none focus:border-violet-400"
          />

          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Revise sempre o texto antes de salvar para manter o registro fiel
              ao contexto do aluno.
            </p>

            <button
              type="button"
              onClick={handleCreateObservation}
              disabled={loading}
              className="rounded-2xl bg-violet-500 px-6 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              {loading ? "Salvando..." : "Salvar observação"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-black text-white">
            Sugestões prontas de intervenção
          </h3>

          <span className="text-sm text-slate-500">
            {filteredTemplates.length} resultado(s)
          </span>
        </div>

        {filteredTemplates.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-500">
            Nenhuma sugestão encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="grid max-h-[520px] gap-3 overflow-y-auto pr-1 xl:grid-cols-2">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/45 p-4 transition hover:border-violet-500/30 hover:bg-slate-950/70"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-200">
                        {template.category}
                      </span>

                      <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                        {template.focus}
                      </span>
                    </div>

                    <h4 className="mt-3 font-black text-white">
                      {template.title}
                    </h4>
                  </div>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {template.text}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => useTemplate(template)}
                    className="inline-flex items-center gap-2 rounded-xl bg-violet-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-violet-400"
                  >
                    <Wand2 size={14} />
                    Usar texto
                  </button>

                  <button
                    type="button"
                    onClick={() => appendTemplate(template)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                  >
                    <PlusCircle size={14} />
                    Adicionar ao texto
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
