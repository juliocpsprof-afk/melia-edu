import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarCheck,
  GraduationCap,
  LayoutDashboard,
  MessageCircle,
  ShieldCheck,
  Shuffle,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { DashboardPreview } from "../components/DashboardPreview";
import { HeroSection } from "../components/HeroSection";
import { Navbar } from "../components/Navbar";

const resources = [
  {
    title: "Diário inteligente",
    description:
      "Registre aulas, conteúdos ministrados e observações pedagógicas de forma organizada.",
    icon: BookOpen,
  },
  {
    title: "Frequência e acompanhamento",
    description:
      "Controle presenças, faltas, atrasos e acompanhe indicadores importantes dos alunos.",
    icon: CalendarCheck,
  },
  {
    title: "Notas e entregas",
    description:
      "Organize atividades, correções, notas, feedbacks e pendências por turma.",
    icon: Trophy,
  },
  {
    title: "Interações e sorteios",
    description:
      "Monte equipes, sorteie alunos e crie dinâmicas mais participativas em sala.",
    icon: Shuffle,
  },
  {
    title: "Mensagens",
    description:
      "Facilite a comunicação entre professor e aluno dentro de um ambiente seguro.",
    icon: MessageCircle,
  },
  {
    title: "Gamificação",
    description:
      "Use XP, conquistas e metas para estimular participação, presença e evolução.",
    icon: Sparkles,
  },
];

const platformItems = [
  {
    title: "Portal do professor",
    description:
      "Um painel completo para gerenciar turmas, alunos, diário, frequência, atividades, notas, mensagens e interações.",
    icon: LayoutDashboard,
  },
  {
    title: "Portal do aluno",
    description:
      "Um espaço simples e moderno para o aluno acompanhar notas, frequência, atividades, mensagens, links e gamificação.",
    icon: GraduationCap,
  },
  {
    title: "Rotina escolar integrada",
    description:
      "O Melia EDU conecta registros pedagógicos, acompanhamento individual e participação em sala em uma única plataforma.",
    icon: Brain,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <section className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-6 pb-10 pt-7 lg:grid-cols-2 lg:gap-12 lg:pb-14 lg:pt-10">
        <div>
          <HeroSection />

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href="/aluno"
              className="group rounded-3xl border border-violet-400/30 bg-violet-500/15 p-5 transition hover:-translate-y-1 hover:border-violet-300 hover:bg-violet-500/25"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500 text-white shadow-lg shadow-violet-500/30">
                <GraduationCap size={26} />
              </div>

              <h2 className="text-xl font-bold">Sou aluno</h2>

              <p className="mt-2 text-sm text-slate-300">
                Acesse atividades, notas, mensagens, frequência, XP e entregas.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-300 group-hover:text-white">
                Entrar como aluno
                <ArrowRight size={16} />
              </span>
            </Link>

            <Link
              href="/login"
              className="group rounded-3xl border border-cyan-400/30 bg-cyan-500/10 p-5 transition hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-500/20"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/30">
                <ShieldCheck size={26} />
              </div>

              <h2 className="text-xl font-bold">Sou professor</h2>

              <p className="mt-2 text-sm text-slate-300">
                Gerencie turmas, alunos, diário, notas, frequência e interações.
              </p>

              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 group-hover:text-white">
                Entrar como professor
                <ArrowRight size={16} />
              </span>
            </Link>
          </div>

          <div className="mt-5 rounded-3xl border border-violet-400/20 bg-white/5 p-4 backdrop-blur-xl">
            <p className="text-xs uppercase tracking-[0.25em] text-violet-300">
              Criado por
            </p>

            <p className="mt-2 text-lg font-bold text-white">
              Professor Julio Cezar Pires
            </p>

            <p className="mt-1 text-sm text-slate-300">
              Analista de Sistemas, educador e idealizador do Melia EDU.
            </p>
          </div>
        </div>

        <DashboardPreview />
      </section>

      <section
        id="recursos"
        className="border-t border-white/10 bg-slate-900/30 px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">
              Recursos
            </p>

            <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
              Ferramentas para acompanhar a aprendizagem de verdade.
            </h2>

            <p className="mt-4 text-slate-300">
              O Melia EDU foi pensado para apoiar a rotina do professor,
              organizar informações importantes e dar mais clareza ao
              desenvolvimento dos alunos.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {resources.map((resource) => {
              const Icon = resource.icon;

              return (
                <div
                  key={resource.title}
                  className="rounded-3xl border border-slate-800 bg-slate-950/50 p-6 transition hover:-translate-y-1 hover:border-violet-400/40 hover:bg-slate-900"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 text-xl font-bold text-white">
                    {resource.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {resource.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="plataforma" className="px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
                Plataforma
              </p>

              <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
                Um sistema para professor e aluno caminharem juntos.
              </h2>

              <p className="mt-4 leading-7 text-slate-300">
                A plataforma conecta o trabalho do professor ao acompanhamento
                do aluno. O professor registra, organiza e acompanha. O aluno
                acessa, participa e visualiza sua própria evolução.
              </p>
            </div>

            <div className="grid gap-4">
              {platformItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="rounded-3xl border border-slate-800 bg-slate-900/50 p-6"
                  >
                    <div className="flex gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
                        <Icon size={24} />
                      </div>

                      <div>
                        <h3 className="text-xl font-bold text-white">
                          {item.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section
        id="sobre"
        className="border-t border-white/10 bg-slate-900/30 px-6 py-16"
      >
        <div className="mx-auto max-w-7xl">
          <div className="rounded-[36px] border border-violet-400/20 bg-gradient-to-br from-violet-500/15 via-slate-950 to-cyan-500/10 p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-violet-300">
                  Sobre
                </p>

                <h2 className="mt-3 text-3xl font-black text-white md:text-4xl">
                  Criado por professor, para resolver problemas reais da rotina
                  escolar.
                </h2>
              </div>

              <div className="space-y-4 text-sm leading-7 text-slate-300 md:text-base">
                <p>
                  O Melia EDU nasceu da prática educacional e da necessidade de
                  acompanhar alunos com mais organização, sensibilidade e dados
                  claros. A proposta é reunir em um só lugar o que normalmente
                  fica espalhado: frequência, notas, atividades, diário,
                  mensagens, participação e evolução.
                </p>

                <p>
                  O projeto foi idealizado pelo Professor Julio Cezar Pires,
                  Analista de Sistemas, com foco em criar uma ferramenta simples,
                  moderna e útil para professores que desejam tomar decisões
                  pedagógicas com mais segurança.
                </p>

                <p>
                  Mais do que um painel administrativo, o Melia EDU busca
                  fortalecer o vínculo entre professor e aluno, dando visibilidade
                  ao processo de aprendizagem e incentivando autonomia,
                  compromisso e participação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}