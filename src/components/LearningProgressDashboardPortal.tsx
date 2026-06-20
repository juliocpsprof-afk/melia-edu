"use client";

import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  Loader2,
  Search,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { StudentIdentity } from "@/components/StudentIdentity";
import { supabase } from "@/lib/supabase";

type ProgressRow = {
  progress_id: string;
  student_id: string;
  student_name: string;
  photo_path: string | null;
  photo_status: string | null;
  identity_mode: string | null;
  avatar_key: string | null;
  course_id: string;
  course_name: string;
  started_at: string;
  status: string;
  current_class_id: string | null;
  current_class_name: string | null;
  weekly_workload_minutes: number | null;
  required_minutes: number;
  completed_minutes: number;
  remaining_minutes: number;
  progress_percentage: number;
  attendance_percentage: number;
  estimated_weeks_remaining: number | null;
  estimated_completion_date: string | null;
  evidence_level: string;
};

function formatHours(minutes: number) {
  const hours = Number(minutes ?? 0) / 60;
  return `${hours.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(hours) ? 0 : 1,
    maximumFractionDigits: 1,
  })}h`;
}

function formatDate(value: string | null) {
  if (!value) return "Não estimada";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? "Não estimada"
    : date.toLocaleDateString("pt-BR");
}

function mean(values: number[]) {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
}

