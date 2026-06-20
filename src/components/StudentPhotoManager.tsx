"use client";

import {
  Camera,
  CheckCircle2,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  StudentPhotoUploader,
  type StudentPhotoData,
} from "@/components/StudentPhotoUploader";

type ManagerStudent = StudentPhotoData & {
  class_name?: string | null;
  archived?: boolean | null;
};

type FilterValue = "all" | "missing" | "pending" | "approved" | "rejected";

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function StudentPhotoManager({
  students: initialStudents,
}: {
  students: ManagerStudent[];
}) {
  const [students, setStudents] = useState(
    initialStudents.filter((student) => !student.archived)
  );
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [openStudentId, setOpenStudentId] = useState("");

  const counts = useMemo(() => {
    return {
      all: students.length,
      missing: students.filter((student) => !student.photo_path).length,
      pending: students.filter(
        (student) =>
          Boolean(student.photo_path) &&
          (!student.photo_status || student.photo_status === "pending")
      ).length,
      approved: students.filter(
        (student) => student.photo_status === "approved"
      ).length,
      rejected: students.filter(
        (student) => student.photo_status === "rejected"
      ).length,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return students.filter((student) => {
      if (filter === "missing" && student.photo_path) return false;
      if (
        filter === "pending" &&
        (!student.photo_path || student.photo_status === "approved" || student.photo_status === "rejected")
      ) {
        return false;
      }
      if (filter === "approved" && student.photo_status !== "approved") {
        return false;
      }
      if (filter === "rejected" && student.photo_status !== "rejected") {
        return false;
      }

      if (!normalizedSearch) return true;

      return normalizeText(
        `${student.name} ${student.class_name ?? ""} ${
          student.photo_rejection_reason ?? ""
        }`
      ).includes(normalizedSearch);
    });
  }, [students, search, filter]);

  function handleUpdated(nextStudent: StudentPhotoData) {
    setStudents((current) =>
      current.map((student) =>
        student.id === nextStudent.id
          ? {
              ...student,
              ...nextStudent,
            }
          : student
      )
    );
  }

  const filterOptions: {
    value: FilterValue;
    label: string;
    count: number;
    icon: typeof Camera;
  }[] = [
    {
      value: "all",
      label: "Todos",
      count: counts.all,
      icon: UserRound,
    },
    {
      value: "missing",
      label: "Sem foto",
      count: counts.missing,
      icon: Camera,
    },
    {
      value: "pending",
      label: "Aguardando",
      count: counts.pending,
      icon: ShieldAlert,
    },
    {
      value: "approved",
      label: "Aprovadas",
      count: counts.approved,
      icon: CheckCircle2,
    },
    {
      value: "rejected",
      label: "Rejeitadas",
      count: counts.rejected,
      icon: XCircle,
    },
  ];

  return (
    <section className="mt-8 rounded-[32px] border border-cyan-500/20 bg-cyan-500/10 p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
              <Camera size={26} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                Fotos de identificação
              </h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Envie, amplie, aprove ou solicite uma nova foto. No painel do
                professor a foto real é sempre priorizada.
              </p>
            </div>
          </div>
        </div>

        <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950 px-4 xl:w-96">
          <Search size={18} className="text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar aluno ou turma..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {filterOptions.map((option) => {
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setFilter(option.value)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                filter === option.value
                  ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                  : "border-slate-700 bg-slate-950/60 text-slate-400 hover:border-cyan-500/40"
              }`}
            >
              <Icon size={15} />
              {option.label}
              <span className="rounded-full bg-slate-950/70 px-2 py-0.5 text-xs">
                {option.count}
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400">
            Nenhum aluno encontrado neste filtro.
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isOpen = openStudentId === student.id;

            return (
              <div
                key={student.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50"
              >
                <button
                  type="button"
                  onClick={() =>
                    setOpenStudentId((current) =>
                      current === student.id ? "" : student.id
                    )
                  }
                  className="flex w-full items-center justify-between gap-4 p-4 text-left transition hover:bg-slate-900/60"
                >
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">
                      {student.name}
                    </p>
                    <p className="mt-1 truncate text-sm text-slate-400">
                      {student.class_name || "Sem turma"} •{" "}
                      {!student.photo_path
                        ? "foto pendente"
                        : student.photo_status === "approved"
                        ? "foto aprovada"
                        : student.photo_status === "rejected"
                        ? "foto rejeitada"
                        : "aguardando aprovação"}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300">
                    {isOpen ? "Fechar" : "Gerenciar"}
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-800 p-4">
                    <StudentPhotoUploader
                      student={student}
                      viewer="teacher"
                      onUpdated={handleUpdated}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
