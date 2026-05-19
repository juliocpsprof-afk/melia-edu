"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
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

export default function StudentMessages() {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [session, setSession] = useState<StudentSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    async function loadMessages() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;
      setSession(parsedSession);

      const { data, error } = await supabase
        .from("student_messages")
        .select("*")
        .eq("student_id", parsedSession.studentId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Erro ao carregar mensagens:", error.message);
      }

      setMessages((data || []) as Message[]);
      setLoading(false);
    }

    loadMessages();
  }, [router]);

  useEffect(() => {
    if (!session?.studentId) return;

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
            const alreadyExists = current.some((item) => item.id === newMessage.id);

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
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage() {
    if (!session || !text.trim()) return;

    setSending(true);

    const { error } = await supabase.from("student_messages").insert({
      student_id: session.studentId,
      student_name: session.studentName,
      class_id: session.classId,
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
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando mensagens...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col bg-slate-950 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div>
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-2xl font-black">
              Chat com o professor
            </h1>

            <p className="text-sm text-slate-400">
              Mensagens em tempo real
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-6">
        <div className="flex-1 space-y-4 overflow-y-auto pb-32">
          {messages.length === 0 ? (
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300">
              Nenhuma mensagem ainda. Envie a primeira mensagem para o professor.
            </div>
          ) : (
            messages.map((message) => {
              const isStudent = message.sender === "student";

              return (
                <div
                  key={message.id}
                  className={`flex ${isStudent ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-[28px] px-5 py-4 shadow-lg ${
                      isStudent
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 text-white"
                        : "border border-slate-800 bg-slate-900 text-slate-100"
                    }`}
                  >
                    <p className="mb-1 text-xs font-semibold opacity-80">
                      {isStudent ? "Você" : "Professor"}
                    </p>

                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </p>

                    <p className="mt-2 text-right text-[11px] opacity-70">
                      {new Date(message.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          <div ref={bottomRef} />
        </div>
      </section>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/90 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl gap-3">
          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleSendMessage();
              }
            }}
            placeholder="Digite sua mensagem..."
            className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4 text-white outline-none transition focus:border-cyan-400"
          />

          <button
            onClick={handleSendMessage}
            disabled={sending || !text.trim()}
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </footer>
    </main>
  );
}