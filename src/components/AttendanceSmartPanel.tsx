"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  Clipboard,
  Save,
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
  lesson_date: string;
  content: string;
  notes: string | null;
};

type Student = {
  id: string;
  name: string;
  class_id: string;
};

type AttendanceStatus =
  | "Presente"
  | "Falta"
  | "Atraso";

type AttendanceRecord = {
  status: AttendanceStatus;
  arrival_time: string;
  notes: string;
};

export function AttendanceSmartPanel({
  classes,
  lessons,
  students,
}: {
  classes: ClassItem[];
  lessons: Lesson[];
  students: Student[];
}) {
  const [selectedClassId, setSelectedClassId] =
    useState("");

  const [selectedLessonId, setSelectedLessonId] =
    useState("");

  const [teacherName, setTeacherName] =
    useState("Professor");

  const [records, setRecords] = useState<
    Record<string, AttendanceRecord>
  >({});

  const selectedClass = classes.find(
    (item) => item.id === selectedClassId
  );

  const selectedLesson = lessons.find(
    (lesson) => lesson.id === selectedLessonId
  );

  const classLessons = useMemo(() => {
    return lessons.filter(
      (lesson) =>
        lesson.class_id === selectedClassId
    );
  }, [lessons, selectedClassId]);

  const classStudents = useMemo(() => {
    return students.filter(
      (student) =>
        student.class_id === selectedClassId
    );
  }, [students, selectedClassId]);

  function updateRecord(
    studentId: string,
    field: keyof AttendanceRecord,
    value: string
  ) {
    setRecords((current) => ({
      ...current,

      [studentId]: {
        status:
          current[studentId]?.status ??
          "Presente",

        arrival_time:
          current[studentId]?.arrival_time ??
          "",

        notes:
          current[studentId]?.notes ?? "",

        [field]: value,
      },
    }));
  }

  function setAllStatus(
    status: AttendanceStatus
  ) {
    const updated: Record<
      string,
      AttendanceRecord
    > = {};

    classStudents.forEach((student) => {
      updated[student.id] = {
        status,
        arrival_time: "",
        notes: "",
      };
    });

    setRecords(updated);
  }

  async function saveAttendance() {
    if (
      !selectedClassId ||
      !selectedLessonId
    ) {
      toast.error(
        "Selecione a turma e a aula."
      );

      return;
    }

    const rows = classStudents.map(
      (student) => {
        const record =
          records[student.id] ?? {
            status: "Presente",
            arrival_time: "",
            notes: "",
          };

        return {
          student_id: student.id,
          class_id: selectedClassId,
          lesson_id: selectedLessonId,

          date:
            selectedLesson?.lesson_date ??
            new Date()
              .toISOString()
              .split("T")[0],

          status: record.status,

          arrival_time:
            record.status === "Atraso"
              ? record.arrival_time
              : "",

          notes: record.notes,
        };
      }
    );

    const { error } = await supabase
      .from("attendance")
      .insert(rows);

    if (error) {
      toast.error(
        "Erro ao salvar chamada."
      );

      alert(error.message);

      return;
    }

    toast.success(
      "Chamada salva com sucesso!"
    );
  }

  const reportText = useMemo(() => {
    if (
      !selectedClass ||
      !selectedLesson
    ) {
      return "";
    }

    const date = new Date(
      selectedLesson.lesson_date
    ).toLocaleDateString("pt-BR");

    const lines = classStudents.map(
      (student) => {
        const record =
          records[student.id] ?? {
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
          record.status === "Atraso" &&
          record.arrival_time
            ? ` (${record.arrival_time})`
            : "";

        const note = record.notes
          ? ` — ${record.notes}`
          : "";

        return `${icon} ${student.name} — ${record.status}${time}${note}`;
      }
    );

    return `📚 ${selectedClass.name}
📅 ${date}
👨‍🏫 ${teacherName}
📖 ${selectedLesson.content}

${lines.join("\n")}`;
  }, [
    selectedClass,
    selectedLesson,
    classStudents,
    records,
    teacherName,
  ]);

  async function copyReport() {
    if (!reportText) {
      toast.error(
        "Selecione turma e aula."
      );

      return;
    }

    await navigator.clipboard.writeText(
      reportText
    );

    toast.success(
      "Relatório copiado!"
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">
          Configurar chamada
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            placeholder="Nome do professor"
            value={teacherName}
            onChange={(event) =>
              setTeacherName(
                event.target.value
              )
            }
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />

          <select
            value={selectedClassId}
            onChange={(event) => {
              setSelectedClassId(
                event.target.value
              );

              setSelectedLessonId("");

              setRecords({});
            }}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          >
            <option value="">
              Selecione a turma
            </option>

            {classes.map((classItem) => (
              <option
                key={classItem.id}
                value={classItem.id}
              >
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLessonId}
            onChange={(event) =>
              setSelectedLessonId(
                event.target.value
              )
            }
            disabled={!selectedClassId}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 disabled:opacity-50"
          >
            <option value="">
              Selecione a aula
            </option>

            {classLessons.map((lesson) => (
              <option
                key={lesson.id}
                value={lesson.id}
              >
                {new Date(
                  lesson.lesson_date
                ).toLocaleDateString(
                  "pt-BR"
                )}{" "}
                — {lesson.content}
              </option>
            ))}
          </select>
        </div>

        {selectedLesson && (
          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <p className="font-semibold text-violet-200">
              Conteúdo da aula
            </p>

            <p className="mt-2 leading-7 text-slate-300">
              {selectedLesson.content}
            </p>

            {selectedLesson.notes && (
              <p className="mt-2 text-sm text-slate-400">
                Observações:{" "}
                {selectedLesson.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              Lista de chamada
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Faça a marcação rápida
              dos alunos.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() =>
                setAllStatus("Presente")
              }
              className="rounded-2xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              Todos presentes
            </button>

            <button
              onClick={() =>
                setAllStatus("Falta")
              }
              className="rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
            >
              Todos ausentes
            </button>
          </div>
        </div>

        {!selectedClassId ? (
          <p className="mt-4 text-slate-500">
            Selecione uma turma.
          </p>
        ) : classStudents.length === 0 ? (
          <p className="mt-4 text-slate-500">
            Nenhum aluno vinculado.
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            {classStudents.map((student) => {
              const record =
                records[student.id] ?? {
                  status: "Presente",
                  arrival_time: "",
                  notes: "",
                };

              return (
                <div
                  key={student.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                    <div className="min-w-[220px]">
                      <p className="font-semibold text-white">
                        {student.name}
                      </p>

                      <p className="text-sm text-slate-400">
                        {record.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <StatusButton
                        active={
                          record.status ===
                          "Presente"
                        }
                        color="green"
                        icon={
                          <CheckCircle2
                            size={15}
                          />
                        }
                        label="Presente"
                        onClick={() =>
                          updateRecord(
                            student.id,
                            "status",
                            "Presente"
                          )
                        }
                      />

                      <StatusButton
                        active={
                          record.status ===
                          "Falta"
                        }
                        color="red"
                        icon={
                          <XCircle
                            size={15}
                          />
                        }
                        label="Falta"
                        onClick={() =>
                          updateRecord(
                            student.id,
                            "status",
                            "Falta"
                          )
                        }
                      />

                      <StatusButton
                        active={
                          record.status ===
                          "Atraso"
                        }
                        color="yellow"
                        icon={
                          <AlertTriangle
                            size={15}
                          />
                        }
                        label="Atraso"
                        onClick={() =>
                          updateRecord(
                            student.id,
                            "status",
                            "Atraso"
                          )
                        }
                      />
                    </div>

                    <input
                      type="time"
                      disabled={
                        record.status !==
                        "Atraso"
                      }
                      value={
                        record.arrival_time
                      }
                      onChange={(event) =>
                        updateRecord(
                          student.id,
                          "arrival_time",
                          event.target.value
                        )
                      }
                      className="h-11 w-[120px] rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-violet-400 disabled:opacity-40"
                    />

                    <input
                      placeholder="Observação individual..."
                      value={record.notes}
                      onChange={(event) =>
                        updateRecord(
                          student.id,
                          "notes",
                          event.target.value
                        )
                      }
                      className="h-11 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-violet-400"
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
            className="flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-semibold text-white transition hover:bg-violet-400"
          >
            <Save size={18} />
            Salvar chamada
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
      onClick={onClick}
      className={`flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition ${styles}`}
    >
      {icon}
      {label}
    </button>
  );
}