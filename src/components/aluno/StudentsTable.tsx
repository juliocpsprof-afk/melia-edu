"use client";

import { Fragment, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Cake,
  Edit3,
  Filter,
  RotateCcw,
  Save,
  Search,
  X,
} from "lucide-react";

import { supabase } from "../../lib/supabase";
import { DeleteStudentButton } from "../DeleteStudentButton";

type ClassItem = {
  id: string;
  name: string;
};

type CourseItem = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string | null;
  email: string | null;
  class_id?: string | null;
  class_name: string | null;
  course_id?: string | null;
  course_name: string | null;
  phone: string | null;
  birth_date?: string | null;
  average: number | null;
  attendance: number | null;
  status: string | null;
  archived?: boolean | null;
  archived_at?: string | null;
  archive_reason?: string | null;
  archive_notes?: string | null;
};

type EditForm = {
  name: string;
  birth_date: string;
  phone: string;
  email: string;
  class_id: string;
  course_id: string;
  average: string;
  attendance: string;
  status: string;
};

type ArchiveForm = {
  reason: string;
  notes: string;
};

const archiveReasons = ["Abandono", "Conclusão", "Transferência", "Outro"];

export function StudentsTable({
  students,
  classes,
  courses,
}: {
  students: Student[];
  classes: ClassItem[];
  courses: CourseItem[];
}) {
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [archiveFilter, setArchiveFilter] = useState<
    "active" | "archived" | "all"
  >("active");
  const [reasonFilter, setReasonFilter] = useState("");
  const [minAge, setMinAge] = useState("");
  const [maxAge, setMaxAge] = useState("");

  const [editingId, setEditingId] = useState("");
  const [savingId, setSavingId] = useState("");
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    birth_date: "",
    phone: "",
    email: "",
    class_id: "",
    course_id: "",
    average: "",
    attendance: "",
    status: "Regular",
  });

  const [archiveStudent, setArchiveStudent] = useState<Student | null>(null);
  const [archiveSaving, setArchiveSaving] = useState(false);
  const [archiveForm, setArchiveForm] = useState<ArchiveForm>({
    reason: "Abandono",
    notes: "",
  });

  function normalizeText(value: string) {
    return value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  }

  function getStudentName(student: Student) {
    return student.name?.trim() || "Aluno sem nome";
  }

  function getStudentInitial(student: Student) {
    return getStudentName(student).charAt(0).toUpperCase();
  }

  function getNumberValue(value: string) {
    const normalizedValue = value.trim();

    if (!normalizedValue) {
      return 0;
    }

    const numberValue = Number(normalizedValue);

    if (Number.isNaN(numberValue)) {
      return 0;
    }

    return numberValue;
  }

  function getBirthDateInputValue(value: string | null | undefined) {
    if (!value) {
      return "";
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      return value.slice(0, 10);
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatBirthDate(value: string | null | undefined) {
    const inputValue = getBirthDateInputValue(value);

    if (!inputValue) {
      return "Não informada";
    }

    const date = new Date(`${inputValue}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
      return "Não informada";
    }

    return date.toLocaleDateString("pt-BR");
  }

  function formatDateTime(value: string | null | undefined) {
    if (!value) {
      return "Sem data";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Sem data";
    }

    return date.toLocaleString("pt-BR");
  }

  function getStudentAge(value: string | null | undefined) {
    const inputValue = getBirthDateInputValue(value);

    if (!inputValue) {
      return null;
    }

    const [year, month, day] = inputValue.split("-").map(Number);

    if (!year || !month || !day) {
      return null;
    }

    const today = new Date();

    let age = today.getFullYear() - year;

    const birthdayThisYear = new Date(today.getFullYear(), month - 1, day);
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    if (birthdayThisYear > todayStart) {
      age -= 1;
    }

    return age >= 0 ? age : null;
  }

  function isBirthdayToday(value: string | null | undefined) {
    const inputValue = getBirthDateInputValue(value);

    if (!inputValue) {
      return false;
    }

    const [, month, day] = inputValue.split("-").map(Number);
    const today = new Date();

    return today.getMonth() + 1 === month && today.getDate() === day;
  }

  function getArchiveStatus(student: Student) {
    return student.archived ? "Arquivado" : "Ativo";
  }

  function clearFilters() {
    setSearch("");
    setClassFilter("");
    setArchiveFilter("active");
    setReasonFilter("");
    setMinAge("");
    setMaxAge("");
  }

  const activeStudentsCount = useMemo(() => {
    return students.filter((student) => !student.archived).length;
  }, [students]);

  const archivedStudentsCount = useMemo(() => {
    return students.filter((student) => student.archived).length;
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);
    const minimumAge = minAge.trim() ? Number(minAge) : null;
    const maximumAge = maxAge.trim() ? Number(maxAge) : null;

    return students.filter((student) => {
      const age = getStudentAge(student.birth_date);
      const isArchived = Boolean(student.archived);

      if (archiveFilter === "active" && isArchived) {
        return false;
      }

      if (archiveFilter === "archived" && !isArchived) {
        return false;
      }

      if (classFilter && student.class_id !== classFilter) {
        return false;
      }

      if (reasonFilter && student.archive_reason !== reasonFilter) {
        return false;
      }

      if (
        minimumAge !== null &&
        !Number.isNaN(minimumAge) &&
        (age === null || age < minimumAge)
      ) {
        return false;
      }

      if (
        maximumAge !== null &&
        !Number.isNaN(maximumAge) &&
        (age === null || age > maximumAge)
      ) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = normalizeText(`
        ${student.name ?? ""}
        ${student.email ?? ""}
        ${student.phone ?? ""}
        ${student.birth_date ?? ""}
        ${age !== null ? `${age} anos` : ""}
        ${student.class_name ?? ""}
        ${student.course_name ?? ""}
        ${student.status ?? ""}
        ${student.archive_reason ?? ""}
        ${student.archive_notes ?? ""}
        ${getArchiveStatus(student)}
      `);

      return searchableText.includes(normalizedSearch);
    });
  }, [
    students,
    search,
    classFilter,
    archiveFilter,
    reasonFilter,
    minAge,
    maxAge,
  ]);

  function startEdit(student: Student) {
    const selectedClass = classes.find(
      (classItem) =>
        classItem.id === student.class_id ||
        normalizeText(classItem.name) === normalizeText(student.class_name ?? "")
    );

    const selectedCourse = courses.find(
      (course) =>
        course.id === student.course_id ||
        normalizeText(course.name) === normalizeText(student.course_name ?? "")
    );

    setEditingId(student.id);

    setEditForm({
      name: student.name ?? "",
      birth_date: getBirthDateInputValue(student.birth_date),
      phone: student.phone ?? "",
      email: student.email ?? "",
      class_id: selectedClass?.id ?? "",
      course_id: selectedCourse?.id ?? "",
      average: String(student.average ?? 0),
      attendance: String(student.attendance ?? 0),
      status: student.status || "Regular",
    });
  }

  function cancelEdit() {
    setEditingId("");
    setSavingId("");

    setEditForm({
      name: "",
      birth_date: "",
      phone: "",
      email: "",
      class_id: "",
      course_id: "",
      average: "",
      attendance: "",
      status: "Regular",
    });
  }

  function updateEditForm(field: keyof EditForm, value: string) {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function saveEdit(studentId: string) {
    if (!editForm.name.trim()) {
      alert("Digite pelo menos o nome do aluno.");
      return;
    }

    const selectedClass = classes.find(
      (classItem) => classItem.id === editForm.class_id
    );

    const selectedCourse = courses.find(
      (course) => course.id === editForm.course_id
    );

    setSavingId(studentId);

    const { error } = await supabase
      .from("students")
      .update({
        name: editForm.name.trim(),
        birth_date: editForm.birth_date || null,
        phone: editForm.phone.trim() || null,
        email: editForm.email.trim() || null,

        class_id: selectedClass?.id || null,
        class_name: selectedClass?.name || null,

        course_id: selectedCourse?.id || null,
        course_name: selectedCourse?.name || null,

        average: getNumberValue(editForm.average),
        attendance: getNumberValue(editForm.attendance),

        status: editForm.status || "Regular",
      })
      .eq("id", studentId);

    setSavingId("");

    if (error) {
      alert(`Erro ao editar aluno: ${error.message}`);
      return;
    }

    cancelEdit();
    window.location.reload();
  }

  function openArchiveModal(student: Student) {
    setArchiveStudent(student);
    setArchiveForm({
      reason: student.archive_reason || "Abandono",
      notes: student.archive_notes || "",
    });
  }

  function closeArchiveModal() {
    setArchiveStudent(null);
    setArchiveSaving(false);
    setArchiveForm({
      reason: "Abandono",
      notes: "",
    });
  }

  async function archiveSelectedStudent() {
    if (!archiveStudent) {
      return;
    }

    if (!archiveForm.reason.trim()) {
      alert("Selecione o motivo do arquivamento.");
      return;
    }

    setArchiveSaving(true);

    const { error } = await supabase
      .from("students")
      .update({
        archived: true,
        archived_at: new Date().toISOString(),
        archive_reason: archiveForm.reason,
        archive_notes: archiveForm.notes.trim() || null,
      })
      .eq("id", archiveStudent.id);

    setArchiveSaving(false);

    if (error) {
      alert(`Erro ao arquivar aluno: ${error.message}`);
      return;
    }

    closeArchiveModal();
    window.location.reload();
  }

  async function reactivateStudent(student: Student) {
    const confirmed = window.confirm(
      `Reativar ${getStudentName(
        student
      )}? Ele voltará para a listagem de alunos ativos.`
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("students")
      .update({
        archived: false,
        archived_at: null,
        archive_reason: null,
        archive_notes: null,
        status: "Regular",
      })
      .eq("id", student.id);

    if (error) {
      alert(`Erro ao reativar aluno: ${error.message}`);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lista de alunos</h2>

          <p className="mt-1 text-sm text-slate-400">
            Pesquise por nome, telefone, idade, turma, status, situação ou
            motivo de arquivamento.
          </p>

          <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-emerald-300">
              {activeStudentsCount} ativo(s)
            </span>

            <span className="rounded-full bg-slate-700/70 px-3 py-1 text-slate-300">
              {archivedStudentsCount} arquivado(s)
            </span>
          </div>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 xl:w-96">
          <Search size={20} className="text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno..."
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="mb-5 rounded-3xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-bold text-slate-300">
          <Filter size={17} />
          Filtros avançados
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <select
            value={archiveFilter}
            onChange={(event) =>
              setArchiveFilter(
                event.target.value as "active" | "archived" | "all"
              )
            }
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
          >
            <option value="active">Somente ativos</option>
            <option value="archived">Somente arquivados</option>
            <option value="all">Ativos e arquivados</option>
          </select>

          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
          >
            <option value="">Todas as turmas</option>

            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name}
              </option>
            ))}
          </select>

          <select
            value={reasonFilter}
            onChange={(event) => setReasonFilter(event.target.value)}
            disabled={archiveFilter === "active"}
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">Todos os motivos</option>

            {archiveReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>

          <input
            value={minAge}
            onChange={(event) => setMinAge(event.target.value)}
            placeholder="Idade mínima"
            type="number"
            min="0"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />

          <input
            value={maxAge}
            onChange={(event) => setMaxAge(event.target.value)}
            placeholder="Idade máxima"
            type="number"
            min="0"
            className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
          />

          <button
            type="button"
            onClick={clearFilters}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="mb-4 text-sm text-slate-400">
        {filteredStudents.length} aluno(s) encontrado(s)
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-800">
        <table className="w-full min-w-[1320px] border-collapse">
          <thead className="bg-slate-950/70 text-left text-sm text-slate-400">
            <tr>
              <th className="p-4">Aluno</th>
              <th className="p-4">Situação</th>
              <th className="p-4">Turma</th>
              <th className="p-4">Curso</th>
              <th className="p-4">Telefone</th>
              <th className="p-4">Nascimento / idade</th>
              <th className="p-4">Média</th>
              <th className="p-4">Frequência</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>

          <tbody>
            {filteredStudents.map((student) => {
              const isEditing = editingId === student.id;
              const age = getStudentAge(student.birth_date);
              const birthdayToday = isBirthdayToday(student.birth_date);
              const archived = Boolean(student.archived);

              return (
                <Fragment key={student.id}>
                  <tr
                    className={`border-t border-slate-800 transition hover:bg-white/[0.03] ${
                      archived ? "bg-slate-950/50 opacity-80" : ""
                    }`}
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-bold ${
                            archived
                              ? "bg-slate-700 text-slate-300"
                              : birthdayToday
                              ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20"
                              : "bg-violet-500 text-white"
                          }`}
                        >
                          {birthdayToday && !archived ? (
                            <Cake size={19} />
                          ) : (
                            getStudentInitial(student)
                          )}
                        </div>

                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/alunos/${student.id}`}
                            className="block max-w-[240px] truncate font-semibold transition hover:text-violet-300"
                            title={getStudentName(student)}
                          >
                            {getStudentName(student)}
                          </Link>

                          <p className="max-w-[240px] truncate text-sm text-slate-400">
                            {student.email || "E-mail não informado"}
                          </p>

                          {birthdayToday && !archived && (
                            <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2 py-1 text-xs font-bold text-pink-200">
                              <Cake size={12} />
                              Aniversário hoje
                            </p>
                          )}

                          {archived && (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                              Arquivado em {formatDateTime(student.archived_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <ArchiveBadge student={student} />
                    </td>

                    <td className="p-4 text-slate-300">
                      {student.class_name || "Sem turma"}
                    </td>

                    <td className="p-4 text-slate-300">
                      {student.course_name || "Sem curso"}
                    </td>

                    <td className="p-4 text-slate-300">
                      {student.phone || "-"}
                    </td>

                    <td className="p-4 text-slate-300">
                      <div>
                        <p className="font-semibold text-white">
                          {age !== null ? `${age} anos` : "Idade não informada"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {formatBirthDate(student.birth_date)}
                        </p>
                      </div>
                    </td>

                    <td className="p-4 font-semibold">
                      {student.average ?? 0}
                    </td>

                    <td className="p-4 font-semibold">
                      {student.attendance ?? 0}%
                    </td>

                    <td className="p-4">
                      <StatusBadge status={student.status || "Regular"} />
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(student)}
                          title="Editar aluno"
                          aria-label={`Editar ${getStudentName(student)}`}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/10 text-blue-300 transition hover:bg-blue-500/20"
                        >
                          <Edit3 size={18} />
                        </button>

                        {archived ? (
                          <button
                            type="button"
                            onClick={() => reactivateStudent(student)}
                            title="Reativar aluno"
                            aria-label={`Reativar ${getStudentName(student)}`}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 transition hover:bg-emerald-500/20"
                          >
                            <RotateCcw size={18} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openArchiveModal(student)}
                            title="Arquivar aluno"
                            aria-label={`Arquivar ${getStudentName(student)}`}
                            className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-500/40 bg-yellow-500/10 text-yellow-300 transition hover:bg-yellow-500/20"
                          >
                            <Archive size={18} />
                          </button>
                        )}

                        <DeleteStudentButton studentId={student.id} />
                      </div>
                    </td>
                  </tr>

                  {archived && (
                    <tr className="border-t border-slate-900 bg-slate-950/30">
                      <td colSpan={10} className="px-4 pb-4">
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-full bg-slate-700/70 px-3 py-1 font-semibold text-slate-300">
                              Motivo:{" "}
                              {student.archive_reason || "Não informado"}
                            </span>

                            <span className="rounded-full bg-slate-700/70 px-3 py-1 font-semibold text-slate-300">
                              Arquivado em:{" "}
                              {formatDateTime(student.archived_at)}
                            </span>
                          </div>

                          {student.archive_notes && (
                            <p className="mt-3 leading-6 text-slate-400">
                              {student.archive_notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}

                  {isEditing && (
                    <tr className="border-t border-slate-800 bg-slate-950/40">
                      <td colSpan={10} className="p-4">
                        <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-5">
                          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                Editar aluno
                              </h3>

                              <p className="text-sm text-slate-400">
                                Corrija ou complete as informações do aluno.
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex items-center justify-center gap-2 rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                            >
                              <X size={16} />
                              Cancelar
                            </button>
                          </div>

                          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <input
                              value={editForm.name}
                              onChange={(event) =>
                                updateEditForm("name", event.target.value)
                              }
                              placeholder="Nome do aluno"
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            />

                            <div>
                              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                                Data de nascimento
                              </label>

                              <input
                                type="date"
                                value={editForm.birth_date}
                                onChange={(event) =>
                                  updateEditForm(
                                    "birth_date",
                                    event.target.value
                                  )
                                }
                                style={{ colorScheme: "dark" }}
                                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400"
                              />
                            </div>

                            <input
                              value={editForm.phone}
                              onChange={(event) =>
                                updateEditForm("phone", event.target.value)
                              }
                              placeholder="Telefone"
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            />

                            <input
                              value={editForm.email}
                              onChange={(event) =>
                                updateEditForm("email", event.target.value)
                              }
                              placeholder="E-mail"
                              type="email"
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            />

                            <select
                              value={editForm.class_id}
                              onChange={(event) =>
                                updateEditForm("class_id", event.target.value)
                              }
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            >
                              <option value="">Sem turma</option>

                              {classes.map((classItem) => (
                                <option key={classItem.id} value={classItem.id}>
                                  {classItem.name}
                                </option>
                              ))}
                            </select>

                            <select
                              value={editForm.course_id}
                              onChange={(event) =>
                                updateEditForm("course_id", event.target.value)
                              }
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            >
                              <option value="">Sem curso</option>

                              {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                  {course.name}
                                </option>
                              ))}
                            </select>

                            <input
                              value={editForm.average}
                              onChange={(event) =>
                                updateEditForm("average", event.target.value)
                              }
                              placeholder="Média"
                              type="number"
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            />

                            <input
                              value={editForm.attendance}
                              onChange={(event) =>
                                updateEditForm(
                                  "attendance",
                                  event.target.value
                                )
                              }
                              placeholder="Frequência"
                              type="number"
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400"
                            />

                            <select
                              value={editForm.status}
                              onChange={(event) =>
                                updateEditForm("status", event.target.value)
                              }
                              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-400 xl:col-span-4"
                            >
                              <option value="Regular">Regular</option>
                              <option value="Atenção">Atenção</option>
                              <option value="Excelente">Excelente</option>
                            </select>
                          </div>

                          <button
                            type="button"
                            onClick={() => saveEdit(student.id)}
                            disabled={savingId === student.id}
                            className="mt-5 flex items-center gap-2 rounded-2xl bg-blue-500 px-5 py-3 font-semibold text-white transition hover:bg-blue-400 disabled:opacity-50"
                          >
                            <Save size={18} />
                            {savingId === student.id
                              ? "Salvando..."
                              : "Salvar alterações"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {archiveStudent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur">
          <div className="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-500/15 text-yellow-300">
                  <Archive size={26} />
                </div>

                <h2 className="text-2xl font-black text-white">
                  Arquivar aluno
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-400">
                  O aluno sairá da listagem de ativos, mas o histórico ficará
                  salvo para consulta futura.
                </p>

                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/50 px-4 py-3 font-semibold text-white">
                  {getStudentName(archiveStudent)}
                </p>
              </div>

              <button
                type="button"
                onClick={closeArchiveModal}
                className="rounded-2xl border border-slate-700 p-2 text-slate-300 transition hover:bg-slate-800"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Motivo do arquivamento
                </label>

                <select
                  value={archiveForm.reason}
                  onChange={(event) =>
                    setArchiveForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400"
                >
                  {archiveReasons.map((reason) => (
                    <option key={reason} value={reason}>
                      {reason}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Observações
                </label>

                <textarea
                  value={archiveForm.notes}
                  onChange={(event) =>
                    setArchiveForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Ex.: aluno concluiu a turma, abandonou por motivo pessoal, pode retornar futuramente..."
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={closeArchiveModal}
                className="rounded-2xl border border-slate-700 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={archiveSelectedStudent}
                disabled={archiveSaving}
                className="flex items-center justify-center gap-2 rounded-2xl bg-yellow-500 px-5 py-3 font-black text-slate-950 transition hover:bg-yellow-400 disabled:opacity-50"
              >
                <Archive size={18} />
                {archiveSaving ? "Arquivando..." : "Confirmar arquivamento"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status === "AtenÃ§Ã£o" ? "Atenção" : status;

  const styles =
    normalizedStatus === "Excelente"
      ? "bg-emerald-500/10 text-emerald-300"
      : normalizedStatus === "Atenção"
      ? "bg-amber-500/10 text-amber-300"
      : "bg-blue-500/10 text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles}`}>
      {normalizedStatus}
    </span>
  );
}

function ArchiveBadge({ student }: { student: Student }) {
  if (student.archived) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full bg-slate-700/70 px-3 py-1 text-sm font-semibold text-slate-300">
        <Archive size={14} />
        Arquivado
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">
      Ativo
    </span>
  );
}