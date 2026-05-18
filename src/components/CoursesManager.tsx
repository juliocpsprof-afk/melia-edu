"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { BookOpen, Plus, Save } from "lucide-react";
import { supabase } from "../lib/supabase";

type Course = {
  id: string;
  name: string;
  description: string | null;
  curriculum_lessons: {
    id: string;
    title: string;
    lesson_order: number | null;
  }[];
};

export function CoursesManager({ courses }: { courses: Course[] }) {
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonContent, setLessonContent] = useState("");
  const [lessonNotes, setLessonNotes] = useState("");
  const [bulkLessons, setBulkLessons] = useState("");

  async function createCourse() {
    if (!courseName) {
      toast.error("Digite o nome do curso.");
      return;
    }

    const { error } = await supabase.from("courses").insert({
      name: courseName,
      description: courseDescription,
    });

    if (error) {
      toast.error("Erro ao cadastrar curso.");
      console.error(error);
      return;
    }

    toast.success("Curso cadastrado!");
    setCourseName("");
    setCourseDescription("");
    setTimeout(() => window.location.reload(), 700);
  }

  async function addLesson() {
    if (!selectedCourseId || !lessonTitle) {
      toast.error("Selecione o curso e informe o título da aula.");
      return;
    }

    const selectedCourse = courses.find((course) => course.id === selectedCourseId);
    const nextOrder = (selectedCourse?.curriculum_lessons?.length ?? 0) + 1;

    const { error } = await supabase.from("curriculum_lessons").insert({
      course_id: selectedCourseId,
      lesson_order: nextOrder,
      title: lessonTitle,
      content: lessonContent,
      notes: lessonNotes,
    });

    if (error) {
      toast.error("Erro ao cadastrar aula.");
      console.error(error);
      return;
    }

    toast.success("Aula adicionada à grade!");
    setLessonTitle("");
    setLessonContent("");
    setLessonNotes("");
    setTimeout(() => window.location.reload(), 700);
  }

  async function addBulkLessons() {
  if (!bulkLessons.trim()) {
    toast.error("Cole a lista de aulas para inserir em massa.");
    return;
  }

  const rows = bulkLessons
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separator = line.includes("\t") ? "\t" : ";";

      const [courseName, lessonTitle, lessonContent, lessonNotes] = line
        .split(separator)
        .map((item) => item.trim());

      const course = courses.find(
        (item) =>
          item.name.toLowerCase() === courseName?.toLowerCase()
      );

      if (!course || !lessonTitle || !lessonContent) {
        return null;
      }

      const currentCount =
        course.curriculum_lessons?.length ?? 0;

      return {
        course_id: course.id,
        lesson_order: currentCount + index + 1,
        title: lessonTitle,
        content: lessonContent,
        notes: lessonNotes ?? "",
      };
    })
    .filter(Boolean);

  if (rows.length === 0) {
    toast.error(
      "Nenhuma linha válida encontrada. Verifique se o nome do curso está igual ao cadastrado."
    );
    return;
  }

  const { error } = await supabase
    .from("curriculum_lessons")
    .insert(rows);

  if (error) {
    toast.error("Erro ao inserir grade em massa.");
    console.error(error);
    return;
  }

  toast.success("Grade curricular inserida com sucesso!");

  setBulkLessons("");

  setTimeout(() => {
    window.location.reload();
  }, 700);
}

  const selectedCourse = courses.find((course) => course.id === selectedCourseId);

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Cadastrar curso</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            placeholder="Nome do curso"
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />

          <input
            placeholder="Descrição do curso"
            value={courseDescription}
            onChange={(event) => setCourseDescription(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />
        </div>

        <button
          onClick={createCourse}
          className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400"
        >
          <Plus size={18} />
          Salvar curso
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Cadastrar grade curricular</h2>

        <div className="mt-6 grid gap-4">
          <select
            value={selectedCourseId}
            onChange={(event) => setSelectedCourseId(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          >
            <option value="">Selecione o curso</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <div className="grid gap-4 md:grid-cols-3">
            <input
              placeholder="Título da aula"
              value={lessonTitle}
              onChange={(event) => setLessonTitle(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />

            <input
              placeholder="Conteúdo sugerido"
              value={lessonContent}
              onChange={(event) => setLessonContent(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />

            <input
              placeholder="Observações padrão"
              value={lessonNotes}
              onChange={(event) => setLessonNotes(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            />
          </div>

          <button
            onClick={addLesson}
            className="flex w-fit items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400"
          >
            <Save size={18} />
            Adicionar aula
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Inserção em massa da grade</h2>

        <p className="mt-2 text-slate-400">
          Cole uma aula por linha. Cada linha será salva como uma aula da grade curricular.
        </p>

        <textarea
          placeholder={`Modelo:
Curso;Tipo de aula;Conteúdo sugerido;Observação padrão
Matemática;Aula 1 - Introdução;Apresentação dos conceitos iniciais;Observar participação dos alunos
Matemática;Aula 2 - Operações;Adição e subtração;Aplicar exercício diagnóstico
Wisdom;Aula 1 - Acolhimento;Apresentação do curso;Registrar expectativas da turma`}
          value={bulkLessons}
          onChange={(event) => setBulkLessons(event.target.value)}
          rows={8}
          className="mt-6 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
        />

        <button
          onClick={addBulkLessons}
          className="mt-5 flex items-center gap-2 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400"
        >
          <BookOpen size={18} />
          Inserir grade em massa
        </button>
      </div>

      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Cursos cadastrados</h2>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          {courses.length === 0 ? (
            <p className="text-slate-500">Nenhum curso cadastrado ainda.</p>
          ) : (
            courses.map((course) => (
              <div
                key={course.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
              >
                <h3 className="text-xl font-bold">{course.name}</h3>

                {course.description && (
                  <p className="mt-2 text-slate-400">{course.description}</p>
                )}

                <div className="mt-5 space-y-2">
                  {(course.curriculum_lessons ?? [])
                    .sort(
                      (a, b) =>
                        Number(a.lesson_order ?? 0) - Number(b.lesson_order ?? 0)
                    )
                    .map((lesson) => (
                      <div
                        key={lesson.id}
                        className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300"
                      >
                        Aula {lesson.lesson_order ?? "-"} — {lesson.title}
                      </div>
                    ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}