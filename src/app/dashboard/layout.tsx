"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle,
  ClipboardList,
  GraduationCap,
  History,
  Layers3,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  NotebookPen,
  Sparkles,
  Users,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { ThemeToggle } from "@/components/theme-toggle";

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Diário", href: "/dashboard/diario", icon: NotebookPen },
  { label: "Entregas", href: "/dashboard/entregas", icon: CheckCircle },
  { label: "Turmas", href: "/dashboard/turmas", icon: Users },
  { label: "Cursos", href: "/dashboard/cursos", icon: Layers3 },
  { label: "Alunos", href: "/dashboard/alunos", icon: Users },
  { label: "Atividades", href: "/dashboard/atividades", icon: BookOpen },
  { label: "Frequência", href: "/dashboard/frequencia", icon: CalendarDays },
  {
    label: "Histórico de Frequência",
    href: "/dashboard/frequencia/historico",
    icon: History,
  },
  { label: "Notas", href: "/dashboard/notas", icon: ClipboardList },
  { label: "Mensagens", href: "/dashboard/mensagens", icon: MessageSquare },
  { label: "Interações", href: "/dashboard/interacoes", icon: Sparkles },
  { label: "Alertas", href: "/dashboard/alertas", icon: Bell },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen bg-[#020617] text-white">
      <aside className="hidden w-[290px] flex-col border-r border-slate-800 bg-[#020617] p-6 lg:flex">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
            <GraduationCap size={30} />
          </div>

          <div>
            <h1 className="text-2xl font-bold">
              Melia <span className="text-violet-400">EDU</span>
            </h1>
            <p className="text-sm text-slate-400">Painel do professor</p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950/80 p-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Tema
            </p>
            <p className="text-sm font-bold text-white">Visual</p>
          </div>

          <ThemeToggle />
        </div>

        <nav className="mt-8 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 rounded-2xl px-4 py-3 transition ${
                  active
                    ? "bg-violet-500 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                <Icon size={22} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      <section className="flex-1 bg-[#020617]">{children}</section>
    </main>
  );
}