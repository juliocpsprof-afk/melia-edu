"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  MessageCircle,
  Send,
  Smile,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

type StudentProfile = {
  id: string;
  name: string | null;
  class_id: string | null;
  class_name: string | null;
};

type Message = {
  id: string;
  student_id: string | null;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  sender: string;
  content: string;
  is_read: boolean | null;
  created_at: string;
};

const allowedEmojis = [
  "📚",
  "✏️",
  "📝",
  "💻",
  "🖥️",
  "📞",
  "🗂️",
  "📊",
  "✅",
  "👏",
  "🙌",
  "🚀",
  "⭐",
  "🎯",
  "🕒",
  "📌",
  "💡",
  "🤝",
  "🏆",
  "📈",
  "🔔",
  "😊",
];

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("pt-BR");
}

export default function StudentMessages() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [session, setSession] = useState<StudentSession | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(
    null
  );

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  async function loadMessages(parsedSession: StudentSession) {
    const [messagesResponse, studentResponse] = await Promise.all([
      supabase
        .from("student_messages")
        .select("*")
        .eq("student_id", parsedSession.studentId)
        .order("created_at", {
          ascending: true,
        }),

      supabase
        .from("students")
        .select("id, name, class_id, class_name")
        .eq("id", parsedSession.studentId)
        .single(),
    ]);

    if (messagesResponse.error) {
      console.error(
        "Erro ao carregar mensagens:",
        messagesResponse.error.message
      );
    }

    if (studentResponse.error) {
      console.error(
        "Erro ao carregar aluno:",
        studentResponse.error.message
      );
    }

    setMessages((messagesResponse.data || []) as Message[]);
    setStudentProfile((studentResponse.data as StudentProfile) ?? null);

    await supabase
      .from("student_messages")
      .update({
        is_read: true,
      })
      .eq("student_id", parsedSession.studentId)
      .eq("sender", "teacher")
      .eq("is_read", false);

    setLoading(false);
  }

  useEffect(() => {
    const savedSession = sessionStorage.getItem("melia_student_session");

    if (!savedSession) {
      router.push("/aluno");
      return;
    }

    const parsedSession = JSON.parse(savedSession) as StudentSession;

    setSession(parsedSession);
    loadMessages(parsedSession);
  }, [router]);

  useEffect(() => {
    if (!session?.studentId) {
      return;
    }

    const channel = supabase
      .channel(`student_messages_${session.studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_messages",
          filter: `student_id=eq.${session.studentId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;

          setMessages((current) => {
            const alreadyExists = current.some(
              (item) => item.id === newMessage.id
            );

            if (alreadyExists) {
              return current.map((item) =>
                item.id === newMessage.id ? newMessage : item
              );
            }

            return [...current, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.studentId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  function appendEmoji(emoji: string) {
    setText((current) => `${current}${emoji}`);
  }

  async function handleSendMessage() {
    if (!session || !text.trim()) {
      return;
    }

    setSending(true);

    const { error } = await supabase.from("student_messages").insert({
      student_id: session.studentId,
      student_name:
        studentProfile?.name || session.studentName || "Aluno",
      class_id: studentProfile?.class_id || session.classId || null,
      class_name: studentProfile?.class_name || null,
      sender: "student",
      content: text.trim(),
      is_read: false,
    });

    setSending(false);

    if (error) {
      console.error("Erro ao enviar mensagem:", error.message);
      return;
    }

    setText("");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Carregando mensagens...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-5">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-2xl font-black sm:text-3xl">
              Chat com o professor
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Envie dúvidas, confirme informações e acompanhe os recados do
              professor em tempo real.
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />

              <span className="text-sm font-medium">
                Online
              </span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-5 sm:px-5 sm:py-6">
        <div className="flex-1 space-y-4 overflow-y-auto pb-40">
          {messages.length === 0 ? (
            <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300 sm:rounded-[32px]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-cyan-500/10 text-cyan-300">
                <MessageCircle className="h-8 w-8" />
              </div>

              <h2 className="mt-5 text-2xl font-black text-white">
                Nenhuma mensagem ainda
              </h2>

              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
                Envie uma mensagem para o professor ou aguarde os recados
                enviados para você, sua turma ou toda a escola.
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isStudent = message.sender === "student";

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isStudent ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[88%] break-words rounded-[24px] px-4 py-3 shadow-lg sm:max-w-[80%] sm:rounded-[28px] sm:px-5 sm:py-4 ${
                      isStudent
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                        : "border border-slate-800 bg-slate-900 text-slate-100"
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold opacity-80">
                      {isStudent ? "Você" : "Professor"}
                    </p>

                    <p className="whitespace-pre-wrap text-sm leading-7 sm:text-base">
                      {message.content}
                    </p>

                    <p
                      className={`mt-2 text-right text-xs ${
                        isStudent ? "text-cyan-100" : "text-slate-500"
                      }`}
                    >
                      {formatDateTime(message.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur sm:px-5">
          <div className="mx-auto max-w-5xl">
            <EmojiBar onSelect={appendEmoji} />

            <div className="mt-3 flex items-end gap-3">
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="Digite sua mensagem..."
                rows={2}
                className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />

              <button
                onClick={handleSendMessage}
                disabled={sending || !text.trim()}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-cyan-500 text-white transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send size={22} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <StudentRealtimeNotifications />
    </main>
  );
}

function EmojiBar({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-3">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
        <Smile size={15} />
        Emojis rápidos
      </div>

      <div className="flex flex-wrap gap-2">
        {allowedEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-950 text-lg transition hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}