"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { Clipboard, Save } from "lucide-react";
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

type AttendanceStatus = "Presente" | "Falta" | "Atraso";

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
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [teacherName, setTeacherName] = useState("Professor");
  const [records, setRecords] = useState<Record<string, AttendanceRecord>>({});

  const selectedClass = classes.find((item) => item.id === selectedClassId);

  const classLessons = useMemo(() => {
    return lessons.filter((lesson) => lesson.class_id === selectedClassId);
  }, [lessons, selectedClassId]);

  const selectedLesson = lessons.find((lesson) => lesson.id === selectedLessonId);

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

  async function saveAttendance() {
    if (!selectedClassId || !selectedLessonId) {
      toast.error("Selecione a turma e a aula antes de salvar.");
      return;
    }

    if (classStudents.length === 0) {
      toast.error("Essa turma ainda não possui alunos vinculados.");
      return;
    }

    const today = selectedLesson?.lesson_date ?? new Date().toISOString().split("T")[0];

    const rows = classStudents.map((student) => {
      const record = records[student.id] ?? {
        status: "Presente",
        arrival_time: "",
        notes: "",
      };

      return {
        student_id: student.id,
        class_id: selectedClassId,
        lesson_id: selectedLessonId,
        date: today,
        status: record.status,
        arrival_time: record.status === "Atraso" ? record.arrival_time : "",
        notes: record.notes,
      };
    });

    const { error } = await supabase.from("attendance").insert(rows);

    if (error) {
      toast.error("Erro ao salvar chamada.");
      alert(error.message);
console.error(error);
      return;
    }

    toast.success("Chamada salva com sucesso!");
  }

  const reportText = useMemo(() => {
    if (!selectedClass || !selectedLesson) {
      return "";
    }

    const date = new Date(selectedLesson.lesson_date).toLocaleDateString("pt-BR");

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

      const note = record.notes ? ` — Obs.: ${record.notes}` : "";

      return `${icon} ${student.name} — ${record.status}${time}${note}`;
    });

    return `📚 Chamada - ${selectedClass.name}
📅 ${date}
👨‍🏫 Professor: ${teacherName}
📖 Aula: ${selectedLesson.content}

${lines.join("\n")}`;
  }, [selectedClass, selectedLesson, classStudents, records, teacherName]);

  async function copyReport() {
    if (!reportText) {
      toast.error("Selecione turma e aula para gerar o relatório.");
      return;
    }

    await navigator.clipboard.writeText(reportText);
    toast.success("Relatório copiado para o WhatsApp!");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Configurar chamada</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            placeholder="Nome do professor"
            value={teacherName}
            onChange={(event) => setTeacherName(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />

          <select
            value={selectedClassId}
            onChange={(event) => {
              setSelectedClassId(event.target.value);
              setSelectedLessonId("");
              setRecords({});
            }}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          >
            <option value="">Selecione a turma</option>

            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLessonId}
            onChange={(event) => setSelectedLessonId(event.target.value)}
            disabled={!selectedClassId}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 disabled:opacity-50"
          >
            <option value="">Selecione a aula do diário</option>

            {classLessons.map((lesson) => (
              <option key={lesson.id} value={lesson.id}>
                {new Date(lesson.lesson_date).toLocaleDateString("pt-BR")} —{" "}
                {lesson.content}
              </option>
            ))}
          </select>
        </div>

        {selectedLesson && (
          <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
            <p className="font-semibold text-violet-200">Conteúdo da aula</p>
            <p className="mt-2 leading-7 text-slate-300">{selectedLesson.content}</p>

            {selectedLesson.notes && (
              <p className="mt-2 text-sm text-slate-400">
                Observações do diário: {selectedLesson.notes}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Lista de chamada</h2>

        {!selectedClassId ? (
          <p className="mt-4 text-slate-500">
            Selecione uma turma para carregar os alunos.
          </p>
        ) : classStudents.length === 0 ? (
          <p className="mt-4 text-slate-500">
            Nenhum aluno vinculado a esta turma.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {classStudents.map((student) => {
              const record = records[student.id] ?? {
                status: "Presente",
                arrival_time: "",
                notes: "",
              };

              return (
                <div
                  key={student.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <p className="font-semibold">{student.name}</p>
                      <p className="text-sm text-slate-500">
                        Status atual: {record.status}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(["Presente", "Falta", "Atraso"] as AttendanceStatus[]).map(
                        (status) => (
                          <button
                            key={status}
                            onClick={() => updateRecord(student.id, "status", status)}
                            className={`rounded-xl px-4 py-2 font-medium transition ${
                              record.status === status
                                ? "bg-violet-500 text-white"
                                : "bg-slate-900 text-slate-300 hover:bg-white/5"
                            }`}
                          >
                            {status}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <input
                      type="time"
                      value={record.arrival_time}
                      onChange={(event) =>
                        updateRecord(student.id, "arrival_time", event.target.value)
                      }
                      disabled={record.status !== "Atraso"}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 disabled:opacity-40"
                    />

                    <input
                      placeholder="Observação individual"
                      value={record.notes}
                      onChange={(event) =>
                        updateRecord(student.id, "notes", event.target.value)
                      }
                      className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
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
            className="flex items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400"
          >
            <Save size={18} />
            Salvar chamada
          </button>

          <button
            onClick={copyReport}
            className="flex items-center gap-2 rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-white/5"
          >
            <Clipboard size={18} />
            Copiar relatório
          </button>
        </div>
      </div>

      {reportText && (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold">Prévia do relatório WhatsApp</h2>

          <pre className="mt-6 whitespace-pre-wrap rounded-2xl border border-slate-800 bg-slate-950/60 p-5 leading-7 text-slate-300">
            {reportText}
          </pre>
        </div>
      )}
    </div>
  );
}