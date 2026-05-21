"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type CurriculumLesson = {
  id: string;
  title: string;
  content: string;
  notes: string;
  lesson_order: number | null;
};

type Course = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  curriculum_lessons: CurriculumLesson[];
};

export function CoursesManager({ courses }: { courses: Course[] }) {
  const [courseName, setCourseName] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [bulkLessons, setBulkLessons] = useState("");
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [openCourseId, setOpenCourseId] = useState("");

  const [editingCourseId, setEditingCourseId] = useState("");
  const [editCourseName, setEditCourseName] = useState("");
  const [editCourseDescription, setEditCourseDescription] = useState("");

  const [editingLessonId, setEditingLessonId] = useState("");
  const [editLessonTitle, setEditLessonTitle] = useState("");
  const [editLessonContent, setEditLessonContent] = useState("");
  const [editLessonNotes, setEditLessonNotes] = useState("");

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  const activeCourses = useMemo(
    () => courses.filter((course) => course.status !== "Arquivado"),
    [courses]
  );

  const archivedCourses = useMemo(
    () => courses.filter((course) => course.status === "Arquivado"),
    [courses]
  );

  const filteredActiveCourses = useMemo(() => {
    const query = normalizeText(search);

    if (!query) return activeCourses;

    return activeCourses.filter((course) =>
      normalizeText(`${course.name} ${course.description || ""}`).includes(query)
    );
  }, [activeCourses, search]);

  async function createCourse() {
    if (!courseName.trim()) {
      alert("Digite o nome do curso.");
      return;
    }

    setLoading(true);

    const { data: createdCourse, error: courseError } = await supabase
      .from("courses")
      .insert({
        name: courseName.trim(),
        description: courseDescription.trim() || null,
        status: "Ativo",
      })
      .select("id")
      .single();

    if (courseError || !createdCourse) {
      setLoading(false);
      alert(courseError?.message || "Erro ao criar curso.");
      return;
    }

    const lessonLines = bulkLessons
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lessonLines.length > 0) {
      const lessonsToInsert = lessonLines.map((line, index) => ({
        course_id: createdCourse.id,
        title: line,
        content: "",
        notes: "",
        lesson_order: index + 1,
      }));

      const { error: lessonsError } = await supabase
        .from("curriculum_lessons")
        .insert(lessonsToInsert);

      if (lessonsError) {
        setLoading(false);
        alert("Curso criado, mas houve erro ao criar as aulas.");
        return;
      }
    }

    setLoading(false);
    setCourseName("");
    setCourseDescription("");
    setBulkLessons("");

    window.location.reload();
  }

  function startEditCourse(course: Course) {
    setEditingCourseId(course.id);
    setEditCourseName(course.name);
    setEditCourseDescription(course.description || "");
  }

  function cancelEditCourse() {
    setEditingCourseId("");
    setEditCourseName("");
    setEditCourseDescription("");
  }

  async function saveCourse(courseId: string) {
    if (!editCourseName.trim()) {
      alert("Digite o nome do curso.");
      return;
    }

    const { error } = await supabase
      .from("courses")
      .update({
        name: editCourseName.trim(),
        description: editCourseDescription.trim() || null,
      })
      .eq("id", courseId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function archiveCourse(courseId: string) {
    const { error } = await supabase
      .from("courses")
      .update({ status: "Arquivado" })
      .eq("id", courseId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function restoreCourse(courseId: string) {
    const { error } = await supabase
      .from("courses")
      .update({ status: "Ativo" })
      .eq("id", courseId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function deleteCourse(courseId: string) {
    const confirmed = confirm(
      "Deseja excluir este curso? Isso removerá também as aulas da grade curricular."
    );

    if (!confirmed) return;

    const { error: lessonsError } = await supabase
      .from("curriculum_lessons")
      .delete()
      .eq("course_id", courseId);

    if (lessonsError) {
      alert(lessonsError.message);
      return;
    }

    const { error } = await supabase.from("courses").delete().eq("id", courseId);

    if (error) {
      alert(
        "Não foi possível excluir este curso. Ele pode estar vinculado a turmas ou outros registros. Nesse caso, use Arquivar."
      );
      return;
    }

    window.location.reload();
  }

  function startEditLesson(lesson: CurriculumLesson) {
    setEditingLessonId(lesson.id);
    setEditLessonTitle(lesson.title);
    setEditLessonContent(lesson.content || "");
    setEditLessonNotes(lesson.notes || "");
  }

  function cancelEditLesson() {
    setEditingLessonId("");
    setEditLessonTitle("");
    setEditLessonContent("");
    setEditLessonNotes("");
  }

  async function saveLesson(lessonId: string) {
    if (!editLessonTitle.trim()) {
      alert("Digite o título da aula.");
      return;
    }

    const { error } = await supabase
      .from("curriculum_lessons")
      .update({
        title: editLessonTitle.trim(),
        content: editLessonContent.trim(),
        notes: editLessonNotes.trim(),
      })
      .eq("id", lessonId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function deleteLesson(lessonId: string) {
    const confirmed = confirm("Deseja excluir esta aula da grade curricular?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("curriculum_lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function moveLesson(
    lessons: CurriculumLesson[],
    lessonId: string,
    direction: "up" | "down"
  ) {
    const ordered = [...lessons].sort(
      (a, b) => Number(a.lesson_order ?? 0) - Number(b.lesson_order ?? 0)
    );

    const currentIndex = ordered.findIndex((lesson) => lesson.id === lessonId);
    if (currentIndex === -1) return;

    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= ordered.length) return;

    const reordered = [...ordered];
    const [removed] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, removed);

    const updates = reordered.map((lesson, index) =>
      supabase
        .from("curriculum_lessons")
        .update({ lesson_order: index + 1 })
        .eq("id", lesson.id)
    );

    const results = await Promise.all(updates);
    const hasError = results.some((result) => result.error);

    if (hasError) {
      alert("Erro ao reordenar aulas.");
      return;
    }

    window.location.reload();
  }

  async function addLessonToCourse(course: Course) {
    const title = prompt("Digite o título da nova aula:");

    if (!title?.trim()) return;

    const nextOrder = course.curriculum_lessons.length + 1;

    const { error } = await supabase.from("curriculum_lessons").insert({
      course_id: course.id,
      title: title.trim(),
      content: "",
      notes: "",
      lesson_order: nextOrder,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
            <Plus size={24} />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white">Novo curso</h2>
            <p className="text-sm text-slate-400">
              Crie o curso e cole as aulas da grade uma por linha.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            value={courseName}
            onChange={(event) => setCourseName(event.target.value)}
            placeholder="Nome do curso"
            className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
          />

          <input
            value={courseDescription}
            onChange={(event) => setCourseDescription(event.target.value)}
            placeholder="Descrição do curso"
            className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm text-white outline-none focus:border-violet-400"
          />

          <textarea
            value={bulkLessons}
            onChange={(event) => setBulkLessons(event.target.value)}
            placeholder={
              "Grade curricular: uma aula por linha\nExemplo:\nIntrodução\nFundamentos\nPrática guiada"
            }
            rows={5}
            className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 md:col-span-2"
          />
        </div>

        <button
          onClick={createCourse}
          disabled={loading}
          className="mt-5 flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          <Save size={17} />
          {loading ? "Salvando..." : "Criar curso"}
        </button>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Cursos ativos</h2>
            <p className="mt-1 text-sm text-slate-400">
              Pesquise, edite, arquive e organize a ordem das aulas.
            </p>
          </div>

          <div className="flex h-11 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 lg:w-[360px]">
            <Search size={18} className="text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar curso..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        <div className="grid gap-4">
          {filteredActiveCourses.length === 0 ? (
            <Empty text="Nenhum curso encontrado." />
          ) : (
            filteredActiveCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isArchived={false}
                isOpen={openCourseId === course.id}
                onToggleOpen={() =>
                  setOpenCourseId(openCourseId === course.id ? "" : course.id)
                }
                editingCourseId={editingCourseId}
                editCourseName={editCourseName}
                editCourseDescription={editCourseDescription}
                editingLessonId={editingLessonId}
                editLessonTitle={editLessonTitle}
                editLessonContent={editLessonContent}
                editLessonNotes={editLessonNotes}
                setEditCourseName={setEditCourseName}
                setEditCourseDescription={setEditCourseDescription}
                setEditLessonTitle={setEditLessonTitle}
                setEditLessonContent={setEditLessonContent}
                setEditLessonNotes={setEditLessonNotes}
                onStartEditCourse={startEditCourse}
                onCancelEditCourse={cancelEditCourse}
                onSaveCourse={saveCourse}
                onArchiveCourse={archiveCourse}
                onRestoreCourse={restoreCourse}
                onDeleteCourse={deleteCourse}
                onAddLesson={addLessonToCourse}
                onStartEditLesson={startEditLesson}
                onCancelEditLesson={cancelEditLesson}
                onSaveLesson={saveLesson}
                onDeleteLesson={deleteLesson}
                onMoveLesson={moveLesson}
              />
            ))
          )}
        </div>
      </section>

      {archivedCourses.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Cursos arquivados
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Cursos guardados no histórico.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              {archivedCourses.length} arquivado(s)
            </div>
          </div>

          <div className="grid gap-4">
            {archivedCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                isArchived
                isOpen={openCourseId === course.id}
                onToggleOpen={() =>
                  setOpenCourseId(openCourseId === course.id ? "" : course.id)
                }
                editingCourseId={editingCourseId}
                editCourseName={editCourseName}
                editCourseDescription={editCourseDescription}
                editingLessonId={editingLessonId}
                editLessonTitle={editLessonTitle}
                editLessonContent={editLessonContent}
                editLessonNotes={editLessonNotes}
                setEditCourseName={setEditCourseName}
                setEditCourseDescription={setEditCourseDescription}
                setEditLessonTitle={setEditLessonTitle}
                setEditLessonContent={setEditLessonContent}
                setEditLessonNotes={setEditLessonNotes}
                onStartEditCourse={startEditCourse}
                onCancelEditCourse={cancelEditCourse}
                onSaveCourse={saveCourse}
                onArchiveCourse={archiveCourse}
                onRestoreCourse={restoreCourse}
                onDeleteCourse={deleteCourse}
                onAddLesson={addLessonToCourse}
                onStartEditLesson={startEditLesson}
                onCancelEditLesson={cancelEditLesson}
                onSaveLesson={saveLesson}
                onDeleteLesson={deleteLesson}
                onMoveLesson={moveLesson}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function CourseCard({
  course,
  isArchived,
  isOpen,
  onToggleOpen,
  editingCourseId,
  editCourseName,
  editCourseDescription,
  editingLessonId,
  editLessonTitle,
  editLessonContent,
  editLessonNotes,
  setEditCourseName,
  setEditCourseDescription,
  setEditLessonTitle,
  setEditLessonContent,
  setEditLessonNotes,
  onStartEditCourse,
  onCancelEditCourse,
  onSaveCourse,
  onArchiveCourse,
  onRestoreCourse,
  onDeleteCourse,
  onAddLesson,
  onStartEditLesson,
  onCancelEditLesson,
  onSaveLesson,
  onDeleteLesson,
  onMoveLesson,
}: {
  course: Course;
  isArchived: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  editingCourseId: string;
  editCourseName: string;
  editCourseDescription: string;
  editingLessonId: string;
  editLessonTitle: string;
  editLessonContent: string;
  editLessonNotes: string;
  setEditCourseName: (value: string) => void;
  setEditCourseDescription: (value: string) => void;
  setEditLessonTitle: (value: string) => void;
  setEditLessonContent: (value: string) => void;
  setEditLessonNotes: (value: string) => void;
  onStartEditCourse: (course: Course) => void;
  onCancelEditCourse: () => void;
  onSaveCourse: (courseId: string) => void;
  onArchiveCourse: (courseId: string) => void;
  onRestoreCourse: (courseId: string) => void;
  onDeleteCourse: (courseId: string) => void;
  onAddLesson: (course: Course) => void;
  onStartEditLesson: (lesson: CurriculumLesson) => void;
  onCancelEditLesson: () => void;
  onSaveLesson: (lessonId: string) => void;
  onDeleteLesson: (lessonId: string) => void;
  onMoveLesson: (
    lessons: CurriculumLesson[],
    lessonId: string,
    direction: "up" | "down"
  ) => void;
}) {
  const isEditingCourse = editingCourseId === course.id;

  const orderedLessons = [...course.curriculum_lessons].sort(
    (a, b) => Number(a.lesson_order ?? 0) - Number(b.lesson_order ?? 0)
  );

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-violet-500/30">
      {isEditingCourse ? (
        <div className="grid gap-3">
          <input
            value={editCourseName}
            onChange={(event) => setEditCourseName(event.target.value)}
            placeholder="Nome do curso"
            className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
          />

          <input
            value={editCourseDescription}
            onChange={(event) => setEditCourseDescription(event.target.value)}
            placeholder="Descrição"
            className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              onClick={() => onSaveCourse(course.id)}
              className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
            >
              <Save size={16} />
              Salvar
            </button>

            <button
              onClick={onCancelEditCourse}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <button
            onClick={onToggleOpen}
            className="flex flex-1 items-center gap-3 text-left"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">
              <BookOpen size={20} />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-xl font-bold text-white">
                {course.name}
              </h3>

              <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                {course.description || "Sem descrição."}
              </p>
            </div>

            <div className="hidden rounded-2xl bg-violet-500/10 px-3 py-2 text-sm font-semibold text-violet-300 md:block">
              {orderedLessons.length} aula(s)
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 text-slate-300">
              {isOpen ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
            </div>
          </button>

          <div className="flex items-center justify-end gap-2">
            <IconButton
              title="Editar curso"
              color="blue"
              icon={<Edit3 size={15} />}
              onClick={() => onStartEditCourse(course)}
            />

            {isArchived ? (
              <IconButton
                title="Restaurar curso"
                color="green"
                icon={<RotateCcw size={15} />}
                onClick={() => onRestoreCourse(course.id)}
              />
            ) : (
              <IconButton
                title="Arquivar curso"
                color="yellow"
                icon={<Archive size={15} />}
                onClick={() => onArchiveCourse(course.id)}
              />
            )}

            <IconButton
              title="Excluir curso"
              color="red"
              icon={<Trash2 size={15} />}
              onClick={() => onDeleteCourse(course.id)}
            />
          </div>
        </div>
      )}

      {isOpen && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-3">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="font-bold text-white">Grade curricular</h4>

            {!isArchived && (
              <button
                onClick={() => onAddLesson(course)}
                className="rounded-xl bg-violet-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-400"
              >
                + Aula
              </button>
            )}
          </div>

          <div className="space-y-2">
            {orderedLessons.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                Nenhuma aula cadastrada.
              </div>
            ) : (
              orderedLessons.map((lesson, index) => {
                const isEditingLesson = editingLessonId === lesson.id;

                return (
                  <div
                    key={lesson.id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"
                  >
                    {isEditingLesson ? (
                      <div className="grid gap-3">
                        <input
                          value={editLessonTitle}
                          onChange={(event) =>
                            setEditLessonTitle(event.target.value)
                          }
                          placeholder="Título da aula"
                          className="h-10 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-blue-400"
                        />

                        <textarea
                          value={editLessonContent}
                          onChange={(event) =>
                            setEditLessonContent(event.target.value)
                          }
                          placeholder="Conteúdo"
                          rows={2}
                          className="resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        />

                        <textarea
                          value={editLessonNotes}
                          onChange={(event) =>
                            setEditLessonNotes(event.target.value)
                          }
                          placeholder="Observações"
                          rows={2}
                          className="resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-blue-400"
                        />

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            onClick={() => onSaveLesson(lesson.id)}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
                          >
                            <Save size={15} />
                            Salvar
                          </button>

                          <button
                            onClick={onCancelEditLesson}
                            className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                          >
                            <X size={15} />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-sm font-black text-violet-300">
                          {index + 1}
                        </div>

                        <button
                          onClick={() => onStartEditLesson(lesson)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <p className="truncate font-semibold text-white">
                            {lesson.title}
                          </p>

                          {lesson.content && (
                            <p className="mt-1 line-clamp-1 text-sm text-slate-400">
                              {lesson.content}
                            </p>
                          )}

                          {lesson.notes && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              Obs: {lesson.notes}
                            </p>
                          )}
                        </button>

                        {!isArchived && (
                          <div className="flex shrink-0 items-center gap-1">
                            <IconButton
                              title="Subir aula"
                              color="slate"
                              icon={<ArrowUp size={13} />}
                              disabled={index === 0}
                              onClick={() =>
                                onMoveLesson(orderedLessons, lesson.id, "up")
                              }
                            />

                            <IconButton
                              title="Descer aula"
                              color="slate"
                              icon={<ArrowDown size={13} />}
                              disabled={index === orderedLessons.length - 1}
                              onClick={() =>
                                onMoveLesson(orderedLessons, lesson.id, "down")
                              }
                            />

                            <IconButton
                              title="Editar aula"
                              color="blue"
                              icon={<Edit3 size={13} />}
                              onClick={() => onStartEditLesson(lesson)}
                            />

                            <IconButton
                              title="Excluir aula"
                              color="red"
                              icon={<Trash2 size={13} />}
                              onClick={() => onDeleteLesson(lesson.id)}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function IconButton({
  icon,
  title,
  color,
  onClick,
  disabled = false,
}: {
  icon: React.ReactNode;
  title: string;
  color: "blue" | "yellow" | "red" | "green" | "slate";
  onClick: () => void;
  disabled?: boolean;
}) {
  const colors = {
    blue: "bg-blue-500 text-white hover:bg-blue-400",
    yellow: "bg-yellow-500 text-black hover:bg-yellow-400",
    red: "bg-red-500 text-white hover:bg-red-400",
    green: "bg-emerald-500 text-white hover:bg-emerald-400",
    slate: "bg-slate-800 text-slate-200 hover:bg-slate-700",
  };

  return (
    <button
      title={title}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${colors[color]}`}
    >
      {icon}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
      {text}
    </div>
  );
}