"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Archive, Edit3, Save, Trash2, X } from "lucide-react";
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
  courses: {
    name: string;
  } | null;
  students: {
    id: string;
  }[];
};

export function ClassesManager({
  classes,
  courses,
}: {
  classes: ClassItem[];
  courses: Course[];
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");

  const [editingId, setEditingId] = useState("");
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editCourseId, setEditCourseId] = useState("");

  async function createClass() {
    if (!name || !courseId) {
      toast.error("Informe o nome da turma e selecione o curso.");
      return;
    }

    const { error } = await supabase.from("classes").insert({
      name,
      description,
      course_id: courseId,
      status: "Ativa",
    });

    if (error) {
      toast.error("Erro ao criar turma.");
      console.error(error);
      return;
    }

    toast.success("Turma criada!");
    setName("");
    setDescription("");
    setCourseId("");

    setTimeout(() => window.location.reload(), 700);
  }

  function startEdit(classItem: ClassItem) {
    setEditingId(classItem.id);
    setEditName(classItem.name);
    setEditDescription(classItem.description ?? "");
    setEditCourseId(classItem.course_id ?? "");
  }

  function cancelEdit() {
    setEditingId("");
    setEditName("");
    setEditDescription("");
    setEditCourseId("");
  }

  async function saveEdit(id: string) {
    if (!editName || !editCourseId) {
      toast.error("Informe o nome da turma e o curso.");
      return;
    }

    const { error } = await supabase
      .from("classes")
      .update({
        name: editName,
        description: editDescription,
        course_id: editCourseId,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao editar turma.");
      console.error(error);
      return;
    }

    toast.success("Turma atualizada!");
    setTimeout(() => window.location.reload(), 700);
  }

  async function archiveClass(id: string) {
    const confirmed = confirm("Deseja arquivar esta turma?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("classes")
      .update({
        status: "Arquivada",
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao arquivar turma.");
      console.error(error);
      return;
    }

    toast.success("Turma arquivada!");
    setTimeout(() => window.location.reload(), 700);
  }

  async function deleteClass(id: string) {
    const confirmed = confirm(
      "Deseja excluir esta turma? Isso pode apagar vínculos relacionados."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("classes").delete().eq("id", id);

    if (error) {
      toast.error("Erro ao excluir turma.");
      console.error(error);
      return;
    }

    toast.success("Turma excluída!");
    setTimeout(() => window.location.reload(), 700);
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Nova turma</h2>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <input
            placeholder="Nome da turma"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />

          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          >
            <option value="">Selecione o curso</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.name}
              </option>
            ))}
          </select>

          <input
            placeholder="Descrição"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
          />
        </div>

        <button
          onClick={createClass}
          className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400"
        >
          Criar turma
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((classItem) => {
          const isEditing = editingId === classItem.id;

          return (
            <div
              key={classItem.id}
              className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <input
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                  />

                  <select
                    value={editCourseId}
                    onChange={(event) => setEditCourseId(event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                  >
                    <option value="">Selecione o curso</option>

                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>

                  <input
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                  />

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => saveEdit(classItem.id)}
                      className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-emerald-300"
                    >
                      <Save size={16} />
                      Salvar
                    </button>

                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                    >
                      <X size={16} />
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold">{classItem.name}</h3>

                      <p className="mt-2 text-slate-400">
                        {classItem.description || "Sem descrição"}
                      </p>

                      <p className="mt-3 text-sm text-violet-300">
                        Curso: {classItem.courses?.name || "Sem curso vinculado"}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {classItem.students?.length ?? 0} aluno(s)
                      </p>
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-sm ${
                        classItem.status === "Arquivada"
                          ? "bg-amber-500/10 text-amber-300"
                          : "bg-emerald-500/10 text-emerald-300"
                      }`}
                    >
                      {classItem.status || "Ativa"}
                    </span>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      onClick={() => startEdit(classItem)}
                      className="flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-slate-300"
                    >
                      <Edit3 size={16} />
                      Editar
                    </button>

                    <button
                      onClick={() => archiveClass(classItem.id)}
                      className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-amber-300"
                    >
                      <Archive size={16} />
                      Arquivar
                    </button>

                    <button
                      onClick={() => deleteClass(classItem.id)}
                      className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-red-300"
                    >
                      <Trash2 size={16} />
                      Excluir
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}