"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clipboard,
  Edit3,
  Save,
  Search,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
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

type Student = {
  id: string;
  name: string;
  class_id: string;
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

type LessonMode = "planned" | "manual";

type CurrentLessonInfo = {
  source: LessonMode;
  courseName: string;
  title: string;
  content: string;
  notes: string | null;
  label: string;
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

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Não foi possível concluir a operação.";
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

function getLessonLabel(lesson: Lesson) {
  return `${lesson.course_name} — ${
    lesson.lesson_order > 0 ? `Aula ${lesson.lesson_order}: ` : ""
  }${lesson.title}`;
}

function getMotivationalMessage(seed: string) {
  const normalizedSeed = normalizeText(seed);

  const hash = normalizedSeed.split("").reduce((total, char, index) => {
    return total + char.charCodeAt(0) * (index + 1);
  }, 0);

  return motivationalMessages[hash % motivationalMessages.length];
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

  const [lessonMode, setLessonMode] = useState<LessonMode>("planned");
  const [manualLessonTitle, setManualLessonTitle] = useState("");
  const [manualLessonContent, setManualLessonContent] = useState("");

  const [attendanceDate, setAttendanceDate] = useState(getTodayDate);
  const [teacherName, setTeacherName] = useState("Professor");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const [lessonMenuOpen, setLessonMenuOpen] = useState(false);
  const [lessonSearch, setLessonSearch] = useState("");

  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});

  const selectedClass = classes.find((item) => item.id === selectedClassId);

  const selectedLesson = lessons.find(
    (lesson) =>
      lesson.id === selectedLessonId && lesson.class_id === selectedClassId
  );

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

  const classStudents = useMemo(() => {
    return students.filter((student) => student.class_id === selectedClassId);
  }, [students, selectedClassId]);

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

    return null;
  }, [lessonMode, selectedLesson, manualLessonTitle, manualLessonContent]);

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

      const time =
        record.status === "Atraso" && record.arrival_time
          ? ` (${record.arrival_time})`
          : "";

      const note = record.notes.trim()
        ? `\n   _Obs.: ${record.notes.trim()}_`
        : "";

      return `• ${shortName}${time}${note}`;
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
❌ Faltas: ${absentStudents.length}

💬 *Mensagem do dia*
_${motivationalMessage}_`;
  }, [
    selectedClass,
    currentLessonInfo,
    classStudents,
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

    await navigator.clipboard.writeText(reportText);

    setMessage({
      type: "success",
      text: "Relatório copiado com layout melhorado para WhatsApp!",
    });
  }

  function handleSelectLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setLessonMenuOpen(false);
    setLessonSearch("");
    setMessage(null);
  }

  function handleLessonModeChange(mode: LessonMode) {
    setLessonMode(mode);
    setMessage(null);

    if (mode === "manual") {
      setSelectedLessonId("");
      setLessonMenuOpen(false);
      setLessonSearch("");
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
              setLessonMenuOpen(false);
              setLessonSearch("");
              setRecords({});
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
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                onClick={() => handleLessonModeChange("planned")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  lessonMode === "planned"
                    ? "bg-violet-500 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Aula da grade
              </button>

              <button
                type="button"
                onClick={() => handleLessonModeChange("manual")}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  lessonMode === "manual"
                    ? "bg-cyan-500 text-white"
                    : "text-slate-400 hover:bg-slate-800"
                }`}
              >
                Aula manual
              </button>
            </div>
          </div>
        </div>

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
        ) : (
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

              return (
                <div
                  key={student.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="grid gap-3 xl:grid-cols-[220px_330px_120px_minmax(180px,1fr)] xl:items-center">
                    <div className="min-w-0">
                      <p
                        title={student.name}
                        className="truncate font-semibold text-white"
                      >
                        {shortName}
                      </p>

                      <p className="text-sm text-slate-400">{record.status}</p>
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
        </div>
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
  icon: React.ReactNode;
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