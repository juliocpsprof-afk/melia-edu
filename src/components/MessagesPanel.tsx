"use client";

import { useEffect, useMemo, useState } from "react";
import { Send, Search, MessageCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type StudentMessage = {
  id: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  sender: "student" | "teacher";
  content: string;
  is_read: boolean;
  created_at: string;
};

export function MessagesPanel() {
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reply, setReply] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);

  async function loadMessages() {
    const { data, error } = await supabase
      .from("student_messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (!error) {
      setMessages((data as StudentMessage[]) ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("student_messages_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const conversations = useMemo(() => {
    const map = new Map<string, StudentMessage[]>();

    messages.forEach((message) => {
      if (!map.has(message.student_id)) {
        map.set(message.student_id, []);
      }

      map.get(message.student_id)?.push(message);
    });

    return Array.from(map.entries())
      .map(([studentId, studentMessages]) => {
        const lastMessage = studentMessages[studentMessages.length - 1];

        const unreadCount = studentMessages.filter(
          (message) => message.sender === "student" && !message.is_read
        ).length;

        return {
          studentId,
          studentName: lastMessage.student_name,
          className: lastMessage.class_name,
          lastMessage,
          unreadCount,
          messages: studentMessages,
        };
      })
      .filter((conversation) => {
        const matchesSearch = conversation.studentName
          .toLowerCase()
          .includes(search.toLowerCase());

        const matchesFilter =
          filter === "all" || conversation.unreadCount > 0;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        return (
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
        );
      });
  }, [messages, search, filter]);

  const selectedConversation = conversations.find(
    (conversation) => conversation.studentId === selectedStudentId
  );

  async function markAsRead(studentId: string) {
    await supabase
      .from("student_messages")
      .update({ is_read: true })
      .eq("student_id", studentId)
      .eq("sender", "student")
      .eq("is_read", false);

    loadMessages();
  }

  async function handleSelectConversation(studentId: string) {
    setSelectedStudentId(studentId);
    await markAsRead(studentId);
  }

  async function handleSendReply() {
    if (!reply.trim() || !selectedConversation) return;

    const lastMessage = selectedConversation.lastMessage;

    const { error } = await supabase.from("student_messages").insert({
      student_id: selectedConversation.studentId,
      student_name: selectedConversation.studentName,
      class_id: lastMessage.class_id,
      class_name: lastMessage.class_name,
      sender: "teacher",
      content: reply.trim(),
      is_read: false,
    });

    if (!error) {
      setReply("");
      loadMessages();
    }
  }

  return (
    <div className="grid min-h-[650px] overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/40 xl:grid-cols-[380px_1fr]">
      <aside className="border-r border-slate-800">
        <div className="border-b border-slate-800 p-5">
          <h2 className="text-xl font-bold">Conversas</h2>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                filter === "all"
                  ? "bg-violet-500 text-white"
                  : "bg-slate-950 text-slate-300"
              }`}
            >
              Todas
            </button>

            <button
              onClick={() => setFilter("unread")}
              className={`rounded-xl px-4 py-2 text-sm font-semibold ${
                filter === "unread"
                  ? "bg-violet-500 text-white"
                  : "bg-slate-950 text-slate-300"
              }`}
            >
              Não lidas
            </button>
          </div>

          <div className="mt-4 flex h-11 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4">
            <Search size={18} className="text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar aluno..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="max-h-[520px] overflow-y-auto">
          {loading ? (
            <p className="p-5 text-slate-400">Carregando mensagens...</p>
          ) : conversations.length === 0 ? (
            <p className="p-5 text-slate-400">Nenhuma conversa encontrada.</p>
          ) : (
            conversations.map((conversation) => (
              <button
                key={conversation.studentId}
                onClick={() =>
                  handleSelectConversation(conversation.studentId)
                }
                className={`w-full border-b border-slate-800 p-5 text-left transition hover:bg-white/[0.03] ${
                  selectedStudentId === conversation.studentId
                    ? "bg-violet-500/10"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">
                      {conversation.studentName}
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {conversation.className ?? "Sem turma"}
                    </p>
                  </div>

                  {conversation.unreadCount > 0 && (
                    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-violet-500 px-2 text-xs font-bold">
                      {conversation.unreadCount}
                    </span>
                  )}
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-slate-400">
                  {conversation.lastMessage.content}
                </p>
              </button>
            ))
          )}
        </div>
      </aside>

      <div className="flex min-h-[650px] flex-col">
        {!selectedConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center text-slate-400">
            <MessageCircle size={46} />
            <p className="mt-4">Selecione uma conversa para responder.</p>
          </div>
        ) : (
          <>
            <div className="border-b border-slate-800 p-5">
              <h2 className="text-xl font-bold">
                {selectedConversation.studentName}
              </h2>
              <p className="text-sm text-slate-400">
                {selectedConversation.className ?? "Sem turma"}
              </p>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto bg-slate-950/30 p-6">
              {selectedConversation.messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "teacher"
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                      message.sender === "teacher"
                        ? "bg-violet-500 text-white"
                        : "bg-slate-800 text-slate-100"
                    }`}
                  >
                    <p>{message.content}</p>

                    <p className="mt-2 text-right text-[11px] opacity-70">
                      {new Date(message.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 p-5">
              <div className="flex gap-3">
                <input
                  value={reply}
                  onChange={(event) => setReply(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      handleSendReply();
                    }
                  }}
                  placeholder="Digite sua resposta..."
                  className="flex-1 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                />

                <button
                  onClick={handleSendReply}
                  className="flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400"
                >
                  <Send size={18} />
                  Enviar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}