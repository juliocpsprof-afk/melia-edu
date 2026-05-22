"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Home,
  MessageCircle,
  Trophy,
  BookOpen,
  Zap,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
  loggedAt: string;
};

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
    badge: "messages",
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

  const [studentId, setStudentId] = useState("");
  const [unreadMessages, setUnreadMessages] = useState(0);

  async function loadUnreadMessages(currentStudentId: string) {
    if (!currentStudentId) {
      setUnreadMessages(0);
      return;
    }

    const { count, error } = await supabase
      .from("student_messages")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("student_id", currentStudentId)
      .eq("sender", "teacher")
      .eq("is_read", false);

    if (error) {
      console.error("Erro ao carregar mensagens não lidas:", error.message);
      setUnreadMessages(0);
      return;
    }

    setUnreadMessages(count ?? 0);
  }

  useEffect(() => {
    const savedSession = sessionStorage.getItem("melia_student_session");

    if (!savedSession) {
      setStudentId("");
      setUnreadMessages(0);
      return;
    }

    try {
      const parsedSession = JSON.parse(savedSession) as StudentSession;

      if (!parsedSession.studentId) {
        setStudentId("");
        setUnreadMessages(0);
        return;
      }

      setStudentId(parsedSession.studentId);
      loadUnreadMessages(parsedSession.studentId);
    } catch (error) {
      console.error("Erro ao ler sessão do aluno:", error);
      setStudentId("");
      setUnreadMessages(0);
    }
  }, [pathname]);

  useEffect(() => {
    if (!studentId) {
      return;
    }

    const channel = supabase
      .channel(`student_mobile_nav_messages_${studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_messages",
          filter: `student_id=eq.${studentId}`,
        },
        () => {
          loadUnreadMessages(studentId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [studentId]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-800 bg-slate-950/95 px-2 py-2 backdrop-blur xl:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;

          const showMessageBadge =
            item.badge === "messages" && unreadMessages > 0;

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

              {showMessageBadge && (
                <div className="absolute right-3 top-2 z-20 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-black text-white shadow-lg shadow-red-500/30">
                  {unreadMessages > 99 ? "99+" : unreadMessages}
                </div>
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