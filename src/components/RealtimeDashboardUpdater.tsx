"use client";

import {
  Cake,
  Clipboard,
  ExternalLink,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

type BirthdayStudent = {
  id: string;
  name: string;
  class_id: string | null;
  class_name: string | null;
  birth_date: string | null;
  phone: string | null;
};

type ClassItem = {
  id: string;
  name: string;
  whatsapp_group_link: string | null;
};

type BirthdayMessage = {
  id: string;
  message: string;
};

const fallbackBirthdayMessages = [
  "Que este novo ciclo venha com coragem, boas escolhas e confiança para construir um futuro cheio de possibilidades.",
  "Hoje celebramos sua vida, sua história e tudo que você ainda pode conquistar. Continue acreditando no seu potencial.",
  "Que seu aniversário marque uma fase de crescimento, aprendizado, boas amizades e muitas oportunidades.",
  "Parabéns pelo seu dia! Que você siga evoluindo com criatividade, responsabilidade e vontade de transformar sua realidade.",
];

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getDateParts(value: string | null | undefined) {
  if (!value) return null;

  const [yearValue, monthValue, dayValue] = value.slice(0, 10).split("-");
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!year || !month || !day) return null;

  return { year, month, day };
}

function isBirthdayInCurrentMonth(value: string | null | undefined) {
  const parts = getDateParts(value);

  if (!parts) return false;

  return parts.month === new Date().getMonth() + 1;
}

function isBirthdayToday(value: string | null | undefined) {
  const parts = getDateParts(value);

  if (!parts) return false;

  const today = new Date();

  return parts.month === today.getMonth() + 1 && parts.day === today.getDate();
}

function formatBirthdayDate(value: string | null | undefined) {
  const parts = getDateParts(value);

  if (!parts) return "Data não informada";

  return new Date(2000, parts.month - 1, parts.day).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "aluno";
}

function buildBirthdayMessage(
  student: BirthdayStudent,
  messages: BirthdayMessage[]
) {
  const source =
    messages.length > 0
      ? messages.map((item) => item.message).filter(Boolean)
      : fallbackBirthdayMessages;

  const today = new Date().toISOString().slice(0, 10);
  const seed = normalizeText(`${student.id}-${student.name}-${today}`);

  const hash = seed.split("").reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);

  const firstName = getFirstName(student.name);
  const selected = source[hash % source.length] ?? fallbackBirthdayMessages[0];
  const personalized = selected.replaceAll("{nome}", firstName).trim();

  if (normalizeText(personalized).includes(normalizeText(firstName))) {
    return personalized;
  }

  return `🎉 *Feliz aniversário, ${firstName}!* 🎂\n\n${personalized}`;
}

function normalizePhone(phone: string | null) {
  const digits = String(phone ?? "").replace(/\D/g, "");

  if (!digits) return "";

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

function getValidWhatsappLink(value: string | null | undefined) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) return "";

  try {
    const url = new URL(cleanValue);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "wa.me" ||
      hostname.endsWith(".wa.me") ||
      hostname === "whatsapp.com" ||
      hostname.endsWith(".whatsapp.com")
    ) {
      return url.toString();
    }

    return "";
  } catch {
    return "";
  }
}

