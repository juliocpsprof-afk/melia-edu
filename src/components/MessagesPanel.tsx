"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MessageCircle,
  Search,
  Send,
  UserRound,
} from "lucide-react";

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
  const [messages, setMessages] = useState<
    StudentMessage[]
  >([]);

  const [selectedStudentId, setSelectedStudentId] =
    useState("");

  const [reply, setReply] = useState("");

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<
    "all" | "unread"
  >("all");

  const [loading, setLoading] = useState(true);

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null);

  async function loadMessages() {
    const { data } = await supabase
      .from("student_messages")
      .select("*")
      .order("created_at", {
        ascending: true,
      });

    setMessages(
      (data as StudentMessage[]) ?? []
    );

    setLoading(false);
  }

  useEffect(() => {
    loadMessages();

    const channel = supabase
      .channel("messages-realtime")
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [selectedStudentId, messages]);

  const conversations = useMemo(() => {
    const map = new Map<
      string,
      StudentMessage[]
    >();

    messages.forEach((message) => {
      if (!map.has(message.student_id)) {
        map.set(message.student_id, []);
      }

      map
        .get(message.student_id)
        ?.push(message);
    });

    return Array.from(map.entries())
      .map(([studentId, items]) => {
        const lastMessage =
          items[items.length - 1];

        const unreadCount = items.filter(
          (message) =>
            message.sender === "student" &&
            !message.is_read
        ).length;

        return {
          studentId,
          studentName:
            lastMessage.student_name,
          className:
            lastMessage.class_name,
          unreadCount,
          lastMessage,
          messages: items,
        };
      })
      .filter((conversation) => {
        const matchesSearch =
          conversation.studentName
            .toLowerCase()
            .includes(
              search.toLowerCase()
            );

        const matchesFilter =
          filter === "all" ||
          conversation.unreadCount > 0;

        return (
          matchesSearch &&
          matchesFilter
        );
      })
      .sort((a, b) => {
        return (
          new Date(
            b.lastMessage.created_at
          ).getTime() -
          new Date(
            a.lastMessage.created_at
          ).getTime()
        );
      });
  }, [messages, search, filter]);

  const selectedConversation =
    conversations.find(
      (conversation) =>
        conversation.studentId ===
        selectedStudentId
    );

  async function markAsRead(
    studentId: string
  ) {
    await supabase
      .from("student_messages")
      .update({
        is_read: true,
      })
      .eq("student_id", studentId)
      .eq("sender", "student")
      .eq("is_read", false);

    loadMessages();
  }

  async function handleSelectConversation(
    studentId: string
  ) {
    setSelectedStudentId(studentId);

    await markAsRead(studentId);
  }

  async function handleSendReply() {
    if (
      !reply.trim() ||
      !selectedConversation
    ) {
      return;
    }

    const lastMessage =
      selectedConversation.lastMessage;

    const { error } = await supabase
      .from("student_messages")
      .insert({
        student_id:
          selectedConversation.studentId,

        student_name:
          selectedConversation.studentName,

        class_id:
          lastMessage.class_id,

        class_name:
          lastMessage.class_name,

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
    <div className="grid min-h-[720px] overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/40 lg:grid-cols-[340px_1fr]">
      <aside className="border-r border-slate-800 bg-slate-950/60">
        <div className="border-b border-slate-800 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
              <MessageCircle size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-white">
                Conversas
              </h2>

              <p className="text-sm text-slate-400">
                {conversations.length} chats
              </p>
            </div>
          </div>

          <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
            <Search
              size={18}
              className="text-slate-500"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Pesquisar aluno..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() =>
                setFilter("all")
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Todas
            </button>

            <button
              onClick={() =>
                setFilter("unread")
              }
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                filter === "unread"
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              Não lidas
            </button>
          </div>
        </div>

        <div className="max-h-[620px] overflow-y-auto p-3">
          {loading ? (
            <div className="p-5 text-slate-400">
              Carregando mensagens...
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-5 text-slate-500">
              Nenhuma conversa encontrada.
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map(
                (conversation) => {
                  const isActive =
                    selectedStudentId ===
                    conversation.studentId;

                  return (
                    <button
                      key={
                        conversation.studentId
                      }
                      onClick={() =>
                        handleSelectConversation(
                          conversation.studentId
                        )
                      }
                      className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition ${
                        isActive
                          ? "bg-blue-500/15 border border-blue-500/20"
                          : "border border-transparent hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
                        <UserRound
                          size={20}
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate font-semibold text-white">
                              {
                                conversation.studentName
                              }
                            </p>

                            <p className="text-xs text-slate-500">
                              {
                                conversation.className
                              }
                            </p>
                          </div>

                          {conversation.unreadCount >
                            0 && (
                            <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-white">
                              {
                                conversation.unreadCount
                              }
                            </div>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                          {
                            conversation
                              .lastMessage
                              .content
                          }
                        </p>
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      </aside>

      <main className="flex flex-col bg-slate-950/30">
        {!selectedConversation ? (
          <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-[32px] bg-blue-500/10 text-blue-400">
              <MessageCircle size={42} />
            </div>

            <h2 className="mt-6 text-2xl font-bold text-white">
              Nenhuma conversa selecionada
            </h2>

            <p className="mt-2 max-w-md text-slate-400">
              Escolha uma conversa ao lado
              para visualizar e responder
              mensagens dos alunos.
            </p>
          </div>
        ) : (
          <>
            <header className="flex items-center justify-between border-b border-slate-800 bg-slate-950/50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                  <UserRound size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-white">
                    {
                      selectedConversation.studentName
                    }
                  </h2>

                  <p className="text-sm text-slate-400">
                    {
                      selectedConversation.className
                    }
                  </p>
                </div>
              </div>

              <div className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                Conversa ativa
              </div>
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
              {selectedConversation.messages.map(
                (message) => {
                  const isTeacher =
                    message.sender ===
                    "teacher";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isTeacher
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[78%] rounded-[26px] px-5 py-4 shadow-lg ${
                          isTeacher
                            ? "bg-blue-500 text-white"
                            : "border border-slate-800 bg-slate-900 text-slate-200"
                        }`}
                      >
                        <p className="whitespace-pre-wrap leading-7">
                          {
                            message.content
                          }
                        </p>

                        <p
                          className={`mt-2 text-right text-xs ${
                            isTeacher
                              ? "text-blue-100"
                              : "text-slate-500"
                          }`}
                        >
                          {new Date(
                            message.created_at
                          ).toLocaleString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>
                  );
                }
              )}

              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-end gap-3">
                <textarea
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  placeholder="Digite sua resposta..."
                  rows={2}
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none focus:border-blue-400"
                />

                <button
                  onClick={
                    handleSendReply
                  }
                  className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white transition hover:bg-blue-400"
                >
                  <Send size={22} />
                </button>
              </div>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}