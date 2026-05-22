"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  Clipboard,
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
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 3) {
    return name;
  }

  const ignoredParticles = ["da", "de", "do", "das", "dos", "e"];

  const filteredParts = parts.filter(
    (part) => !ignoredParticles.includes(part.toLowerCase())
  );

  if (filteredParts.length <= 3) {
    return filteredParts.join(" ");
  }

  return filteredParts.slice(0, 3).join(" ");
}

function getLessonLabel(lesson: Lesson) {
  return `${lesson.course_name} — ${
    lesson.lesson_order > 0 ? `Aula ${lesson.lesson_order}: ` : ""
  }${lesson.title}`;
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
    if (!selectedClassId || !selectedLesson || !attendanceDate) {
      return null;
    }

    const diaryContent =
      selectedLesson.content.trim() || selectedLesson.title.trim();

    const diaryNotes = [
      `Curso: ${selectedLesson.course_name}`,
      selectedLesson.lesson_order > 0
        ? `Aula ${selectedLesson.lesson_order}: ${selectedLesson.title}`
        : selectedLesson.title,
      selectedLesson.notes?.trim() || "",
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

    if (!selectedClassId || !selectedLessonId || !selectedLesson) {
      setMessage({
        type: "error",
        text: "Selecione a turma e a aula antes de salvar a chamada.",
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
    if (!selectedClass || !selectedLesson) {
      return "";
    }

    const date = formatDateToBrazilian(attendanceDate);

    const lines = classStudents.map((student) => {
      const record = records[student.id] ?? {
        status: "Presente",
        arrival_time: "",
        notes: "",
      };

      const icon =
        record.status === "Presente"
          ? "✅"
          : record.status === "Atraso"
            ? "⚠️"
            : "❌";

      const time =
        record.status === "Atraso" && record.arrival_time
          ? ` (${record.arrival_time})`
          : "";

      const note = record.notes ? ` — ${record.notes}` : "";

      return `${icon} ${student.name} — ${record.status}${time}${note}`;
    });

    const lessonLabel =
      selectedLesson.lesson_order > 0
        ? `Aula ${selectedLesson.lesson_order} — ${selectedLesson.title}`
        : selectedLesson.title;

    return `📚 ${selectedClass.name}
📅 ${date}
👨‍🏫 ${teacherName}
📘 ${selectedLesson.course_name}
📖 ${lessonLabel}
📝 ${selectedLesson.content}

${lines.join("\n")}`;
  }, [
    selectedClass,
    selectedLesson,
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
        text: "Selecione turma e aula antes de copiar o relatório.",
      });

      return;
    }

    await navigator.clipboard.writeText(reportText);

    setMessage({
      type: "success",
      text: "Relatório copiado!",
    });
  }

  function handleSelectLesson(lesson: Lesson) {
    setSelectedLessonId(lesson.id);
    setLessonMenuOpen(false);
    setLessonSearch("");
    setMessage(null);
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
                  : "Selecione a aula"}
              </span>

              <ChevronDown size={18} className="shrink-0 text-slate-300" />
            </button>

            {lessonMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-full overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl xl:w-[520px]">
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
        </div>

        {selectedClassId && classLessons.length === 0 && (
          <div className="mt-6 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
            Nenhuma aula encontrada para esta turma. Verifique se a turma possui
            cursos vinculados e se esses cursos possuem grade curricular
            cadastrada.
          </div>
        )}

        {selectedLesson && (
          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-xl bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-200">
                {selectedLesson.course_name}
              </span>

              <span className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
                {selectedLesson.lesson_order > 0
                  ? `Aula ${selectedLesson.lesson_order}`
                  : "Aula"}
              </span>
            </div>

            <p className="mt-4 font-semibold text-violet-200">
              {selectedLesson.title}
            </p>

            <p className="mt-2 leading-7 text-slate-300">
              {selectedLesson.content}
            </p>

            {selectedLesson.notes && (
              <p className="mt-2 text-sm text-slate-400">
                Observações: {selectedLesson.notes}
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