"use client";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BookOpen,
  CheckCircle,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Users,
} from "lucide-react";

const menuItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
  label: "Entregas",
  href: "/dashboard/entregas",
  icon: CheckCircle,
  },
  {
    label: "Turmas",
    href: "/dashboard/turmas",
    icon: Users,
  },
  {
  label: "Alunos",
  href: "/dashboard/alunos",
  icon: Users,
},
  {
    label: "Atividades",
    href: "/dashboard/atividades",
    icon: BookOpen,
  },
  {
    label: "Frequência",
    href: "/dashboard/frequencia",
    icon: CalendarDays,
  },
  {
  label: "Notas",
  href: "/dashboard/notas",
  icon: ClipboardList,
  },
  {
    label: "Mensagens",
    href: "/dashboard/mensagens",
    icon: MessageSquare,
  },
  {
    label: "Alertas",
    href: "/dashboard/alertas",
    icon: Bell,
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
 const router = useRouter();

async function handleLogout() {
  await supabase.auth.signOut();

  router.push("/login");
}
  const pathname = usePathname();

  return (
    <main className="flex min-h-screen bg-[#020617] text-white">
      <aside className="hidden w-[290px] flex-col border-r border-slate-800 bg-slate-950/80 p-6 lg:flex">
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

        <nav className="mt-12 space-y-2">
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
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-slate-300 transition hover:bg-white/5">
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      <section className="flex-1">{children}</section>
    </main>
  );
}