export function LearningProgressDashboardPortal() {
  const pathname = usePathname();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [rows, setRows] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [available, setAvailable] = useState(true);
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [studentQuery, setStudentQuery] = useState("");

  useEffect(() => {
    if (pathname !== "/dashboard") {
      setTarget(null);
      return;
    }

    let frame = 0;

    function locate() {
      const element = document.querySelector<HTMLElement>(
        '[data-no-student-photo="true"] main'
      );
      if (element) {
        setTarget(element);
        return;
      }
      frame = window.requestAnimationFrame(locate);
    }

    locate();
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    let ignore = false;

    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("student_learning_progress")
        .select("*")
        .in("status", ["active", "paused"])
        .order("student_name", { ascending: true });

      if (ignore) return;

      setAvailable(!error);
      setRows((data as ProgressRow[] | null) ?? []);
      setLoading(false);
    }

    load();
    return () => {
      ignore = true;
    };
  }, [pathname]);

  const classOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => {
      if (row.current_class_id) {
        map.set(
          row.current_class_id,
          row.current_class_name || "Turma sem nome"
        );
      }
    });
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }, [rows]);

  const courseOptions = useMemo(() => {
    const map = new Map<string, string>();
    rows.forEach((row) => map.set(row.course_id, row.course_name));
    return Array.from(map, ([id, name]) => ({ id, name })).sort((a, b) =>
      a.name.localeCompare(b.name, "pt-BR")
    );
  }, [rows]);

  const filteredRows = useMemo(() => {
    const query = studentQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (classId && row.current_class_id !== classId) return false;
      if (courseId && row.course_id !== courseId) return false;
      if (query && !row.student_name.toLowerCase().includes(query)) return false;
      return true;
    });
  }, [rows, classId, courseId, studentQuery]);

  const orderedRows = useMemo(
    () =>
      [...filteredRows].sort((a, b) => {
        const missingA = a.required_minutes <= 0 ? 1 : 0;
        const missingB = b.required_minutes <= 0 ? 1 : 0;
        if (missingA !== missingB) return missingB - missingA;
        return a.progress_percentage - b.progress_percentage;
      }),
    [filteredRows]
  );

  if (pathname !== "/dashboard" || !target) return null;

  const configuredRows = filteredRows.filter((row) => row.required_minutes > 0);
  const averageProgress = mean(
    configuredRows.map((row) => Number(row.progress_percentage ?? 0))
  );
  const averageAttendance = mean(
    filteredRows.map((row) => Number(row.attendance_percentage ?? 0))
  );
  const totalRemaining = filteredRows.reduce(
    (sum, row) => sum + Number(row.remaining_minutes ?? 0),
    0
  );
  const missingConfiguration = filteredRows.filter(
    (row) =>
      row.required_minutes <= 0 ||
      !row.weekly_workload_minutes ||
      !row.current_class_id
  ).length;

  return createPortal(
    <section
      data-no-student-photo="true"
      className="rounded-[30px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-900/50 to-violet-500/10 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
            <CalendarClock size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Progresso de carga horária dos alunos
            </h2>
            <p className="mt-1 max-w-4xl text-sm leading-6 text-slate-400">
              A conclusão considera a carga do curso, as horas realmente
              cumpridas, os ajustes individuais e a rotina da turma atual.
            </p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 xl:w-[680px]">
          <select
            value={classId}
            onChange={(event) => setClassId(event.target.value)}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="">Todas as turmas</option>
            {classOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <select
            value={courseId}
            onChange={(event) => setCourseId(event.target.value)}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            <option value="">Todos os cursos</option>
            {courseOptions.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <label className="flex h-11 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
            <Search size={16} className="text-slate-500" />
            <input
              value={studentQuery}
              onChange={(event) => setStudentQuery(event.target.value)}
              placeholder="Pesquisar aluno"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
            />
          </label>
        </div>
      </div>

      {!available ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          Execute os arquivos de migração de carga horária no Supabase para
          ativar esta análise.
        </div>
      ) : loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Calculando trajetórias...
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Summary
              icon={<TrendingUp size={19} />}
              title="Progresso médio"
              value={`${averageProgress.toFixed(1)}%`}
            />
            <Summary
              icon={<Clock3 size={19} />}
              title="Horas restantes"
              value={formatHours(totalRemaining)}
            />
            <Summary
              icon={<CalendarClock size={19} />}
              title="Frequência ponderada"
              value={`${averageAttendance.toFixed(1)}%`}
            />
            <Summary
              icon={<AlertTriangle size={19} />}
              title="Configuração incompleta"
              value={String(missingConfiguration)}
              danger={missingConfiguration > 0}
            />
          </div>

          {orderedRows.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-dashed border-slate-700 bg-slate-950/35 p-6 text-center text-sm text-slate-500">
              Nenhum aluno encontrado neste filtro.
            </div>
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {orderedRows.slice(0, 12).map((row) => (
                <a
                  key={row.progress_id}
                  href={`/dashboard/alunos/${row.student_id}`}
                  className="group rounded-2xl border border-slate-800 bg-slate-950/55 p-4 transition hover:-translate-y-0.5 hover:border-cyan-500/40"
                >
                  <div className="flex items-start gap-3">
                    <StudentIdentity
                      studentId={row.student_id}
                      name={row.student_name}
                      photoPath={row.photo_path}
                      photoStatus={row.photo_status}
                      identityMode={row.identity_mode}
                      avatarKey={row.avatar_key}
                      viewer="teacher"
                      size="md"
                      expandable
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-white">
                        {row.student_name}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {row.course_name} • {row.current_class_name || "Sem turma"}
                      </p>
                    </div>
                    <span className="text-sm font-black text-cyan-200">
                      {row.progress_percentage.toFixed(0)}%
                    </span>
                  </div>

                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500"
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, row.progress_percentage)
                        )}%`,
                      }}
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-xl bg-slate-900/70 px-3 py-2">
                      <p className="text-slate-600">Restante</p>
                      <p className="mt-1 font-black text-white">
                        {formatHours(row.remaining_minutes)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-900/70 px-3 py-2">
                      <p className="text-slate-600">Previsão</p>
                      <p className="mt-1 font-black text-white">
                        {formatDate(row.estimated_completion_date)}
                      </p>
                    </div>
                  </div>

                  {row.required_minutes <= 0 && (
                    <div className="mt-3 rounded-xl bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
                      Configure a carga total do curso.
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </>
      )}
    </section>,
    target
  );
}

function Summary({
  icon,
  title,
  value,
  danger = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        danger
          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
          : "border-slate-800 bg-slate-950/50 text-cyan-200"
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide opacity-80">
        {icon} {title}
      </div>
      <p className="mt-3 text-3xl font-black text-white">{value}</p>
    </div>
  );
}
