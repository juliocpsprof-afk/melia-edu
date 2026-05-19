"use client";

import { useEffect, useState } from "react";
import { Bell, MessageCircle, BookOpen, Trophy, Users, CalendarCheck, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  icon: "message" | "activity" | "grade" | "draw" | "attendance";
};

const icons = {
  message: MessageCircle,
  activity: BookOpen,
  grade: Trophy,
  draw: Users,
  attendance: CalendarCheck,
};

export default function StudentRealtimeNotifications() {
  const [session, setSession] = useState<StudentSession | null>(null);
  const [notification, setNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const savedSession = sessionStorage.getItem("melia_student_session");

    if (!savedSession) return;

    setSession(JSON.parse(savedSession) as StudentSession);
  }, []);

  useEffect(() => {
    if (!session) return;

    function showNotification(item: NotificationItem) {
      setNotification(item);

      setTimeout(() => {
        setNotification(null);
      }, 6000);
    }

    const channel = supabase
      .channel(`student_global_notifications_${session.studentId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "student_messages",
          filter: `student_id=eq.${session.studentId}`,
        },
        () => {
          showNotification({
            id: crypto.randomUUID(),
            title: "Nova mensagem",
            description: "O professor enviou uma nova mensagem.",
            icon: "message",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "activities",
          filter: `class_id=eq.${session.classId}`,
        },
        () => {
          showNotification({
            id: crypto.randomUUID(),
            title: "Nova atividade",
            description: "Uma nova atividade foi criada para sua turma.",
            icon: "activity",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "grades",
          filter: `student_id=eq.${session.studentId}`,
        },
        () => {
          showNotification({
            id: crypto.randomUUID(),
            title: "Nova nota",
            description: "Uma nova nota foi lançada no seu portal.",
            icon: "grade",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "interaction_draw_results",
          filter: `student_id=eq.${session.studentId}`,
        },
        () => {
          showNotification({
            id: crypto.randomUUID(),
            title: "Novo sorteio",
            description: "Você apareceu em um novo sorteio ou equipe.",
            icon: "draw",
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance",
          filter: `student_id=eq.${session.studentId}`,
        },
        () => {
          showNotification({
            id: crypto.randomUUID(),
            title: "Frequência atualizada",
            description: "Sua frequência recebeu um novo registro.",
            icon: "attendance",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session]);

  if (!notification) return null;

  const Icon = icons[notification.icon];

  return (
    <div className="fixed right-5 top-5 z-[9999] w-[calc(100%-2.5rem)] max-w-sm animate-pulse rounded-[28px] border border-cyan-500/30 bg-slate-950/95 p-4 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur">
      <div className="flex gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20">
          <Icon className="h-6 w-6 text-cyan-300" />
        </div>

        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <Bell className="h-4 w-4 text-cyan-300" />
            <p className="text-sm font-black text-cyan-300">
              Melia EDU
            </p>
          </div>

          <h3 className="font-black text-white">
            {notification.title}
          </h3>

          <p className="mt-1 text-sm text-slate-300">
            {notification.description}
          </p>
        </div>

        <button
          onClick={() => setNotification(null)}
          className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}