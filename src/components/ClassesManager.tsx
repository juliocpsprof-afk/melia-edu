"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  Edit3,
  Plus,
  RotateCcw,
  Save,
  Users,
  X,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type Course = {
  id: string;
  name: string;
};

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  course_id: string | null;
  status: string | null;
  linked_courses: Course[];
  students: {
    id: string;
  }[];
};

type CourseSelectorTone = "violet" | "blue" | "emerald";

export function ClassesManager({
  classes,
  courses,
}: {
  classes: ClassItem[];
  courses: Course[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCourseIds, setEditCourseIds] = useState<string[]>([]);

  const activeClasses = useMemo(
    () => classes.filter((item) => item.status !== "Arquivada"),
    [classes]
  );

  const archivedClasses = useMemo(
    () => classes.filter((item) => item.status === "Arquivada"),
    [classes]
  );

  function normalizeCourseIds(ids: string[]) {
    return Array.from(new Set(ids.filter(Boolean)));
  }

  function getErrorMessage(error: unknown) {
    if (error && typeof error === "object" && "message" in error) {
      return String((error as { message?: unknown }).message);
    }

    return "Não foi possível concluir a operação.";
  }

  async function syncClassCourses(classId: string, selectedCourseIds: string[]) {
    const normalizedCourseIds = normalizeCourseIds(selectedCourseIds);

    const { error: deleteError } = await supabase
      .from("class_courses")
      .delete()
      .eq("class_id", classId);

    if (deleteError) {
      throw deleteError;
    }

    if (normalizedCourseIds.length === 0) {
      return;
    }

    const rows = normalizedCourseIds.map((courseId) => ({
      class_id: classId,
      course_id: courseId,
    }));

    const { error: insertError } = await supabase
      .from("class_courses")
      .insert(rows);

    if (insertError) {
      throw insertError;
    }
  }

  async function createClass() {
    if (!name.trim()) {
      alert("Digite o nome da turma.");
      return;
    }

    const normalizedCourseIds = normalizeCourseIds(courseIds);

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("classes")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          course_id: normalizedCourseIds[0] || null,
          status: "Ativa",
        })
        .select("id")
        .single();

      if (error) {
        throw error;
      }

      if (data?.id) {
        await syncClassCourses(String(data.id), normalizedCourseIds);
      }

      window.location.reload();
    } catch (error) {
      alert(getErrorMessage(error));
      setLoading(false);
    }
  }

  function startEdit(item: ClassItem) {
    const linkedCourseIds =
      item.linked_courses.length > 0
        ? item.linked_courses.map((course) => course.id)
        : item.course_id
          ? [item.course_id]
          : [];

    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description || "");
    setEditCourseIds(linkedCourseIds);
  }

  function cancelEdit() {
    setEditingId("");
    setEditName("");
    setEditDescription("");
    setEditCourseIds([]);
  }

  async function saveEdit(id: string) {
    if (!editName.trim()) {
      alert("Digite o nome da turma.");
      return;
    }

    const normalizedCourseIds = normalizeCourseIds(editCourseIds);

    try {
      const { error } = await supabase
        .from("classes")
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          course_id: normalizedCourseIds[0] || null,
        })
        .eq("id", id);

      if (error) {
        throw error;
      }

      await syncClassCourses(id, normalizedCourseIds);

      window.location.reload();
    } catch (error) {
      alert(getErrorMessage(error));
    }
  }

  async function archiveClass(id: string) {
    const { error } = await supabase
      .from("classes")
      .update({
        status: "Arquivada",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  async function restoreClass(id: string) {
    const { error } = await supabase
      .from("classes")
      .update({
        status: "Ativa",
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
            <Plus size={22} />
          </div>

          <div>
            <h2 className="text-2xl font-bold">Nova turma</h2>
            <p className="text-sm text-slate-400">
              Crie turmas e vincule um ou mais cursos.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Nome da turma"
            className="h-11 rounded-2xl border border-slate-700 bg-slate-950 px-4 text-sm outline-none focus:border-violet-400"
          />

          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Descrição"
            rows={3}
            className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400 md:col-span-2"
          />

          <div className="md:col-span-2">
            <CourseSelector
              label="Cursos vinculados à turma"
              courses={courses}
              selectedCourseIds={courseIds}
              onChange={setCourseIds}
              tone="violet"
            />
          </div>
        </div>

        <button
          onClick={createClass}
          disabled={loading}
          className="mt-4 flex h-11 items-center justify-center gap-2 rounded-2xl bg-violet-500 px-5 text-sm font-semibold text-white transition hover:bg-violet-400 disabled:opacity-50"
        >
          <Plus size={17} />
          {loading ? "Criando..." : "Criar turma"}
        </button>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Turmas ativas</h2>

            <p className="mt-1 text-sm text-slate-400">
              Turmas em uso no sistema.
            </p>
          </div>

          <div className="rounded-2xl bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-300">
            {activeClasses.length} turma(s)
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {activeClasses.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-5 text-slate-400">
              Nenhuma turma ativa.
            </div>
          ) : (
            activeClasses.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-violet-500/30"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        placeholder="Nome da turma"
                        className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-blue-400"
                      />

                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        placeholder="Descrição"
                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-blue-400"
                      />

                      <CourseSelector
                        label="Cursos desta turma"
                        courses={courses}
                        selectedCourseIds={editCourseIds}
                        onChange={setEditCourseIds}
                        tone="blue"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          <Save size={16} />
                          Salvar
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <h3 className="line-clamp-1 text-xl font-bold text-white">
                          {item.name}
                        </h3>

                        <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-400">
                          {item.description || "Sem descrição"}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <CourseBadges
                            courses={item.linked_courses}
                            tone="violet"
                          />

                          <div className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
                            <Users size={14} />
                            {item.students.length} aluno(s)
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400"
                        >
                          <Edit3 size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() => archiveClass(item.id)}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-yellow-500 text-sm font-semibold text-black transition hover:bg-yellow-400"
                        >
                          <Archive size={16} />
                          Arquivar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {archivedClasses.length > 0 && (
        <section className="rounded-3xl border border-slate-800 bg-slate-900/30 p-5">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">
                Turmas arquivadas
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Turmas guardadas no histórico.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-300">
              {archivedClasses.length} arquivada(s)
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {archivedClasses.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-emerald-500/30"
                >
                  {isEditing ? (
                    <div className="space-y-3">
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        placeholder="Nome da turma"
                        className="h-10 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none focus:border-emerald-400"
                      />

                      <textarea
                        rows={3}
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        placeholder="Descrição"
                        className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                      />

                      <CourseSelector
                        label="Cursos desta turma"
                        courses={courses}
                        selectedCourseIds={editCourseIds}
                        onChange={setEditCourseIds}
                        tone="emerald"
                      />

                      <div className="grid gap-2 sm:grid-cols-2">
                        <button
                          onClick={() => saveEdit(item.id)}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          <Save size={16} />
                          Salvar
                        </button>

                        <button
                          onClick={cancelEdit}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                        >
                          <X size={16} />
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="line-clamp-1 text-xl font-bold text-white">
                        {item.name}
                      </h3>

                      <p className="mt-2 line-clamp-2 min-h-[44px] text-sm leading-6 text-slate-400">
                        {item.description || "Sem descrição"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <CourseBadges
                          courses={item.linked_courses}
                          tone="emerald"
                        />

                        <div className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300">
                          <Users size={14} />
                          {item.students.length} aluno(s)
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => startEdit(item)}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-500 text-sm font-semibold text-white transition hover:bg-blue-400"
                        >
                          <Edit3 size={16} />
                          Editar
                        </button>

                        <button
                          onClick={() => restoreClass(item.id)}
                          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 text-sm font-semibold text-white transition hover:bg-emerald-400"
                        >
                          <RotateCcw size={16} />
                          Restaurar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

function CourseSelector({
  label,
  courses,
  selectedCourseIds,
  onChange,
  tone,
}: {
  label: string;
  courses: Course[];
  selectedCourseIds: string[];
  onChange: (courseIds: string[]) => void;
  tone: CourseSelectorTone;
}) {
  const normalizedSelectedCourseIds = useMemo(
    () => Array.from(new Set(selectedCourseIds.filter(Boolean))),
    [selectedCourseIds]
  );

  const selectedCourses = useMemo(() => {
    return courses.filter((course) =>
      normalizedSelectedCourseIds.includes(course.id)
    );
  }, [courses, normalizedSelectedCourseIds]);

  const availableCourses = useMemo(() => {
    return courses.filter(
      (course) => !normalizedSelectedCourseIds.includes(course.id)
    );
  }, [courses, normalizedSelectedCourseIds]);

  const focusClass =
    tone === "emerald"
      ? "focus:border-emerald-400"
      : tone === "blue"
        ? "focus:border-blue-400"
        : "focus:border-violet-400";

  function addCourse(courseId: string) {
    if (!courseId) {
      return;
    }

    if (normalizedSelectedCourseIds.includes(courseId)) {
      return;
    }

    onChange([...normalizedSelectedCourseIds, courseId]);
  }

  function removeCourse(courseId: string) {
    onChange(normalizedSelectedCourseIds.filter((id) => id !== courseId));
  }

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-sm font-semibold text-slate-200">{label}</p>

      <div className="mt-3">
        <select
          value=""
          onChange={(event) => addCourse(event.target.value)}
          disabled={availableCourses.length === 0}
          className={`h-11 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm outline-none disabled:opacity-50 ${focusClass}`}
        >
          <option value="">
            {availableCourses.length === 0
              ? "Todos os cursos já foram adicionados"
              : "Selecione um curso para adicionar"}
          </option>

          {availableCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {courses.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Nenhum curso cadastrado.
        </p>
      ) : selectedCourses.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">
          Nenhum curso vinculado ainda.
        </p>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedCourses.map((course) => (
            <span
              key={course.id}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200"
            >
              {course.name}

              <button
                type="button"
                onClick={() => removeCourse(course.id)}
                className="rounded-full text-slate-400 transition hover:text-red-300"
                aria-label={`Remover ${course.name}`}
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CourseBadges({
  courses,
  tone,
}: {
  courses: Course[];
  tone: "violet" | "emerald";
}) {
  if (courses.length === 0) {
    return (
      <div className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-400">
        Sem curso vinculado
      </div>
    );
  }

  const badgeClass =
    tone === "emerald"
      ? "bg-emerald-500/10 text-emerald-300"
      : "bg-violet-500/10 text-violet-300";

  return (
    <>
      {courses.map((course) => (
        <div
          key={course.id}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold ${badgeClass}`}
        >
          {course.name}
        </div>
      ))}
    </>
  );
}