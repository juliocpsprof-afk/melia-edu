"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  CalendarCheck,
  Trophy,
  BookOpen,
  Bell,
  Users,
  Link2,
} from "lucide-react";

const menuItems = [
  { href: "/aluno/dashboard", icon: Home, label: "Início" },
  { href: "/aluno/mensagens", icon: MessageCircle, label: "Mensagens" },
  { href: "/aluno/frequencia", icon: CalendarCheck, label: "Frequência" },
  { href: "/aluno/notas", icon: Trophy, label: "Notas" },
  { href: "/aluno/atividades", icon: BookOpen, label: "Atividades" },
  { href: "/aluno/sorteios", icon: Users, label: "Sorteios" },
  { href: "/aluno/botoes", icon: Link2, label: "Links" },
  { href: "/aluno/notificacoes", icon: Bell, label: "Avisos" },
];

export default function StudentSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-950/70 backdrop-blur xl:flex">
      <div className="border-b border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-cyan-400 to-blue-600 text-2xl font-black text-white shadow-lg shadow-cyan-500/20">
            M
          </div>

          <div>
            <p className="text-sm text-cyan-300">Portal do Aluno</p>
            <h1 className="text-xl font-bold text-white">Melia EDU</h1>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex w-full items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                  active
                    ? "border-cyan-500/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/10"
                    : "border-transparent hover:border-cyan-500/30 hover:bg-slate-900 hover:shadow-lg hover:shadow-cyan-500/10"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                    active ? "bg-cyan-500/20" : "bg-slate-900 group-hover:bg-cyan-500/20"
                  }`}
                >
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>

                <div>
                  <p className="font-semibold text-white">{item.label}</p>
                  <p className="text-xs text-slate-400">
                    {active ? "Você está aqui" : "Acessar módulo"}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-slate-800 p-5">
        <div className="rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 p-5">
          <p className="text-sm font-medium text-cyan-300">Seu progresso</p>
          <h2 className="mt-2 text-3xl font-black text-white">Em evolução</h2>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full w-[65%] rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" />
          </div>

          <p className="mt-3 text-xs text-slate-300">
            Continue acessando seu portal.
          </p>
        </div>
      </div>
    </aside>
  );
}