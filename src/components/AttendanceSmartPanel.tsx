"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Cake,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Copy,
  Edit3,
  Eye,
  Loader2,
  MessageCircle,
  PartyPopper,
  Save,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
  whatsapp_group_link: string | null;
};

type Lesson = {
  id: string;
  class_id: string;
  course_id: string;
  course_name: string;
  lesson_order: number;
  title: string;
  content: string;
  notes: string | null;
};

type DiaryLesson = {
  id: string;
  class_id: string;
  lesson_date: string;
  content: string;
  notes: string | null;
};

type Student = {
  id: string;
  name: string;
  class_id: string;
  birth_date: string | null;
};

type AttendanceStatus = "Presente" | "Falta" | "Atraso";

type AttendanceRecord = {
  status: AttendanceStatus;
  arrival_time: string;
  notes: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

type AttendanceRow = {
  status: string | null;
};

type AttendanceHistoryRow = {
  id: string;
  student_id: string;
  class_id: string;
  lesson_id: string | null;
  date: string;
  status: string | null;
  arrival_time: string | null;
  notes: string | null;
  created_at?: string | null;
};

type AttendanceHistoryGroup = {
  key: string;
  classId: string;
  className: string;
  lessonId: string | null;
  date: string;
  timeLabel: string;
  createdAt: string | null;
  lesson: DiaryLesson | null;
  rows: AttendanceHistoryRow[];
  total: number;
  presentCount: number;
  delayedCount: number;
  absentCount: number;
};

type LessonMode = "planned" | "manual" | "diary";

type CurrentLessonInfo = {
  source: LessonMode;
  courseName: string;
  title: string;
  content: string;
  notes: string | null;
  label: string;
};

type BirthdayMessage = {
  id: string;
  message: string;
};

const motivationalMessages = [
  "Cada presença é um passo a mais rumo ao seu primeiro grande resultado profissional.",
  "Disciplina hoje, oportunidade amanhã.",
  "Quem se prepara melhor chega mais confiante ao mercado de trabalho.",
  "Aprender é construir o futuro com as próprias mãos.",
  "A constância vence o talento quando o talento não é constante.",
  "Seu esforço de hoje pode abrir portas que você ainda nem imagina.",
  "Pontualidade, presença e atitude também são competências profissionais.",
  "Quem se compromete cedo chega mais longe.",
  "O jovem aprendiz que se dedica hoje se destaca amanhã.",
  "Não é só uma aula: é treino para a vida profissional.",
  "A melhor vaga começa com a melhor preparação.",
  "Responsabilidade é uma habilidade que o mercado valoriza muito.",
  "Você não precisa ser perfeito; precisa continuar evoluindo.",
  "Cada aula fortalece sua postura para o mundo do trabalho.",
  "O futuro profissional é construído nas pequenas escolhas diárias.",
  "Quem participa mais, aprende mais. Quem aprende mais, cresce mais.",
  "A oportunidade costuma encontrar quem está preparado.",
  "Estudar também é investir em liberdade de escolha.",
  "Seu comportamento em sala também comunica quem você será no trabalho.",
  "Foco, respeito e compromisso abrem caminhos.",
  "O mercado procura pessoas que aprendem, colaboram e persistem.",
  "Hoje você treina. Amanhã você entrega resultado.",
  "Pequenas melhorias todos os dias criam grandes mudanças.",
  "A presença mostra compromisso; a participação mostra atitude.",
  "Quem cuida do próprio aprendizado aumenta suas chances.",
  "A caminhada profissional começa antes do primeiro emprego.",
  "A melhor versão de você está sendo construída aos poucos.",
  "Não subestime uma aula: ela pode mudar uma decisão no futuro.",
  "Preparação é o que transforma chance em conquista.",
  "Você está aprendendo mais do que conteúdo: está treinando postura profissional.",
  "O hábito de cumprir compromissos vale muito no mercado.",
  "Persistir também é uma competência.",
  "A evolução aparece para quem continua tentando.",
  "Aprender hoje é ganhar voz, escolha e oportunidade amanhã.",
  "Quem leva a formação a sério chega mais forte à entrevista.",
  "Seu futuro agradece a dedicação que você escolhe hoje.",
];

const fallbackBirthdayMessages = [
  "Que este novo ciclo venha com coragem, boas escolhas e confiança para construir um futuro cheio de possibilidades.",
  "Hoje celebramos sua vida, sua história e tudo que você ainda pode conquistar. Continue acreditando no seu potencial.",
  "Que seu aniversário marque uma fase de crescimento, aprendizado, boas amizades e muitas oportunidades.",
  "Parabéns pelo seu dia! Que você siga evoluindo com criatividade, responsabilidade e vontade de transformar sua realidade.",
  "Que este novo ano de vida traga mais foco, alegria, descobertas e força para correr atrás dos seus sonhos.",
  "Feliz aniversário! Que você nunca perca a curiosidade de aprender e a coragem de tentar de novo.",
  "Que sua jornada seja cheia de boas escolhas, bons desafios e pessoas que ajudem você a crescer.",
  "Hoje é dia de celebrar quem você é e tudo que ainda está construindo. Que venham novas conquistas!",
];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDateToBrazilian(date: string) {
  if (!date) {
    return "";
  }

  return new Date(`${date}T00:00:00`).toLocaleDateString("pt-BR");
}

function formatTimeFromDateTime(value: string | null | undefined) {
  if (!value) {
    return "";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeAttendanceStatus(
  value: string | null | undefined
): AttendanceStatus {
  if (value === "Falta" || value === "Atraso") {
    return value;
  }

  return "Presente";
}

function getHistoryGroupTimeLabel(
  createdAt: string | null,
  rows: AttendanceHistoryRow[]
) {
  const createdAtTime = formatTimeFromDateTime(createdAt);

  if (createdAtTime) {
    return createdAtTime;
  }

  const delayedTime = rows.find((row) => row.arrival_time)?.arrival_time;

  if (delayedTime) {
    return delayedTime;
  }

  return "--:--";
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Não foi possível concluir a operação.";
}

function getValidWhatsappLink(value: string | null | undefined) {
  const cleanValue = String(value ?? "").trim();

  if (!cleanValue) {
    return "";
  }

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

async function copyTextToClipboard(value: string) {
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

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getShortStudentName(name: string) {
  const ignoredParticles = ["da", "de", "do", "das", "dos", "e"];

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !ignoredParticles.includes(part.toLowerCase()));

  if (parts.length <= 3) {
    return parts.join(" ");
  }

  return parts.slice(0, 3).join(" ");
}

function getFirstName(name: string) {
  return name.trim().split(/\s+/)[0] || "aluno";
}

function getLessonLabel(lesson: Lesson) {
  return `${lesson.course_name} — ${
    lesson.lesson_order > 0 ? `Aula ${lesson.lesson_order}: ` : ""
  }${lesson.title}`;
}

function getPreviewText(value: string | null | undefined) {
  const cleanValue = (value || "").trim().replace(/\s+/g, " ");

  if (!cleanValue) {
    return "Conteúdo não informado";
  }

  if (cleanValue.length <= 90) {
    return cleanValue;
  }

  return `${cleanValue.slice(0, 90)}...`;
}

function getDiaryLessonLabel(lesson: DiaryLesson) {
  return `${formatDateToBrazilian(lesson.lesson_date)} — ${getPreviewText(
    lesson.content
  )}`;
}

function getMotivationalMessage(seed: string) {
  const normalizedSeed = normalizeText(seed);

  const hash = normalizedSeed.split("").reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);

  return motivationalMessages[hash % motivationalMessages.length];
}

function getDateParts(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const cleanValue = value.slice(0, 10);
  const [yearValue, monthValue, dayValue] = cleanValue.split("-");

  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!year || !month || !day) {
    return null;
  }

  return {
    year,
    month,
    day,
  };
}

function isBirthdayOnDate(
  birthDate: string | null | undefined,
  targetDate: string
) {
  const birthParts = getDateParts(birthDate);
  const targetParts = getDateParts(targetDate);

  if (!birthParts || !targetParts) {
    return false;
  }

  return birthParts.month === targetParts.month && birthParts.day === targetParts.day;
}

function formatBirthdayDate(birthDate: string | null | undefined) {
  const parts = getDateParts(birthDate);

  if (!parts) {
    return "";
  }

  return new Date(2000, parts.month - 1, parts.day).toLocaleDateString(
    "pt-BR",
    {
      day: "2-digit",
      month: "long",
    }
  );
}

function getBirthdayMessageForStudent({
  student,
  attendanceDate,
  birthdayMessages,
}: {
  student: Student;
  attendanceDate: string;
  birthdayMessages: BirthdayMessage[];
}) {
  const messageSource =
    birthdayMessages.length > 0
      ? birthdayMessages.map((item) => item.message)
      : fallbackBirthdayMessages;

  const seed = normalizeText(`${student.id}-${student.name}-${attendanceDate}`);
  const hash = seed.split("").reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);

  const firstName = getFirstName(student.name);
  const selectedMessage = messageSource[hash % messageSource.length];

  return selectedMessage.replace("{nome}", firstName);
}

export function AttendanceSmartPanel({
  classes,
  lessons,
  students,
}: {
  classes: ClassItem[];
  lessons: Lesson[];
  students: Student[];
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [selectedDiaryLessonId, setSelectedDiaryLessonId] = useState("");

  const [lessonMode, setLessonMode] = useState<LessonMode>("planned");
  const [manualLessonTitle, setManualLessonTitle] = useState("");
  const [manualLessonContent, setManualLessonContent] = useState("");

  const [attendanceDate, setAttendanceDate] = useState(getTodayDate);
  const [teacherName, setTeacherName] = useState("Professor");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const [lessonMenuOpen, setLessonMenuOpen] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");

  const [diaryLessons, setDiaryLessons] = useState<DiaryLesson[]>([]);
  const [loadingDiaryLessons, setLoadingDiaryLessons] = useState(false);
  const [diaryLessonMenuOpen, setDiaryLessonMenuOpen] = useState(false);
  const [diaryLessonSearch, setDiaryLessonSearch] = useState("");

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});
  const [birthdayMessages, setBirthdayMessages] = useState<BirthdayMessage[]>([]);

  const [attendanceHistory, setAttendanceHistory] = useState<
    AttendanceHistoryRow[]
  >([]);
  const [loadingAttendanceHistory, setLoadingAttendanceHistory] =
    useState(false);
  const [expandedHistoryKey, setExpandedHistoryKey] = useState<string | null>(
    null
  );
  const [deletingHistoryKey, setDeletingHistoryKey] = useState<string | null>(
    null
  );

  const selectedClass = classes.find((item) => item.id === selectedClassId);

  const selectedLesson = lessons.find(
    (lesson) =>
      lesson.id === selectedLessonId && lesson.class_id === selectedClassId
  );

  const selectedDiaryLesson = diaryLessons.find(
    (lesson) =>
      lesson.id === selectedDiaryLessonId && lesson.class_id === selectedClassId
  );

  const loadAttendanceHistory = useCallback(async () => {
    setExpandedHistoryKey(null);

    if (!selectedClassId) {
      setAttendanceHistory([]);
      setLoadingAttendanceHistory(false);
      return;
    }

    setLoadingAttendanceHistory(true);

    const selectWithCreatedAt = `
      id,
      student_id,
      class_id,
      lesson_id,
      date,
      status,
      arrival_time,
      notes,
      created_at
    `;

    const selectWithoutCreatedAt = `
      id,
      student_id,
      class_id,
      lesson_id,
      date,
      status,
      arrival_time,
      notes
    `;

    const resultWithCreatedAt = await supabase
      .from("attendance")
      .select(selectWithCreatedAt)
      .eq("class_id", selectedClassId)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (resultWithCreatedAt.error) {
      const resultWithoutCreatedAt = await supabase
        .from("attendance")
        .select(selectWithoutCreatedAt)
        .eq("class_id", selectedClassId)
        .order("date", { ascending: false });

      if (resultWithoutCreatedAt.error) {
        setAttendanceHistory([]);
        setLoadingAttendanceHistory(false);
        setMessage({
          type: "error",
          text: `Erro ao carregar histórico de frequência: ${resultWithoutCreatedAt.error.message}`,
        });
        return;
      }

      setAttendanceHistory(
        (resultWithoutCreatedAt.data as AttendanceHistoryRow[] | null) ?? []
      );
      setLoadingAttendanceHistory(false);
      return;
    }

    setAttendanceHistory(
      (resultWithCreatedAt.data as AttendanceHistoryRow[] | null) ?? []
    );
    setLoadingAttendanceHistory(false);
  }, [selectedClassId]);

  useEffect(() => {
    let ignore = false;

    async function loadBirthdayMessages() {
      const { data, error } = await supabase
        .from("birthday_messages")
        .select("id, message")
        .eq("active", true);

      if (ignore) {
        return;
      }

      if (error) {
        console.error("Erro ao carregar mensagens de aniversário:", error);
        setBirthdayMessages([]);
        return;
      }

      setBirthdayMessages((data as BirthdayMessage[] | null) ?? []);
    }

    loadBirthdayMessages();

    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDiaryLessons() {
      setDiaryLessons([]);
      setSelectedDiaryLessonId("");
      setDiaryLessonMenuOpen(false);
      setDiaryLessonSearch("");

      if (!selectedClassId) {
        return;
      }

      setLoadingDiaryLessons(true);

      const { data, error } = await supabase
        .from("lesson_diary")
        .select(
          `
          id,
          class_id,
          lesson_date,
          content,
          notes
        `
        )
        .eq("class_id", selectedClassId)
        .order("lesson_date", { ascending: false });

      if (ignore) {
        return;
      }

      if (error) {
        setMessage({
          type: "error",
          text: `Erro ao carregar aulas do diário: ${error.message}`,
        });

        setDiaryLessons([]);
        setLoadingDiaryLessons(false);
        return;
      }

      setDiaryLessons((data as DiaryLesson[] | null) ?? []);
      setLoadingDiaryLessons(false);
    }

    loadDiaryLessons();

    return () => {
      ignore = true;
    };
  }, [selectedClassId]);

  useEffect(() => {
    loadAttendanceHistory();
  }, [loadAttendanceHistory]);

  const classLessons = useMemo(() => {
    return lessons
      .filter((lesson) => lesson.class_id === selectedClassId)
      .sort((a, b) => {
        const courseCompare = a.course_name.localeCompare(
          b.course_name,
          "pt-BR"
        );

        if (courseCompare !== 0) {
          return courseCompare;
        }

        if (a.lesson_order !== b.lesson_order) {
          return a.lesson_order - b.lesson_order;
        }

        return a.title.localeCompare(b.title, "pt-BR");
      });
  }, [lessons, selectedClassId]);

  const filteredClassLessons = useMemo(() => {
    const search = normalizeText(lessonSearch);

    if (!search) {
      return classLessons;
    }

    return classLessons.filter((lesson) =>
      normalizeText(getLessonLabel(lesson)).includes(search)
    );
  }, [classLessons, lessonSearch]);

  const filteredDiaryLessons = useMemo(() => {
    const search = normalizeText(diaryLessonSearch);

    if (!search) {
      return diaryLessons;
    }

    return diaryLessons.filter((lesson) => {
      const searchableText = [
        getDiaryLessonLabel(lesson),
        lesson.content,
        lesson.notes || "",
      ].join(" ");

      return normalizeText(searchableText).includes(search);
    });
  }, [diaryLessons, diaryLessonSearch]);

  const classStudents = useMemo(() => {
    return students.filter((student) => student.class_id === selectedClassId);
  }, [students, selectedClassId]);

  const classById = useMemo(() => {
    return new Map(classes.map((classItem) => [classItem.id, classItem]));
  }, [classes]);

  const studentById = useMemo(() => {
    return new Map(students.map((student) => [student.id, student]));
  }, [students]);

  const diaryLessonById = useMemo(() => {
    return new Map(diaryLessons.map((lesson) => [lesson.id, lesson]));
  }, [diaryLessons]);

  const attendanceHistoryGroups = useMemo(() => {
    const grouped = new Map<
      string,
      Omit<
        AttendanceHistoryGroup,
        "timeLabel" | "total" | "presentCount" | "delayedCount" | "absentCount"
      >
    >();

    attendanceHistory.forEach((row) => {
      const lessonId = row.lesson_id || null;
      const key = `${row.class_id}-${lessonId || "sem-aula"}-${row.date}`;
      const existingGroup = grouped.get(key);

      if (!existingGroup) {
        grouped.set(key, {
          key,
          classId: row.class_id,
          className: classById.get(row.class_id)?.name || "Turma",
          lessonId,
          date: row.date,
          createdAt: row.created_at ?? null,
          lesson: lessonId ? diaryLessonById.get(lessonId) ?? null : null,
          rows: [row],
        });

        return;
      }

      existingGroup.rows.push(row);

      if (
        row.created_at &&
        (!existingGroup.createdAt ||
          new Date(row.created_at).getTime() >
            new Date(existingGroup.createdAt).getTime())
      ) {
        existingGroup.createdAt = row.created_at;
      }

      if (!existingGroup.lesson && lessonId) {
        existingGroup.lesson = diaryLessonById.get(lessonId) ?? null;
      }
    });

    return Array.from(grouped.values())
      .map((group) => {
        const presentCount = group.rows.filter(
          (row) => normalizeAttendanceStatus(row.status) === "Presente"
        ).length;

        const delayedCount = group.rows.filter(
          (row) => normalizeAttendanceStatus(row.status) === "Atraso"
        ).length;

        const absentCount = group.rows.filter(
          (row) => normalizeAttendanceStatus(row.status) === "Falta"
        ).length;

        return {
          ...group,
          timeLabel: getHistoryGroupTimeLabel(group.createdAt, group.rows),
          total: group.rows.length,
          presentCount,
          delayedCount,
          absentCount,
        };
      })
      .sort((firstGroup, secondGroup) => {
        const firstTime =
          firstGroup.timeLabel && firstGroup.timeLabel !== "--:--"
            ? firstGroup.timeLabel
            : "00:00";
        const secondTime =
          secondGroup.timeLabel && secondGroup.timeLabel !== "--:--"
            ? secondGroup.timeLabel
            : "00:00";
        const firstDate = new Date(`${firstGroup.date}T${firstTime}`).getTime();
        const secondDate = new Date(
          `${secondGroup.date}T${secondTime}`
        ).getTime();

        return secondDate - firstDate;
      });
  }, [attendanceHistory, classById, diaryLessonById]);

  const birthdayStudents = useMemo(() => {
    if (!selectedClassId || !attendanceDate) {
      return [];
    }

    return classStudents.filter((student) =>
      isBirthdayOnDate(student.birth_date, attendanceDate)
    );
  }, [classStudents, selectedClassId, attendanceDate]);

  const currentLessonInfo = useMemo<CurrentLessonInfo | null>(() => {
    if (lessonMode === "planned" && selectedLesson) {
      const lessonTitle =
        selectedLesson.lesson_order > 0
          ? `Aula ${selectedLesson.lesson_order} — ${selectedLesson.title}`
          : selectedLesson.title;

      return {
        source: "planned",
        courseName: selectedLesson.course_name,
        title: lessonTitle,
        content:
          selectedLesson.content.trim() ||
          selectedLesson.title.trim() ||
          "Conteúdo não informado",
        notes: selectedLesson.notes,
        label: `${selectedLesson.course_name} • ${lessonTitle}`,
      };
    }

    if (lessonMode === "manual" && manualLessonContent.trim()) {
      const title = manualLessonTitle.trim() || "Aula eventual";

      return {
        source: "manual",
        courseName: "Aula eventual",
        title,
        content: manualLessonContent.trim(),
        notes: null,
        label: title,
      };
    }

    if (lessonMode === "diary" && selectedDiaryLesson) {
      const date = formatDateToBrazilian(selectedDiaryLesson.lesson_date);

      return {
        source: "diary",
        courseName: "Diário de classe",
        title: `Aula registrada em ${date}`,
        content: selectedDiaryLesson.content.trim() || "Conteúdo não informado",
        notes: selectedDiaryLesson.notes,
        label: getDiaryLessonLabel(selectedDiaryLesson),
      };
    }

    return null;
  }, [
    lessonMode,
    selectedLesson,
    selectedDiaryLesson,
    manualLessonTitle,
    manualLessonContent,
  ]);

  function updateRecord(
    studentId: string,
    field: keyof AttendanceRecord,
    value: string
  ) {
    setRecords((current) => ({
      ...current,

      [studentId]: {
        status: current[studentId]?.status ?? "Presente",
        arrival_time: current[studentId]?.arrival_time ?? "",
        notes: current[studentId]?.notes ?? "",
        [field]: value,
      },
    }));
  }

  function setAllStatus(status: AttendanceStatus) {
    const updated: Record<string, AttendanceRecord> = {};

    classStudents.forEach((student) => {
      updated[student.id] = {
        status,
        arrival_time: "",
        notes: "",
      };
    });

    setRecords(updated);
  }

  async function getOrCreateLessonDiaryId() {
    if (!selectedClassId || !attendanceDate || !currentLessonInfo) {
      return null;
    }

    if (currentLessonInfo.source === "diary") {
      return selectedDiaryLesson?.id ?? null;
    }

    const diaryContent =
      currentLessonInfo.source === "manual"
        ? `${currentLessonInfo.title}\n\n${currentLessonInfo.content}`
        : currentLessonInfo.content;

    const diaryNotes =
      currentLessonInfo.source === "manual"
        ? [
            "Aula eventual/manual",
            `Título: ${currentLessonInfo.title}`,
            currentLessonInfo.notes || "",
          ]
            .filter(Boolean)
            .join("\n\n")
        : [
            `Curso: ${currentLessonInfo.courseName}`,
            currentLessonInfo.title,
            currentLessonInfo.notes?.trim() || "",
          ]
            .filter(Boolean)
            .join("\n\n");

    const { data: existingDiary, error: existingDiaryError } = await supabase
      .from("lesson_diary")
      .select("id")
      .eq("class_id", selectedClassId)
      .eq("lesson_date", attendanceDate)
      .eq("content", diaryContent)
      .limit(1)
      .maybeSingle();

    if (existingDiaryError) {
      throw existingDiaryError;
    }

    if (existingDiary?.id) {
      return String(existingDiary.id);
    }

    const { data: createdDiary, error: createdDiaryError } = await supabase
      .from("lesson_diary")
      .insert({
        class_id: selectedClassId,
        lesson_date: attendanceDate,
        content: diaryContent,
        notes: diaryNotes || null,
      })
      .select("id")
      .single();

    if (createdDiaryError) {
      throw createdDiaryError;
    }

    return String(createdDiary.id);
  }

  async function recalculateStudentAttendance(studentIds: string[]) {
    const uniqueStudentIds = Array.from(new Set(studentIds.filter(Boolean)));

    for (const studentId of uniqueStudentIds) {
      const { data, error } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", studentId);

      if (error) {
        throw error;
      }

      const attendanceRows = (data as AttendanceRow[] | null) ?? [];
      const total = attendanceRows.length;

      const presentCount = attendanceRows.filter(
        (row) => row.status === "Presente" || row.status === "Atraso"
      ).length;

      const attendancePercentage =
        total > 0 ? Math.round((presentCount / total) * 100) : 0;

      const { error: updateStudentError } = await supabase
        .from("students")
        .update({
          attendance: attendancePercentage,
        })
        .eq("id", studentId);

      if (updateStudentError) {
        throw updateStudentError;
      }
    }
  }

  async function saveAttendance() {
    setMessage(null);

    if (!selectedClassId) {
      setMessage({
        type: "error",
        text: "Selecione a turma antes de salvar a chamada.",
      });

      return;
    }

    if (!attendanceDate) {
      setMessage({
        type: "error",
        text: "Informe a data da chamada.",
      });

      return;
    }

    if (lessonMode === "planned" && (!selectedLessonId || !selectedLesson)) {
      setMessage({
        type: "error",
        text: "Selecione uma aula da grade ou altere para aula eventual/manual.",
      });

      return;
    }

    if (lessonMode === "manual" && !manualLessonContent.trim()) {
      setMessage({
        type: "error",
        text: "Digite o conteúdo da aula eventual/manual.",
      });

      return;
    }

    if (
      lessonMode === "diary" &&
      (!selectedDiaryLessonId || !selectedDiaryLesson)
    ) {
      setMessage({
        type: "error",
        text: "Selecione uma aula registrada no diário.",
      });

      return;
    }

    if (!currentLessonInfo) {
      setMessage({
        type: "error",
        text: "Informe a aula antes de salvar a chamada.",
      });

      return;
    }

    if (classStudents.length === 0) {
      setMessage({
        type: "error",
        text: "Esta turma não possui alunos vinculados.",
      });

      return;
    }

    setSaving(true);

    try {
      const lessonDiaryId = await getOrCreateLessonDiaryId();

      if (!lessonDiaryId) {
        setMessage({
          type: "error",
          text: "Não foi possível preparar a aula no diário.",
        });

        setSaving(false);
        return;
      }

      const { error: deletePreviousError } = await supabase
        .from("attendance")
        .delete()
        .eq("class_id", selectedClassId)
        .eq("lesson_id", lessonDiaryId)
        .eq("date", attendanceDate);

      if (deletePreviousError) {
        throw deletePreviousError;
      }

      const rows = classStudents.map((student) => {
        const record = records[student.id] ?? {
          status: "Presente",
          arrival_time: "",
          notes: "",
        };

        return {
          student_id: student.id,
          class_id: selectedClassId,
          lesson_id: lessonDiaryId,
          date: attendanceDate,
          status: record.status,
          arrival_time:
            record.status === "Atraso" ? record.arrival_time || null : null,
          notes: record.notes.trim() || null,
        };
      });

      const { data, error } = await supabase
        .from("attendance")
        .insert(rows)
        .select("id");

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error(
          "O Supabase não confirmou nenhum registro de frequência salvo."
        );
      }

      await recalculateStudentAttendance(
        classStudents.map((student) => student.id)
      );

      await loadAttendanceHistory();

      setMessage({
        type: "success",
        text: `Chamada salva com sucesso! ${data.length} registro(s) gravado(s) e frequência dos alunos atualizada.`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao salvar chamada: ${getErrorMessage(error)}`,
      });
    } finally {
      setSaving(false);
    }
  }

  const reportText = useMemo(() => {
    if (!selectedClass || !currentLessonInfo) {
      return "";
    }

    const date = formatDateToBrazilian(attendanceDate);
    const seed = `${selectedClass.id}-${attendanceDate}-${currentLessonInfo.content}`;
    const motivationalMessage = getMotivationalMessage(seed);

    const getRecord = (studentId: string) =>
      records[studentId] ?? {
        status: "Presente" as AttendanceStatus,
        arrival_time: "",
        notes: "",
      };

    const presentStudents = classStudents.filter(
      (student) => getRecord(student.id).status === "Presente"
    );

    const delayedStudents = classStudents.filter(
      (student) => getRecord(student.id).status === "Atraso"
    );

    const absentStudents = classStudents.filter(
      (student) => getRecord(student.id).status === "Falta"
    );

    function buildStudentLine(student: Student) {
      const record = getRecord(student.id);
      const shortName = getShortStudentName(student.name);
      const birthdayMark = isBirthdayOnDate(student.birth_date, attendanceDate)
        ? " 🎂"
        : "";

      const time =
        record.status === "Atraso" && record.arrival_time
          ? ` (${record.arrival_time})`
          : "";

      const note = record.notes.trim()
        ? `\n   _Obs.: ${record.notes.trim()}_`
        : "";

      return `• ${shortName}${birthdayMark}${time}${note}`;
    }

    const presentLines =
      presentStudents.length > 0
        ? presentStudents.map(buildStudentLine).join("\n")
        : "• Nenhum registro";

    const delayedLines =
      delayedStudents.length > 0
        ? delayedStudents.map(buildStudentLine).join("\n")
        : "• Nenhum atraso";

    const absentLines =
      absentStudents.length > 0
        ? absentStudents.map(buildStudentLine).join("\n")
        : "• Nenhuma falta";

    const birthdayLines =
      birthdayStudents.length > 0
        ? birthdayStudents
            .map((student) => {
              const shortName = getShortStudentName(student.name);
              const birthdayMessage = getBirthdayMessageForStudent({
                student,
                attendanceDate,
                birthdayMessages,
              });

              return `🎂 *${shortName}*\n_${birthdayMessage}_`;
            })
            .join("\n\n")
        : "";

    const birthdayBlock =
      birthdayStudents.length > 0
        ? `

━━━━━━━━━━━━━━

🎂 *Aniversariante(s) do dia*
${birthdayLines}`
        : "";

    return `📌 *CHAMADA REGISTRADA*

🏫 *Turma:* ${selectedClass.name}
📅 *Data:* ${date}
👨‍🏫 *Professor:* ${teacherName || "Professor"}

📚 *Aula:* ${currentLessonInfo.title}
📝 *Conteúdo:* ${currentLessonInfo.content}

━━━━━━━━━━━━━━

✅ *Presentes (${presentStudents.length})*
${presentLines}

⚠️ *Atrasos (${delayedStudents.length})*
${delayedLines}

❌ *Faltas (${absentStudents.length})*
${absentLines}

━━━━━━━━━━━━━━

📊 *Resumo*
✅ Presentes: ${presentStudents.length}
⚠️ Atrasos: ${delayedStudents.length}
❌ Faltas: ${absentStudents.length}${birthdayBlock}

━━━━━━━━━━━━━━

💬 *Mensagem do dia*
_${motivationalMessage}_`;
  }, [
    selectedClass,
    currentLessonInfo,
    classStudents,
    birthdayStudents,
    birthdayMessages,
    records,
    teacherName,
    attendanceDate,
  ]);

  async function copyReport() {
    setMessage(null);

    if (!reportText) {
      setMessage({
        type: "error",
        text: "Selecione a turma e informe a aula antes de copiar o relatório.",
      });

      return;
    }

    await copyTextToClipboard(reportText);

    setMessage({
      type: "success",
      text: "Relatório copiado com layout melhorado para WhatsApp!",
    });
  }

  async function copyReportAndOpenClassWhatsapp() {
    setMessage(null);

    if (!reportText) {
      setMessage({
        type: "error",
        text: "Selecione a turma e informe a aula antes de abrir o grupo.",
      });
      return;
    }

    const groupLink = getValidWhatsappLink(
      selectedClass?.whatsapp_group_link
    );

    if (!groupLink) {
      setMessage({
        type: "error",
        text: "Esta turma ainda não possui link de grupo cadastrado. Acesse Turmas e salve o link do WhatsApp.",
      });
      return;
    }

    window.open(
      groupLink,
      "_blank",
      "noopener,noreferrer"
    );

    await copyTextToClipboard(reportText);

    setMessage({
      type: "success",
      text: "Relatório copiado e grupo aberto. Cole a mensagem no grupo.",
    });
  }

  function buildAttendanceHistoryReport(group: AttendanceHistoryGroup) {
    const date = formatDateToBrazilian(group.date);
    const lessonContent =
      group.lesson?.content?.trim() || "Conteúdo não informado";
    const lessonNotes = group.lesson?.notes?.trim();

    function buildRows(status: AttendanceStatus) {
      const filteredRows = group.rows.filter(
        (row) => normalizeAttendanceStatus(row.status) === status
      );

      if (filteredRows.length === 0) {
        return "• Nenhum registro";
      }

      return filteredRows
        .map((row) => {
          const studentName =
            studentById.get(row.student_id)?.name || "Aluno não encontrado";
          const shortName = getShortStudentName(studentName);
          const arrivalTime =
            status === "Atraso" && row.arrival_time
              ? ` (${row.arrival_time})`
              : "";
          const note = row.notes?.trim() ? `\n   _Obs.: ${row.notes.trim()}_` : "";

          return `• ${shortName}${arrivalTime}${note}`;
        })
        .join("\n");
    }

    return `📌 *HISTÓRICO DE FREQUÊNCIA*

🏫 *Turma:* ${group.className}
📅 *Data:* ${date}
🕒 *Horário:* ${group.timeLabel}

📝 *Conteúdo:* ${lessonContent}${
      lessonNotes ? `\n🗒️ *Observações da aula:* ${lessonNotes}` : ""
    }

━━━━━━━━━━━━━━

✅ *Presentes (${group.presentCount})*
${buildRows("Presente")}

⚠️ *Atrasos (${group.delayedCount})*
${buildRows("Atraso")}

❌ *Faltas (${group.absentCount})*
${buildRows("Falta")}

━━━━━━━━━━━━━━

📊 *Resumo*
Total de alunos: ${group.total}
Presentes: ${group.presentCount}
Atrasos: ${group.delayedCount}
Faltas: ${group.absentCount}`;
  }

  async function copyAttendanceHistoryGroup(group: AttendanceHistoryGroup) {
    setMessage(null);

    await navigator.clipboard.writeText(buildAttendanceHistoryReport(group));

    setMessage({
      type: "success",
      text: "Histórico de frequência copiado.",
    });
  }

  function editAttendanceHistoryGroup(group: AttendanceHistoryGroup) {
    const updatedRecords = group.rows.reduce<Record<string, AttendanceRecord>>(
      (recordsByStudent, row) => {
        recordsByStudent[row.student_id] = {
          status: normalizeAttendanceStatus(row.status),
          arrival_time: row.arrival_time || "",
          notes: row.notes || "",
        };

        return recordsByStudent;
      },
      {}
    );

    setSelectedClassId(group.classId);
    setAttendanceDate(group.date);
    setRecords(updatedRecords);
    setManualLessonTitle("");
    setManualLessonContent("");
    setSelectedLessonId("");
    setLessonMenuOpen(false);
    setDiaryLessonMenuOpen(false);
    setLessonSearch("");
    setDiaryLessonSearch("");
    setExpandedHistoryKey(group.key);

    if (group.lessonId) {
      setLessonMode("diary");
      setSelectedDiaryLessonId(group.lessonId);
    } else {
      setLessonMode("manual");
      setSelectedDiaryLessonId("");
      setManualLessonTitle("Aula recuperada do histórico");
      setManualLessonContent(group.lesson?.content || "");
    }

    setMessage({
      type: "success",
      text: "Frequência carregada para edição. Ajuste o que precisar e clique em Salvar chamada.",
    });
  }

  async function deleteAttendanceHistoryGroup(group: AttendanceHistoryGroup) {
    const confirmed = window.confirm(
      `Excluir a frequência da turma ${group.className} em ${formatDateToBrazilian(
        group.date
      )}?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingHistoryKey(group.key);
    setMessage(null);

    try {
      let deleteQuery = supabase
        .from("attendance")
        .delete()
        .eq("class_id", group.classId)
        .eq("date", group.date);

      deleteQuery = group.lessonId
        ? deleteQuery.eq("lesson_id", group.lessonId)
        : deleteQuery.is("lesson_id", null);

      const { error } = await deleteQuery;

      if (error) {
        throw error;
      }

      await recalculateStudentAttendance(
        group.rows.map((row) => row.student_id)
      );
      await loadAttendanceHistory();

      setMessage({
        type: "success",
        text: "Frequência excluída do histórico.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao excluir frequência: ${getErrorMessage(error)}`,
      });
    } finally {
      setDeletingHistoryKey(null);
    }
  }

  function handleSelectLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setLessonMenuOpen(false);
    setLessonSearch("");
    setMessage(null);
  }

  function handleSelectDiaryLesson(lesson: DiaryLesson) {
    setSelectedDiaryLessonId(lesson.id);
    setAttendanceDate(lesson.lesson_date);
    setDiaryLessonMenuOpen(false);
    setDiaryLessonSearch("");
    setMessage(null);
  }

  function handleLessonModeChange(mode: LessonMode) {
    setLessonMode(mode);
    setMessage(null);
    setLessonMenuOpen(false);
    setDiaryLessonMenuOpen(false);
    setLessonSearch("");
    setDiaryLessonSearch("");

    if (mode !== "planned") {
      setSelectedLessonId("");
    }

    if (mode !== "diary") {
      setSelectedDiaryLessonId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Configurar chamada</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <input
            placeholder="Nome do professor"
            value={teacherName}
            onChange={(event) => setTeacherName(event.target.value)}
            className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />

          <input
            type="date"
            value={attendanceDate}
            onChange={(event) => setAttendanceDate(event.target.value)}
            style={{ colorScheme: "dark" }}
            className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-violet-400"
          />

          <select
            value={selectedClassId}
            onChange={(event) => {
              setSelectedClassId(event.target.value);
              setSelectedLessonId("");
              setSelectedDiaryLessonId("");
              setLessonMenuOpen(false);
              setDiaryLessonMenuOpen(false);
              setLessonSearch("");
              setDiaryLessonSearch("");
              setRecords({});
              setExpandedHistoryKey(null);
              setMessage(null);
            }}
            className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          >
            <option value="">Selecione a turma</option>

            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-1">
            <div className="grid grid-cols-3 gap-1">
              <button
                type="button"
                onClick={() => handleLessonModeChange("planned")}
                className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  lessonMode === "planned"
                    ? "bg-violet-500 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Grade
              </button>

              <button
                type="button"
                onClick={() => handleLessonModeChange("manual")}
                className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  lessonMode === "manual"
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Manual
              </button>

              <button
                type="button"
                onClick={() => handleLessonModeChange("diary")}
                className={`rounded-xl px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  lessonMode === "diary"
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Diário
              </button>
            </div>
          </div>
        </div>

        {selectedClassId && birthdayStudents.length > 0 && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-pink-400/30 bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-yellow-500/10 p-5 shadow-xl shadow-pink-500/10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-pink-500/20 text-pink-200">
                  <PartyPopper className="h-7 w-7" />
                </div>

                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-pink-200">
                    Aniversário na turma
                  </p>

                  <h3 className="mt-1 text-2xl font-black text-white">
                    {birthdayStudents.length === 1
                      ? `${getShortStudentName(
                          birthdayStudents[0].name
                        )} faz aniversário hoje`
                      : `${birthdayStudents.length} alunos fazem aniversário hoje`}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    O relatório da chamada já vai incluir uma felicitação
                    especial para destacar o momento.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {birthdayStudents.map((student) => (
                  <span
                    key={student.id}
                    className="inline-flex items-center gap-2 rounded-full border border-pink-300/20 bg-slate-950/50 px-3 py-2 text-sm font-bold text-pink-100"
                  >
                    <Cake className="h-4 w-4" />
                    {getShortStudentName(student.name)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {lessonMode === "planned" ? (
          <div className="mt-4">
            <div className="relative min-w-0">
              <button
                type="button"
                onClick={() => {
                  if (!selectedClassId) {
                    return;
                  }

                  setLessonMenuOpen((current) => !current);
                }}
                disabled={!selectedClassId}
                className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-left outline-none transition hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="min-w-0 flex-1 truncate">
                  {selectedLesson
                    ? getLessonLabel(selectedLesson)
                    : "Selecione uma aula da grade curricular"}
                </span>

                <ChevronDown size={18} className="shrink-0 text-slate-300" />
              </button>

              {lessonMenuOpen && (
                <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                  <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-3">
                    <Search size={17} className="text-slate-400" />

                    <input
                      value={lessonSearch}
                      onChange={(event) => setLessonSearch(event.target.value)}
                      placeholder="Pesquisar aula..."
                      className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                    />
                  </div>

                  <div className="max-h-72 overflow-y-auto p-2">
                    {filteredClassLessons.length === 0 ? (
                      <p className="px-3 py-4 text-sm text-slate-500">
                        Nenhuma aula encontrada.
                      </p>
                    ) : (
                      filteredClassLessons.map((lesson) => (
                        <button
                          key={`${lesson.class_id}-${lesson.id}`}
                          type="button"
                          onClick={() => handleSelectLesson(lesson)}
                          className={`w-full rounded-xl px-3 py-3 text-left transition hover:bg-violet-500/10 ${
                            lesson.id === selectedLessonId
                              ? "bg-violet-500/15 text-violet-200"
                              : "text-slate-200"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="shrink-0 rounded-lg bg-violet-500/10 px-2 py-1 text-[11px] font-semibold text-violet-300">
                              {lesson.course_name}
                            </span>

                            <span className="min-w-0 truncate text-sm font-semibold">
                              {lesson.lesson_order > 0
                                ? `Aula ${lesson.lesson_order}: `
                                : ""}
                              {lesson.title}
                            </span>
                          </div>

                          {lesson.content && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              {lesson.content}
                            </p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {selectedClassId && classLessons.length === 0 && (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                Nenhuma aula encontrada para esta turma. Você pode usar a opção{" "}
                <strong>Aula manual</strong> para registrar uma aula eventual.
              </div>
            )}
          </div>
        ) : lessonMode === "manual" ? (
          <div className="mt-4 rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                <Edit3 size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Aula eventual/manual
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Use esta opção quando a aula não estiver na grade curricular
                  cadastrada.
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={manualLessonTitle}
                onChange={(event) => setManualLessonTitle(event.target.value)}
                placeholder="Título da aula eventual, opcional"
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400 md:col-span-2"
              />

              <textarea
                value={manualLessonContent}
                onChange={(event) =>
                  setManualLessonContent(event.target.value)
                }
                placeholder="Digite o conteúdo trabalhado na aula..."
                rows={4}
                className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400 md:col-span-2"
              />
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
                <Clipboard size={20} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Aula do diário de classe
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Escolha uma aula já registrada no diário. A data da chamada
                  será ajustada automaticamente para a data da aula escolhida.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <div className="relative min-w-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedClassId || loadingDiaryLessons) {
                      return;
                    }

                    setDiaryLessonMenuOpen((current) => !current);
                  }}
                  disabled={!selectedClassId || loadingDiaryLessons}
                  className="flex w-full min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-left outline-none transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {!selectedClassId
                      ? "Selecione primeiro uma turma"
                      : loadingDiaryLessons
                      ? "Carregando aulas do diário..."
                      : selectedDiaryLesson
                      ? getDiaryLessonLabel(selectedDiaryLesson)
                      : "Selecione uma aula registrada no diário"}
                  </span>

                  <ChevronDown size={18} className="shrink-0 text-slate-300" />
                </button>

                {diaryLessonMenuOpen && (
                  <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
                    <div className="flex items-center gap-2 border-b border-slate-800 px-3 py-3">
                      <Search size={17} className="text-slate-400" />

                      <input
                        value={diaryLessonSearch}
                        onChange={(event) =>
                          setDiaryLessonSearch(event.target.value)
                        }
                        placeholder="Pesquisar no diário..."
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
                      />
                    </div>

                    <div className="max-h-72 overflow-y-auto p-2">
                      {filteredDiaryLessons.length === 0 ? (
                        <p className="px-3 py-4 text-sm text-slate-500">
                          Nenhuma aula do diário encontrada.
                        </p>
                      ) : (
                        filteredDiaryLessons.map((lesson) => (
                          <button
                            key={`${lesson.class_id}-${lesson.id}`}
                            type="button"
                            onClick={() => handleSelectDiaryLesson(lesson)}
                            className={`w-full rounded-xl px-3 py-3 text-left transition hover:bg-emerald-500/10 ${
                              lesson.id === selectedDiaryLessonId
                                ? "bg-emerald-500/15 text-emerald-200"
                                : "text-slate-200"
                            }`}
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="shrink-0 rounded-lg bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-300">
                                {formatDateToBrazilian(lesson.lesson_date)}
                              </span>

                              <span className="min-w-0 truncate text-sm font-semibold">
                                {getPreviewText(lesson.content)}
                              </span>
                            </div>

                            {lesson.notes && (
                              <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                                {lesson.notes}
                              </p>
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {selectedClassId &&
                !loadingDiaryLessons &&
                diaryLessons.length === 0 && (
                  <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                    Nenhuma aula registrada no diário para esta turma. Registre
                    uma aula na aba <strong>Diário</strong> ou use{" "}
                    <strong>Aula manual</strong>.
                  </div>
                )}
            </div>
          </div>
        )}

        {currentLessonInfo && (
          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200">
                {currentLessonInfo.courseName}
              </span>

              <span className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {currentLessonInfo.source === "manual"
                  ? "Manual"
                  : currentLessonInfo.source === "diary"
                  ? "Diário"
                  : "Grade curricular"}
              </span>
            </div>

            <p className="mt-4 font-semibold text-violet-200">
              {currentLessonInfo.title}
            </p>

            <p className="mt-2 leading-7 text-slate-300">
              {currentLessonInfo.content}
            </p>

            {currentLessonInfo.notes && (
              <p className="mt-2 text-sm text-slate-400">
                Observações: {currentLessonInfo.notes}
              </p>
            )}
          </div>
        )}

        {message && (
          <div
            className={`mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}

            <span className="font-medium">{message.text}</span>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Lista de chamada</h2>

            <p className="mt-1 text-sm text-slate-400">
              Faça a marcação rápida dos alunos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setAllStatus("Presente")}
              disabled={!selectedClassId}
              className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
            >
              Todos presentes
            </button>

            <button
              onClick={() => setAllStatus("Falta")}
              disabled={!selectedClassId}
              className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              Todos ausentes
            </button>
          </div>
        </div>

        {!selectedClassId ? (
          <p className="mt-4 text-slate-500">Selecione uma turma.</p>
        ) : classStudents.length === 0 ? (
          <p className="mt-4 text-slate-500">Nenhum aluno vinculado.</p>
        ) : (
          <div className="mt-6 space-y-3">
            {classStudents.map((student) => {
              const record = records[student.id] ?? {
                status: "Presente",
                arrival_time: "",
                notes: "",
              };

              const shortName = getShortStudentName(student.name);
              const birthdayToday = isBirthdayOnDate(
                student.birth_date,
                attendanceDate
              );

              return (
                <div
                  key={student.id}
                  className={`rounded-2xl border p-4 transition ${
                    birthdayToday
                      ? "border-pink-400/30 bg-pink-500/10 shadow-lg shadow-pink-500/10"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className="grid gap-3 xl:grid-cols-[220px_330px_120px_minmax(180px,1fr)] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          title={student.name}
                          className="truncate font-semibold text-white"
                        >
                          {shortName}
                        </p>

                        {birthdayToday && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-pink-500/20 px-2 py-1 text-[11px] font-bold text-pink-100">
                            <Cake className="h-3 w-3" />
                            aniversário
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-400">
                        {birthdayToday
                          ? `Faz aniversário em ${formatBirthdayDate(
                              student.birth_date
                            )}`
                          : record.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusButton
                        active={record.status === "Presente"}
                        color="green"
                        icon={<CheckCircle2 size={15} />}
                        label="Presente"
                        onClick={() =>
                          updateRecord(student.id, "status", "Presente")
                        }
                      />

                      <StatusButton
                        active={record.status === "Falta"}
                        color="red"
                        icon={<XCircle size={15} />}
                        label="Falta"
                        onClick={() =>
                          updateRecord(student.id, "status", "Falta")
                        }
                      />

                      <StatusButton
                        active={record.status === "Atraso"}
                        color="yellow"
                        icon={<AlertTriangle size={15} />}
                        label="Atraso"
                        onClick={() =>
                          updateRecord(student.id, "status", "Atraso")
                        }
                      />
                    </div>

                    <input
                      type="time"
                      disabled={record.status !== "Atraso"}
                      value={record.arrival_time}
                      onChange={(event) =>
                        updateRecord(
                          student.id,
                          "arrival_time",
                          event.target.value
                        )
                      }
                      style={{ colorScheme: "dark" }}
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-violet-400 disabled:opacity-40"
                    />

                    <input
                      placeholder="Observação individual..."
                      value={record.notes}
                      onChange={(event) =>
                        updateRecord(student.id, "notes", event.target.value)
                      }
                      className="h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-violet-400"
                    />
                  </div>

                  {birthdayToday && (
                    <div className="mt-3 rounded-2xl border border-pink-400/20 bg-slate-950/40 px-4 py-3 text-sm leading-6 text-pink-100">
                      🎂{" "}
                      {getBirthdayMessageForStudent({
                        student,
                        attendanceDate,
                        birthdayMessages,
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={saveAttendance}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
          >
            <Save size={18} />
            {saving ? "Salvando..." : "Salvar chamada"}
          </button>

          <button
            onClick={copyReport}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            <Clipboard size={18} />
            Copiar relatório
          </button>

          <button
            onClick={copyReportAndOpenClassWhatsapp}
            disabled={!selectedClass?.whatsapp_group_link}
            className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <MessageCircle size={18} />
            Copiar e abrir grupo
          </button>
        </div>

        {selectedClassId && !selectedClass?.whatsapp_group_link && (
          <p className="mt-3 text-xs text-yellow-200">
            Esta turma ainda não possui link de grupo. Cadastre em Dashboard → Turmas.
          </p>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Histórico de frequência</h2>

            <p className="mt-1 text-sm text-slate-400">
              A lista abaixo mostra apenas as frequências da turma selecionada.
            </p>
          </div>
        </div>

        {!selectedClassId ? (
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
            Selecione uma turma para visualizar o histórico de frequência.
          </p>
        ) : loadingAttendanceHistory ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando histórico da turma selecionada...
          </div>
        ) : attendanceHistoryGroups.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
            Nenhuma frequência registrada para esta turma.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {attendanceHistoryGroups.map((group) => {
              const isExpanded = expandedHistoryKey === group.key;
              const presentRows = group.rows.filter(
                (row) => normalizeAttendanceStatus(row.status) === "Presente"
              );
              const delayedRows = group.rows.filter(
                (row) => normalizeAttendanceStatus(row.status) === "Atraso"
              );
              const absentRows = group.rows.filter(
                (row) => normalizeAttendanceStatus(row.status) === "Falta"
              );
              const isDeleting = deletingHistoryKey === group.key;

              function renderHistoryStudentRow(row: AttendanceHistoryRow) {
                const status = normalizeAttendanceStatus(row.status);
                const studentName =
                  studentById.get(row.student_id)?.name ||
                  "Aluno não encontrado";
                const shortName = getShortStudentName(studentName);

                return (
                  <li
                    key={row.id}
                    className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-100">
                        {shortName}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-bold ${
                          status === "Presente"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : status === "Atraso"
                            ? "bg-yellow-500/15 text-yellow-300"
                            : "bg-red-500/15 text-red-300"
                        }`}
                      >
                        {status}
                        {status === "Atraso" && row.arrival_time
                          ? ` • ${row.arrival_time}`
                          : ""}
                      </span>
                    </div>

                    {row.notes && (
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        Observação: {row.notes}
                      </p>
                    )}
                  </li>
                );
              }

              return (
                <div
                  key={group.key}
                  className={`overflow-hidden rounded-2xl border transition ${
                    isExpanded
                      ? "border-violet-500/40 bg-violet-500/5"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedHistoryKey(isExpanded ? null : group.key)
                      }
                      className="grid flex-1 gap-2 rounded-xl px-2 py-2 text-left transition hover:bg-slate-900 sm:grid-cols-[minmax(0,1fr)_120px_80px] sm:items-center"
                    >
                      <span className="min-w-0 truncate font-bold text-white">
                        {group.className}
                      </span>

                      <span className="text-sm font-semibold text-slate-300">
                        {formatDateToBrazilian(group.date)}
                      </span>

                      <span className="text-sm font-semibold text-slate-300">
                        {group.timeLabel}
                      </span>
                    </button>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      <HistoryIconButton
                        label="Detalhes"
                        icon={<Eye className="h-4 w-4" />}
                        onClick={() =>
                          setExpandedHistoryKey(isExpanded ? null : group.key)
                        }
                      />

                      <HistoryIconButton
                        label="Copiar"
                        icon={<Copy className="h-4 w-4" />}
                        onClick={() => copyAttendanceHistoryGroup(group)}
                      />

                      <HistoryIconButton
                        label="Editar"
                        icon={<Edit3 className="h-4 w-4" />}
                        onClick={() => editAttendanceHistoryGroup(group)}
                      />

                      <HistoryIconButton
                        label="Excluir"
                        variant="danger"
                        disabled={isDeleting}
                        icon={
                          isDeleting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )
                        }
                        onClick={() => deleteAttendanceHistoryGroup(group)}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-800 px-4 pb-4 pt-3">
                      <div className="grid gap-3 sm:grid-cols-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                            Total
                          </p>
                          <p className="mt-1 text-xl font-black text-white">
                            {group.total}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                            Presentes
                          </p>
                          <p className="mt-1 text-xl font-black text-emerald-200">
                            {group.presentCount}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-yellow-300">
                            Atrasos
                          </p>
                          <p className="mt-1 text-xl font-black text-yellow-200">
                            {group.delayedCount}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-3">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-red-300">
                            Faltas
                          </p>
                          <p className="mt-1 text-xl font-black text-red-200">
                            {group.absentCount}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                          Informações da aula
                        </p>

                        <p className="mt-2 leading-7 text-slate-200">
                          {group.lesson?.content?.trim() ||
                            "Conteúdo não encontrado no diário."}
                        </p>

                        {group.lesson?.notes && (
                          <p className="mt-2 text-sm leading-6 text-slate-400">
                            Observações da aula: {group.lesson.notes}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <div>
                          <h3 className="mb-2 text-sm font-bold text-emerald-300">
                            Presentes
                          </h3>

                          <ul className="space-y-2">
                            {presentRows.length > 0 ? (
                              presentRows.map(renderHistoryStudentRow)
                            ) : (
                              <li className="text-sm text-slate-500">
                                Nenhum presente registrado.
                              </li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-sm font-bold text-yellow-300">
                            Atrasos
                          </h3>

                          <ul className="space-y-2">
                            {delayedRows.length > 0 ? (
                              delayedRows.map(renderHistoryStudentRow)
                            ) : (
                              <li className="text-sm text-slate-500">
                                Nenhum atraso registrado.
                              </li>
                            )}
                          </ul>
                        </div>

                        <div>
                          <h3 className="mb-2 text-sm font-bold text-red-300">
                            Faltas
                          </h3>

                          <ul className="space-y-2">
                            {absentRows.length > 0 ? (
                              absentRows.map(renderHistoryStudentRow)
                            ) : (
                              <li className="text-sm text-slate-500">
                                Nenhuma falta registrada.
                              </li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusButton({
  active,
  label,
  icon,
  color,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  color: "green" | "red" | "yellow";
  onClick: () => void;
}) {
  const styles = active
    ? color === "green"
      ? "bg-emerald-500 text-white border-emerald-400"
      : color === "red"
      ? "bg-red-500 text-white border-red-400"
      : "bg-yellow-500 text-black border-yellow-400"
    : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${styles}`}
    >
      {icon}
      {label}
    </button>
  );
}

function HistoryIconButton({
  label,
  icon,
  variant = "default",
  disabled = false,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  variant?: "default" | "danger";
  disabled?: boolean;
  onClick: () => void;
}) {
  const styles =
    variant === "danger"
      ? "border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
      : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800";

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition disabled:cursor-not-allowed disabled:opacity-50 ${styles}`}
    >
      {icon}
    </button>
  );
}
