"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  MessageCircle,
  Trophy,
  BookOpen,
  Users,
} from "lucide-react";

const items = [
  { href: "/aluno/dashboard", icon: Home, label: "Início" },
  { href: "/aluno/mensagens", icon: MessageCircle, label: "Chat" },
  { href: "/aluno/atividades", icon: BookOpen, label: "Tarefas" },
  { href: "/aluno/notas", icon: Trophy, label: "Notas" },
  { href: "/aluno/sorteios", icon: Users, label: "Equipes" },
];

export default function StudentMobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur xl:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 transition ${
                active
                  ? "bg-cyan-500/20 text-cyan-300"
                  : "text-slate-400 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="mt-1 text-[11px] font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}