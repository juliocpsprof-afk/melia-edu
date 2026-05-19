"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Trophy,
  BookOpen,
  Zap,
} from "lucide-react";

const items = [
  {
    href: "/aluno/dashboard",
    icon: Home,
    label: "Início",
  },
  {
    href: "/aluno/mensagens",
    icon: MessageCircle,
    label: "Chat",
  },
  {
    href: "/aluno/atividades",
    icon: BookOpen,
    label: "Tarefas",
  },
  {
    href: "/aluno/notas",
    icon: Trophy,
    label: "Notas",
  },
  {
    href: "/aluno/gamificacao",
    icon: Zap,
    label: "XP",
  },
];

export default function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur xl:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex flex-col items-center justify-center overflow-hidden rounded-3xl px-2 py-3 transition-all duration-300 ${
                active
                  ? "bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-cyan-300 shadow-lg shadow-cyan-500/10"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              {active && (
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10" />
              )}

              <div className="relative z-10">
                <Icon
                  className={`h-5 w-5 transition-transform duration-300 ${
                    active ? "scale-110" : "group-hover:scale-105"
                  }`}
                />
              </div>

              <span
                className={`relative z-10 mt-1 text-[11px] font-semibold transition ${
                  active ? "text-cyan-300" : ""
                }`}
              >
                {item.label}
              </span>

              {active && (
                <div className="relative z-10 mt-2 h-1 w-8 rounded-full bg-cyan-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}