async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function RealtimeDashboardUpdater() {
  const [birthdayStudents, setBirthdayStudents] = useState<BirthdayStudent[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [birthdayMessages, setBirthdayMessages] = useState<BirthdayMessage[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<BirthdayStudent | null>(null);
  const [draftMessage, setDraftMessage] = useState("");
  const [feedback, setFeedback] = useState("");

  const classById = useMemo(() => {
    return new Map(classes.map((item) => [item.id, item]));
  }, [classes]);

  const openBirthdayModal = useCallback(
    (student: BirthdayStudent) => {
      setSelectedStudent(student);
      setDraftMessage(buildBirthdayMessage(student, birthdayMessages));
      setFeedback("");
    },
    [birthdayMessages]
  );

  const loadBirthdayData = useCallback(async () => {
    const [studentsResponse, classesResponse, messagesResponse] =
      await Promise.all([
        supabase
          .from("students")
          .select("id, name, class_id, class_name, birth_date, phone")
          .eq("archived", false)
          .not("birth_date", "is", null)
          .order("name", { ascending: true }),

        supabase
          .from("classes")
          .select("id, name, whatsapp_group_link")
          .order("name", { ascending: true }),

        supabase
          .from("birthday_messages")
          .select("id, message")
          .eq("active", true),
      ]);

    if (studentsResponse.error) {
      console.error(
        "Erro ao carregar aniversariantes:",
        studentsResponse.error.message
      );
    }

    if (classesResponse.error) {
      console.error(
        "Erro ao carregar links das turmas:",
        classesResponse.error.message
      );
    }

    if (messagesResponse.error) {
      console.error(
        "Erro ao carregar mensagens de aniversário:",
        messagesResponse.error.message
      );
    }

    const loadedStudents =
      (studentsResponse.data as BirthdayStudent[] | null) ?? [];

    setBirthdayStudents(
      loadedStudents
        .filter((student) => isBirthdayInCurrentMonth(student.birth_date))
        .sort((a, b) => {
          const todayCompare =
            Number(isBirthdayToday(b.birth_date)) -
            Number(isBirthdayToday(a.birth_date));

          if (todayCompare !== 0) return todayCompare;

          return (
            Number(getDateParts(a.birth_date)?.day ?? 99) -
            Number(getDateParts(b.birth_date)?.day ?? 99)
          );
        })
    );

    setClasses((classesResponse.data as ClassItem[] | null) ?? []);
    setBirthdayMessages(
      (messagesResponse.data as BirthdayMessage[] | null) ?? []
    );
  }, []);

  useEffect(() => {
    loadBirthdayData();

    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "students",
        },
        () => {
          loadBirthdayData();
          window.location.reload();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "grades",
        },
        () => {
          window.location.reload();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "attendance",
        },
        () => {
          window.location.reload();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "classes",
        },
        () => {
          loadBirthdayData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "birthday_messages",
        },
        () => {
          loadBirthdayData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBirthdayData]);

  useEffect(() => {
    if (birthdayStudents.length === 0) return;

    const cleanups: Array<() => void> = [];

    function attachBirthdayButtons() {
      cleanups.splice(0).forEach((cleanup) => cleanup());

      const sections = Array.from(document.querySelectorAll("section"));

      const birthdaySection = sections.find((section) =>
        section.textContent?.includes("Aniversariantes de")
      );

      if (!birthdaySection) return;

      const candidates = Array.from(
        birthdaySection.querySelectorAll<HTMLElement>("div, button")
      );

      birthdayStudents.forEach((student) => {
        const target = candidates.find((element) => {
          const directSpans = Array.from(element.children).filter(
            (child) => child.tagName === "SPAN"
          );

          return directSpans.some(
            (span) => span.textContent?.trim() === student.name
          );
        });

        if (!target || target.dataset.birthdayPopupReady === "true") return;

        target.dataset.birthdayPopupReady = "true";
        target.setAttribute("role", "button");
        target.setAttribute("tabindex", "0");
        target.setAttribute(
          "title",
          `Abrir mensagem de aniversário de ${student.name}`
        );
        target.style.cursor = "pointer";

        const clickHandler = () => openBirthdayModal(student);
        const keyHandler = (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openBirthdayModal(student);
          }
        };

        target.addEventListener("click", clickHandler);
        target.addEventListener("keydown", keyHandler);

        cleanups.push(() => {
          target.removeEventListener("click", clickHandler);
          target.removeEventListener("keydown", keyHandler);
          delete target.dataset.birthdayPopupReady;
          target.removeAttribute("role");
          target.removeAttribute("tabindex");
          target.removeAttribute("title");
          target.style.cursor = "";
        });
      });
    }

    attachBirthdayButtons();

    const observer = new MutationObserver(() => {
      attachBirthdayButtons();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [birthdayStudents, openBirthdayModal]);

  async function handleCopyMessage() {
    if (!draftMessage.trim()) return;

    await copyText(draftMessage);

    setFeedback("Mensagem copiada. Agora é só colar no WhatsApp.");
  }

  function handleOpenStudentWhatsapp() {
    if (!selectedStudent) return;

    const phone = normalizePhone(selectedStudent.phone);

    if (!phone) {
      setFeedback("Este aluno não possui telefone cadastrado.");
      return;
    }

    const url = `https://wa.me/${phone}?text=${encodeURIComponent(
      draftMessage
    )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleOpenClassGroup() {
    if (!selectedStudent) return;

    const classItem = selectedStudent.class_id
      ? classById.get(selectedStudent.class_id)
      : undefined;

    const groupLink = getValidWhatsappLink(classItem?.whatsapp_group_link);

    if (!groupLink) {
      setFeedback(
        "A turma deste aluno ainda não possui link de grupo cadastrado."
      );
      return;
    }

    window.open(groupLink, "_blank", "noopener,noreferrer");

    await copyText(draftMessage);

    setFeedback("Mensagem copiada e grupo aberto. Cole a mensagem no grupo.");
  }

  if (!selectedStudent) {
    return null;
  }

  const classItem = selectedStudent.class_id
    ? classById.get(selectedStudent.class_id)
    : undefined;

  const hasStudentPhone = Boolean(normalizePhone(selectedStudent.phone));
  const hasGroupLink = Boolean(
    getValidWhatsappLink(classItem?.whatsapp_group_link)
  );

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Mensagem de aniversário de ${selectedStudent.name}`}
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          setSelectedStudent(null);
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-pink-400/30 bg-slate-950 shadow-2xl shadow-pink-500/20">
        <div className="border-b border-slate-800 bg-gradient-to-r from-pink-500/20 via-fuchsia-500/15 to-yellow-500/10 p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-200">
                <Cake size={28} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-pink-200">
                  Mensagem individual
                </p>

                <h2 className="mt-1 text-2xl font-black text-white">
                  {selectedStudent.name}
                </h2>

                <p className="mt-1 text-sm text-slate-300">
                  {classItem?.name ||
                    selectedStudent.class_name ||
                    "Turma não informada"}{" "}
                  • {formatBirthdayDate(selectedStudent.birth_date)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedStudent(null)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/50 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6">
          <label className="text-sm font-bold text-white">
            Mensagem de aniversário
          </label>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            A mensagem veio do banco de mensagens ativas. Você pode fazer um
            ajuste antes de copiar ou enviar.
          </p>

          <textarea
            value={draftMessage}
            onChange={(event) => {
              setDraftMessage(event.target.value);
              setFeedback("");
            }}
            rows={8}
            className="mt-3 w-full resize-none rounded-2xl border border-slate-700 bg-slate-900 px-4 py-4 text-sm leading-7 text-slate-100 outline-none transition focus:border-pink-400"
          />

          {feedback && (
            <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
              {feedback}
            </div>
          )}

          {!hasGroupLink && (
            <p className="mt-4 text-xs text-yellow-200">
              O link do grupo ainda não foi cadastrado para esta turma. Cadastre
              em Dashboard → Turmas.
            </p>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold text-slate-200 transition hover:bg-slate-800"
            >
              <Clipboard size={18} />
              Copiar mensagem
            </button>

            <button
              type="button"
              onClick={handleOpenStudentWhatsapp}
              disabled={!hasStudentPhone}
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <MessageCircle size={18} />
              WhatsApp do aluno
            </button>

            <button
              type="button"
              onClick={handleOpenClassGroup}
              disabled={!hasGroupLink}
              className="flex items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white transition hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2"
            >
              <Send size={18} />
              Copiar e abrir grupo da turma
              <ExternalLink size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
