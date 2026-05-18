"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { CalendarPlus } from "lucide-react";
import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
  course_id: string | null;
};

type Course = {
  id: string;
  name: string;
};

type CurriculumLesson = {
  id: string;
  course_id: string;
  lesson_order: number | null;
  title: string;
  content: string | null;
  notes: string | null;
};

export function NewDiaryLessonForm({
  classes,
  courses,
  curriculumLessons,
}: {
  classes: ClassItem[];
  courses: Course[];
  curriculumLessons: CurriculumLesson[];
}) {
  const [classId, setClassId] = useState("");
  const [curriculumLessonId, setCurriculumLessonId] = useState("");
  const [lessonDate, setLessonDate] = useState("");
  const [content, setContent] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const selectedClass = classes.find((item) => item.id === classId);

  const selectedCourse = courses.find(
    (course) => course.id === selectedClass?.course_id
  );

  const availableLessons = useMemo(() => {
    if (!selectedClass?.course_id) return [];

    return curriculumLessons.filter(
      (lesson) => lesson.course_id === selectedClass.course_id
    );
  }, [selectedClass, curriculumLessons]);

  function handleSelectCurriculumLesson(id: string) {
    setCurriculumLessonId(id);

    const lesson = curriculumLessons.find((item) => item.id === id);

    if (!lesson) {
      setContent("");
      setNotes("");
      return;
    }

    setContent(lesson.content || lesson.title);
    setNotes(lesson.notes || "");
  }

  async function handleCreateLesson() {
    if (!classId || !lessonDate || !content) {
      toast.error("Selecione a turma, a data e informe o conteúdo.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("lesson_diary").insert({
      class_id: classId,
      curriculum_lesson_id: curriculumLessonId || null,
      lesson_date: lessonDate,
      content,
      notes,
    });

    setLoading(false);

    if (error) {
      toast.error("Erro ao registrar aula.");
      console.error(error);
      return;
    }

    toast.success("Aula registrada no diário!");

    setClassId("");
    setCurriculumLessonId("");
    setLessonDate("");
    setContent("");
    setNotes("");

    setTimeout(() => {
      window.location.reload();
    }, 800);
  }

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <h2 className="text-2xl font-bold">Registrar aula</h2>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <select
          value={classId}
          onChange={(event) => {
            setClassId(event.target.value);
            setCurriculumLessonId("");
            setContent("");
            setNotes("");
          }}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        >
          <option value="">Selecione a turma</option>

          {classes.map((classItem) => {
            const course = courses.find(
              (item) => item.id === classItem.course_id
            );

            return (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
                {course?.name ? ` — ${course.name}` : ""}
              </option>
            );
          })}
        </select>

        <input
          type="date"
          value={lessonDate}
          onChange={(event) => setLessonDate(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        {selectedClass && (
          <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-violet-200 md:col-span-2">
            Curso vinculado:{" "}
            <strong>
              {selectedCourse?.name ?? "Esta turma ainda não possui curso"}
            </strong>
          </div>
        )}

        <select
          value={curriculumLessonId}
          onChange={(event) => handleSelectCurriculumLesson(event.target.value)}
          disabled={!classId || availableLessons.length === 0}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 disabled:opacity-50 md:col-span-2"
        >
          <option value="">
            {!classId
              ? "Selecione primeiro uma turma"
              : availableLessons.length === 0
              ? "Nenhuma aula cadastrada na grade deste curso"
              : "Selecione uma aula da grade curricular"}
          </option>

          {availableLessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              Aula {lesson.lesson_order ?? "-"} — {lesson.title}
            </option>
          ))}
        </select>

        <input
          placeholder="Conteúdo ministrado"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
        />

        <textarea
          placeholder="Observações da aula"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={4}
          className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
        />
      </div>

      <button
        onClick={handleCreateLesson}
        disabled={loading}
        className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
      >
        <CalendarPlus size={18} />
        {loading ? "Salvando..." : "Registrar aula"}
      </button>
    </div>
  );
}