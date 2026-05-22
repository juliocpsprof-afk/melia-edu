"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle,
  Megaphone,
  MessageCircle,
  School,
  Search,
  Send,
  Smile,
  UserRound,
  Users,
  XCircle,
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

type Student = {
  id: string;
  name: string;
  class_id: string | null;
  class_name: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

type SendMode = "student" | "class" | "all";

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getStudentInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "A";
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("pt-BR");
}

export function MessagesPanel() {
  const [messages, setMessages] = useState<StudentMessage[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [reply, setReply] = useState("");

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const [sendMode, setSendMode] = useState<SendMode>("student");
  const [studentSearch, setStudentSearch] = useState("");
  const [targetStudentId, setTargetStudentId] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [newMessage, setNewMessage] = useState("");

  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingNewMessage, setSendingNewMessage] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  async function loadData() {
    const [messagesResponse, studentsResponse, classesResponse] =
      await Promise.all([
        supabase
          .from("student_messages")
          .select("*")
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("students")
          .select("id, name, class_id, class_name")
          .order("name", {
            ascending: true,
          }),

        supabase
          .from("classes")
          .select("id, name")
          .neq("status", "Arquivada")
          .order("name", {
            ascending: true,
          }),
      ]);

    if (messagesResponse.error) {
      console.error("Erro ao carregar mensagens:", messagesResponse.error);
    }

    if (studentsResponse.error) {
      console.error("Erro ao carregar alunos:", studentsResponse.error);
    }

    if (classesResponse.error) {
      console.error("Erro ao carregar turmas:", classesResponse.error);
    }

    setMessages((messagesResponse.data as StudentMessage[]) ?? []);
    setStudents((studentsResponse.data as Student[]) ?? []);
    setClasses((classesResponse.data as ClassItem[]) ?? []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();

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
          loadData();
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

  const allConversations = useMemo(() => {
    const map = new Map<string, StudentMessage[]>();

    messages.forEach((message) => {
      if (!map.has(message.student_id)) {
        map.set(message.student_id, []);
      }

      map.get(message.student_id)?.push(message);
    });

    return Array.from(map.entries())
      .map(([studentId, items]) => {
        const lastMessage = items[items.length - 1];

        const unreadCount = items.filter(
          (message) => message.sender === "student" && !message.is_read
        ).length;

        return {
          studentId,
          studentName: lastMessage.student_name,
          classId: lastMessage.class_id,
          className: lastMessage.class_name,
          unreadCount,
          lastMessage,
          messages: items,
        };
      })
      .sort((a, b) => {
        return (
          new Date(b.lastMessage.created_at).getTime() -
          new Date(a.lastMessage.created_at).getTime()
        );
      });
  }, [messages]);

  const conversations = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return allConversations.filter((conversation) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeText(`
          ${conversation.studentName}
          ${conversation.className ?? ""}
          ${conversation.lastMessage.content}
        `).includes(normalizedSearch);

      const matchesFilter = filter === "all" || conversation.unreadCount > 0;

      return matchesSearch && matchesFilter;
    });
  }, [allConversations, search, filter]);

  const selectedConversation = allConversations.find(
    (conversation) => conversation.studentId === selectedStudentId
  );

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(studentSearch);

    if (!normalizedSearch) {
      return students.slice(0, 12);
    }

    return students
      .filter((student) =>
        normalizeText(`
          ${student.name}
          ${student.class_name ?? ""}
        `).includes(normalizedSearch)
      )
      .slice(0, 12);
  }, [students, studentSearch]);

  const selectedTargetStudent = students.find(
    (student) => student.id === targetStudentId
  );

  const selectedTargetClass = classes.find(
    (classItem) => classItem.id === targetClassId
  );

  const classRecipients = useMemo(() => {
    if (!targetClassId) {
      return [];
    }

    return students.filter((student) => student.class_id === targetClassId);
  }, [students, targetClassId]);

  const totalRecipients =
    sendMode === "student"
      ? selectedTargetStudent
        ? 1
        : 0
      : sendMode === "class"
      ? classRecipients.length
      : students.length;

  function appendEmojiToNewMessage(emoji: string) {
    setNewMessage((current) => `${current}${emoji}`);
  }

  function appendEmojiToReply(emoji: string) {
    setReply((current) => `${current}${emoji}`);
  }

  function resetNewMessageForm() {
    setNewMessage("");
    setStudentSearch("");
    setTargetStudentId("");
    setTargetClassId("");
  }

  function getRecipients() {
    if (sendMode === "student") {
      return selectedTargetStudent ? [selectedTargetStudent] : [];
    }

    if (sendMode === "class") {
      return classRecipients;
    }

    return students;
  }

  async function markAsRead(studentId: string) {
    await supabase
      .from("student_messages")
      .update({
        is_read: true,
      })
      .eq("student_id", studentId)
      .eq("sender", "student")
      .eq("is_read", false);

    loadData();
  }

  async function handleSelectConversation(studentId: string) {
    setSelectedStudentId(studentId);
    await markAsRead(studentId);
  }

  async function handleSendNewMessage() {
    setFeedback(null);

    if (!newMessage.trim()) {
      setFeedback({
        type: "error",
        text: "Digite a mensagem antes de enviar.",
      });

      return;
    }

    const recipients = getRecipients();

    if (recipients.length === 0) {
      setFeedback({
        type: "error",
        text:
          sendMode === "student"
            ? "Selecione um aluno para enviar a mensagem."
            : sendMode === "class"
            ? "Selecione uma turma com alunos vinculados."
            : "Nenhum aluno encontrado para envio geral.",
      });

      return;
    }

    setSendingNewMessage(true);

    const rows = recipients.map((student) => ({
      student_id: student.id,
      student_name: student.name,
      class_id: student.class_id,
      class_name: student.class_name,
      sender: "teacher",
      content: newMessage.trim(),
      is_read: false,
    }));

    const { error } = await supabase.from("student_messages").insert(rows);

    setSendingNewMessage(false);

    if (error) {
      setFeedback({
        type: "error",
        text: `Erro ao enviar mensagem: ${error.message}`,
      });

      return;
    }

    setFeedback({
      type: "success",
      text:
        recipients.length === 1
          ? "Mensagem enviada para o aluno."
          : `Mensagem enviada para ${recipients.length} aluno(s).`,
    });

    if (sendMode === "student" && recipients[0]) {
      setSelectedStudentId(recipients[0].id);
    }

    resetNewMessageForm();
    loadData();
  }

  async function handleSendReply() {
    setFeedback(null);

    if (!reply.trim() || !selectedConversation) {
      return;
    }

    setSendingReply(true);

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

    setSendingReply(false);

    if (error) {
      setFeedback({
        type: "error",
        text: `Erro ao responder mensagem: ${error.message}`,
      });

      return;
    }

    setReply("");
    loadData();
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
                <Megaphone size={24} />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white">
                  Nova mensagem
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Envie mensagens individuais, por turma ou para toda a escola.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-blue-500/10 px-4 py-3 text-sm font-semibold text-blue-300">
            {totalRecipients} destinatário(s)
          </div>
        </div>

        {feedback && (
          <div
            className={`mt-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              feedback.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {feedback.type === "success" ? (
              <CheckCircle size={18} />
            ) : (
              <XCircle size={18} />
            )}

            {feedback.text}
          </div>
        )}

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setSendMode("student");
              setFeedback(null);
            }}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              sendMode === "student"
                ? "border-blue-400/50 bg-blue-500/15 text-blue-200"
                : "border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            <UserRound size={22} />
            <p className="mt-3 font-bold">Aluno específico</p>
            <p className="mt-1 text-xs opacity-80">Pesquisar e enviar direto.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setSendMode("class");
              setFeedback(null);
            }}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              sendMode === "class"
                ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200"
                : "border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            <Users size={22} />
            <p className="mt-3 font-bold">Turma</p>
            <p className="mt-1 text-xs opacity-80">Enviar para todos da turma.</p>
          </button>

          <button
            type="button"
            onClick={() => {
              setSendMode("all");
              setFeedback(null);
            }}
            className={`rounded-2xl border px-4 py-4 text-left transition ${
              sendMode === "all"
                ? "border-violet-400/50 bg-violet-500/15 text-violet-200"
                : "border-slate-800 bg-slate-950/50 text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            <School size={22} />
            <p className="mt-3 font-bold">Todos os alunos</p>
            <p className="mt-1 text-xs opacity-80">Enviar para toda a escola.</p>
          </button>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[360px_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-4">
            {sendMode === "student" && (
              <>
                <label className="text-sm font-semibold text-slate-300">
                  Pesquisar aluno
                </label>

                <div className="mt-3 flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
                  <Search size={17} className="text-slate-500" />

                  <input
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Digite o nome do aluno..."
                    className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                  />
                </div>

                <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
                  {filteredStudents.length === 0 ? (
                    <p className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                      Nenhum aluno encontrado.
                    </p>
                  ) : (
                    filteredStudents.map((student) => {
                      const active = targetStudentId === student.id;

                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => setTargetStudentId(student.id)}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            active
                              ? "border-blue-400/40 bg-blue-500/15"
                              : "border-slate-800 bg-slate-900/50 hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-sm font-black text-white">
                            {getStudentInitial(student.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">
                              {student.name}
                            </p>

                            <p className="truncate text-xs text-slate-500">
                              {student.class_name || "Sem turma"}
                            </p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {sendMode === "class" && (
              <>
                <label className="text-sm font-semibold text-slate-300">
                  Selecionar turma
                </label>

                <select
                  value={targetClassId}
                  onChange={(event) => setTargetClassId(event.target.value)}
                  className="mt-3 h-12 w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-emerald-400"
                >
                  <option value="">Escolha uma turma</option>

                  {classes.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>

                <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                  {selectedTargetClass
                    ? `${selectedTargetClass.name}: ${classRecipients.length} aluno(s) receberão a mensagem.`
                    : "Selecione uma turma para ver a quantidade de alunos."}
                </div>
              </>
            )}

            {sendMode === "all" && (
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4 text-sm text-violet-200">
                Esta mensagem será enviada individualmente para todos os alunos
                cadastrados na escola.
                <strong className="mt-3 block text-lg text-white">
                  {students.length} aluno(s)
                </strong>
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-4">
            <label className="text-sm font-semibold text-slate-300">
              Mensagem
            </label>

            <textarea
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder="Digite a mensagem que será enviada..."
              rows={5}
              className="mt-3 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none placeholder:text-slate-500 focus:border-blue-400"
            />

            <EmojiBar onSelect={appendEmojiToNewMessage} />

            <button
              type="button"
              onClick={handleSendNewMessage}
              disabled={sendingNewMessage}
              className="mt-4 flex h-12 items-center justify-center gap-2 rounded-2xl bg-blue-500 px-6 text-sm font-bold text-white transition hover:bg-blue-400 disabled:opacity-50"
            >
              <Send size={18} />
              {sendingNewMessage
                ? "Enviando..."
                : totalRecipients > 1
                ? `Enviar para ${totalRecipients} alunos`
                : "Enviar mensagem"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-h-[720px] overflow-hidden rounded-[32px] border border-slate-800 bg-slate-900/40 lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-950/60">
          <div className="border-b border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">
                <MessageCircle size={22} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">Conversas</h2>

                <p className="text-sm text-slate-400">
                  {conversations.length} chats
                </p>
              </div>
            </div>

            <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4">
              <Search size={18} className="text-slate-500" />

              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Pesquisar aluno..."
                className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
                  filter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-900 text-slate-300 hover:bg-slate-800"
                }`}
              >
                Todas
              </button>

              <button
                onClick={() => setFilter("unread")}
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
                {conversations.map((conversation) => {
                  const isActive =
                    selectedStudentId === conversation.studentId;

                  return (
                    <button
                      key={conversation.studentId}
                      onClick={() =>
                        handleSelectConversation(conversation.studentId)
                      }
                      className={`flex w-full items-start gap-3 rounded-2xl p-4 text-left transition ${
                        isActive
                          ? "border border-blue-500/20 bg-blue-500/15"
                          : "border border-transparent hover:bg-slate-800/70"
                      }`}
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
                        <UserRound size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="truncate font-semibold text-white">
                              {conversation.studentName}
                            </p>

                            <p className="text-xs text-slate-500">
                              {conversation.className}
                            </p>
                          </div>

                          {conversation.unreadCount > 0 && (
                            <div className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-emerald-500 px-2 text-xs font-bold text-white">
                              {conversation.unreadCount}
                            </div>
                          )}
                        </div>

                        <p className="mt-2 line-clamp-2 text-sm text-slate-400">
                          {conversation.lastMessage.content}
                        </p>
                      </div>
                    </button>
                  );
                })}
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
                Escolha uma conversa ao lado ou envie uma nova mensagem para
                iniciar um atendimento.
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
                      {selectedConversation.studentName}
                    </h2>

                    <p className="text-sm text-slate-400">
                      {selectedConversation.className}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
                  Conversa ativa
                </div>
              </header>

              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
                {selectedConversation.messages.map((message) => {
                  const isTeacher = message.sender === "teacher";

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isTeacher ? "justify-end" : "justify-start"
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
                          {message.content}
                        </p>

                        <p
                          className={`mt-2 text-right text-xs ${
                            isTeacher ? "text-blue-100" : "text-slate-500"
                          }`}
                        >
                          {formatDateTime(message.created_at)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                <div ref={messagesEndRef} />
              </div>

              <footer className="border-t border-slate-800 bg-slate-950/60 p-5">
                <EmojiBar onSelect={appendEmojiToReply} />

                <div className="mt-3 flex items-end gap-3">
                  <textarea
                    value={reply}
                    onChange={(event) => setReply(event.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={2}
                    className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-700 bg-slate-950 px-5 py-4 text-white outline-none focus:border-blue-400"
                  />

                  <button
                    onClick={handleSendReply}
                    disabled={sendingReply}
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-white transition hover:bg-blue-400 disabled:opacity-50"
                  >
                    <Send size={22} />
                  </button>
                </div>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

function EmojiBar({ onSelect }: { onSelect: (emoji: string) => void }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
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
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-lg transition hover:border-blue-400 hover:bg-blue-500/10"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}