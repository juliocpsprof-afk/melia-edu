import type { ReactNode } from "react";
import {
  BarChart3,
  Bell,
  Eye,
  GraduationCap,
  Lock,
  Mail,
  Monitor,
  UsersRound,
} from "lucide-react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#020617] px-6 py-8 text-white">
      <section className="mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[28px] border border-slate-700/70 bg-[#07111f]/90 shadow-2xl shadow-violet-950/40 lg:grid-cols-2">
          <aside className="relative hidden min-h-[720px] overflow-hidden px-16 py-14 lg:block">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_52%,rgba(124,58,237,0.38),transparent_34%),radial-gradient(circle_at_10%_0%,rgba(59,130,246,0.16),transparent_30%)]" />

            <div className="relative z-10">
              <div className="flex items-center gap-4">
                <GraduationCap className="text-violet-400" size={42} />
                <h1 className="text-3xl font-bold">
                  Melia <span className="text-violet-400">EDU</span>
                </h1>
              </div>

              <h2 className="mt-16 max-w-md text-5xl font-bold leading-tight">
                Gestão pedagógica{" "}
                <span className="text-violet-400">inteligente</span>
              </h2>

              <p className="mt-6 max-w-md text-lg leading-8 text-slate-300">
                A plataforma completa para professores acompanharem alunos,
                notas, frequência, atividades e muito mais.
              </p>

              <div className="mt-10 max-w-md space-y-4">
                <FeatureCard
                  icon={<UsersRound size={30} />}
                  title="Acompanhe seus alunos"
                  text="Visão completa do desempenho da turma"
                />

                <FeatureCard
                  icon={<BarChart3 size={30} />}
                  title="Dados e relatórios"
                  text="Indicadores pedagógicos em tempo real"
                />

                <FeatureCard
                  icon={<Bell size={30} />}
                  title="Alertas inteligentes"
                  text="Identifique alunos que precisam de atenção"
                />
              </div>
            </div>

            <div className="absolute -bottom-24 left-24 z-10 h-64 w-[520px] rotate-[-7deg] rounded-[26px] border border-violet-500/50 bg-[#0b1220]/90 p-6 shadow-2xl shadow-violet-500/20">
              <div className="mb-6 flex items-center justify-between">
                <span className="text-xs font-semibold text-violet-300">
                  Melia EDU
                </span>
                <div className="flex gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                  <span className="h-2 w-2 rounded-full bg-slate-600" />
                </div>
              </div>

              <div className="grid grid-cols-[1fr_2fr_1fr] gap-4">
                <div className="space-y-4 pt-4">
                  <div className="h-3 w-24 rounded bg-slate-700" />
                  <div className="h-3 w-32 rounded bg-violet-500" />
                  <div className="h-3 w-24 rounded bg-slate-700" />
                  <div className="h-3 w-20 rounded bg-slate-700" />
                </div>

                <div className="rounded-2xl bg-slate-800 p-5">
                  <div className="mb-8 h-3 w-32 rounded bg-slate-600" />
                  <div className="flex h-24 items-end gap-2">
                    <div className="h-8 flex-1 rounded bg-violet-500/40" />
                    <div className="h-14 flex-1 rounded bg-violet-500/70" />
                    <div className="h-10 flex-1 rounded bg-violet-500/50" />
                    <div className="h-20 flex-1 rounded bg-violet-500" />
                    <div className="h-16 flex-1 rounded bg-violet-500/70" />
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-800 p-5">
                  <div className="mx-auto mt-6 h-20 w-20 rounded-full border-[13px] border-violet-500 border-r-slate-700" />
                </div>
              </div>
            </div>
          </aside>

          <section className="flex min-h-[720px] items-center justify-center px-5 py-10 sm:px-10 lg:px-16">
            <div className="w-full max-w-[560px] rounded-[24px] border border-slate-700/70 bg-[#0b1424]/90 px-6 py-8 shadow-2xl shadow-black/30 sm:px-12 sm:py-14">
              <div className="text-center">
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Entrar no <span className="text-violet-400">Melia EDU</span>
                </h2>

                <p className="mt-4 text-slate-400">
                  Acesse sua conta para continuar
                </p>
              </div>

              <Divider label="ou" />

              <form className="space-y-6">
                <Field
                  label="E-mail"
                  icon={<Mail size={22} />}
                  type="email"
                  placeholder="seuemail@exemplo.com"
                />

                <Field
                  label="Senha"
                  icon={<Lock size={22} />}
                  type="password"
                  placeholder="Digite sua senha"
                  rightIcon={<Eye size={22} />}
                />

                <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:text-base">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-5 w-5 accent-violet-500"
                    />
                    Lembrar-me
                  </label>

                  <a href="#" className="font-medium text-violet-400">
                    Esqueceu sua senha?
                  </a>
                </div>

                <button
                  type="button"
                  className="h-14 w-full rounded-xl bg-violet-500 text-base font-semibold shadow-lg shadow-violet-500/25 transition hover:bg-violet-400"
                >
                  Entrar
                </button>
              </form>

              <Divider label="ou continue com" />

              <div className="grid gap-4 sm:grid-cols-2">
                <SocialButton label="Google" icon={<span>G</span>} />
                <SocialButton label="Microsoft" icon={<Monitor size={22} />} />
              </div>

              <p className="mt-8 text-center text-slate-400">
                Não tem uma conta?{" "}
                <a href="#" className="font-semibold text-violet-400">
                  Solicitar acesso
                </a>
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/[0.06] p-4 backdrop-blur">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
        {icon}
      </div>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm text-slate-300">{text}</p>
      </div>
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="my-8 flex items-center gap-4 text-sm text-slate-400">
      <div className="h-px flex-1 bg-slate-700" />
      <span>{label}</span>
      <div className="h-px flex-1 bg-slate-700" />
    </div>
  );
}

function Field({
  label,
  icon,
  rightIcon,
  type,
  placeholder,
}: {
  label: string;
  icon: ReactNode;
  rightIcon?: ReactNode;
  type: string;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-3 block font-semibold">{label}</label>
      <div className="flex h-14 items-center gap-4 rounded-xl border border-slate-600/80 bg-[#0b1424] px-5 transition focus-within:border-violet-400">
        <span className="text-slate-400">{icon}</span>
        <input
          type={type}
          placeholder={placeholder}
          className="w-full bg-transparent text-base text-white outline-none placeholder:text-slate-400"
        />
        {rightIcon && <span className="text-slate-400">{rightIcon}</span>}
      </div>
    </div>
  );
}

function SocialButton({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="flex h-14 items-center justify-center gap-3 rounded-xl border border-slate-700 bg-[#0b1424] font-semibold transition hover:bg-white/5">
      {icon}
      {label}
    </button>
  );
}