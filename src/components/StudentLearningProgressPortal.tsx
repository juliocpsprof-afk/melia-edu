"use client";

import {
  CalendarClock,
  Clock3,
  History,
  Loader2,
  MinusCircle,
  PlusCircle,
  Save,
  TrendingUp,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { supabase } from "@/lib/supabase";

type ProgressRow = {
  progress_id: string;
  student_id: string;
  student_name: string;
  course_id: string;
  course_name: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  current_class_id: string | null;
  current_class_name: string | null;
  schedule_days: number[] | null;
  weekly_workload_minutes: number | null;
  default_session_minutes: number | null;
  base_workload_minutes: number;
  required_adjustment_minutes: number;
  completed_adjustment_minutes: number;
  scheduled_minutes: number;
  attended_minutes: number;
  attendance_records: number;
  required_minutes: number;
  completed_minutes: number;
  remaining_minutes: number;
  progress_percentage: number;
  attendance_percentage: number;
  estimated_weeks_remaining: number | null;
  estimated_completion_date: string | null;
  evidence_level: "initial" | "moderate" | "consolidated" | string;
};

type AdjustmentRow = {
  id: string;
  progress_id: string;
  adjustment_kind: "required" | "completed";
  minutes_delta: number;
  reason: string;
  effective_date: string;
  created_at: string;
};

type EnrollmentRow = {
  id: string;
  class_id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  change_reason: string | null;
  classes: { name?: string | null } | { name?: string | null }[] | null;
};

type AdjustmentAction =
  | "increase_required"
  | "reduce_required"
  | "add_completed"
  | "remove_completed";

const dayNames: Record<number, string> = {
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
  7: "Dom",
};

function formatHours(minutes: number | null | undefined) {
  const value = Number(minutes ?? 0) / 60;
  return `${value.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1,
  })}h`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Não estimada";
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Não estimada";
  return date.toLocaleDateString("pt-BR");
}

function getClassName(relation: EnrollmentRow["classes"]) {
  if (!relation) return "Turma";
  return Array.isArray(relation)
    ? relation[0]?.name || "Turma"
    : relation.name || "Turma";
}

function evidenceLabel(value: string) {
  if (value === "consolidated") return "Evidência consolidada";
  if (value === "moderate") return "Evidência moderada";
  return "Evidência inicial";
}

export function StudentLearningProgressPortal() {
  const pathname = usePathname();
  const studentId = pathname.match(/^\/dashboard\/alunos\/([^/]+)$/)?.[1] ?? "";
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [progressRows, setProgressRows] = useState<ProgressRow[]>([]);
  const [adjustments, setAdjustments] = useState<AdjustmentRow[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedProgressId, setSelectedProgressId] = useState("");
  const [action, setAction] = useState<AdjustmentAction>("add_completed");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!studentId) {
      setTarget(null);
      return;
    }

    let frame = 0;

    function locateTarget() {
      const element = document.querySelector<HTMLElement>(
        "#student-profile-content"
      );
      if (element) {
        setTarget(element);
        return;
      }
      frame = window.requestAnimationFrame(locateTarget);
    }

    locateTarget();

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [studentId]);

  const load = useCallback(async () => {
    if (!studentId) return;

    setLoading(true);
    setLoadError("");

    const progressResponse = await supabase
      .from("student_learning_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("started_at", { ascending: false });

    if (progressResponse.error) {
      setLoading(false);
      setLoadError(
        "Execute o arquivo supabase/learning_time_model.sql para ativar o cálculo de carga horária."
      );
      return;
    }

    const loadedProgress =
      (progressResponse.data as ProgressRow[] | null) ?? [];
    const progressIds = loadedProgress.map((item) => item.progress_id);

    const [adjustmentsResponse, enrollmentsResponse] = await Promise.all([
      progressIds.length
        ? supabase
            .from("student_workload_adjustments")
            .select(
              "id, progress_id, adjustment_kind, minutes_delta, reason, effective_date, created_at"
            )
            .in("progress_id", progressIds)
            .order("effective_date", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("student_class_enrollments")
        .select(
          "id, class_id, started_at, ended_at, status, change_reason, classes(name)"
        )
        .eq("student_id", studentId)
        .order("started_at", { ascending: false }),
    ]);

    setProgressRows(loadedProgress);
    setAdjustments(
      (adjustmentsResponse.data as AdjustmentRow[] | null) ?? []
    );
    setEnrollments(
      (enrollmentsResponse.data as unknown as EnrollmentRow[] | null) ?? []
    );
    setSelectedProgressId((current) =>
      current && progressIds.includes(current)
        ? current
        : loadedProgress.find(
            (item) => item.status === "active" || item.status === "paused"
          )?.progress_id ?? loadedProgress[0]?.progress_id ?? ""
    );
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  const currentProgress = useMemo(
    () =>
      progressRows.find((item) => item.progress_id === selectedProgressId) ??
      progressRows[0] ??
      null,
    [progressRows, selectedProgressId]
  );

  async function saveAdjustment() {
    if (!currentProgress) return;

    const numericHours = Number(hours.replace(",", "."));

    if (!Number.isFinite(numericHours) || numericHours <= 0) {
      setFeedback("Informe uma quantidade de horas maior que zero.");
      return;
    }

    if (reason.trim().length < 3) {
      setFeedback("Informe o motivo do ajuste.");
      return;
    }

    const absoluteMinutes = Math.round(numericHours * 60);
    const adjustmentKind = action.includes("required")
      ? "required"
      : "completed";
    const minutesDelta =
      action === "reduce_required" || action === "remove_completed"
        ? -absoluteMinutes
        : absoluteMinutes;

    setSaving(true);
    setFeedback("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase
      .from("student_workload_adjustments")
      .insert({
        progress_id: currentProgress.progress_id,
        adjustment_kind: adjustmentKind,
        minutes_delta: minutesDelta,
        reason: reason.trim(),
        effective_date: new Date().toISOString().slice(0, 10),
        created_by: user?.id ?? null,
      });

    setSaving(false);

    if (error) {
      setFeedback(error.message);
      return;
    }

    setHours("");
    setReason("");
    setFeedback("Ajuste registrado com sucesso.");
    await load();
  }

  if (!studentId || !target) return null;

  const content = (
    <section
      data-no-student-photo="true"
      className="mt-6 rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 via-slate-950/70 to-violet-500/10 p-5 sm:p-6"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
            <TrendingUp size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Trajetória e carga horária do aluno
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
              O cálculo acompanha o aluno mesmo quando ele muda de turma. A
              previsão usa a carga semanal e os dias da turma em que ele está
              atualmente.
            </p>
          </div>
        </div>

        {progressRows.length > 1 && (
          <select
            value={selectedProgressId}
            onChange={(event) => setSelectedProgressId(event.target.value)}
            className="h-11 rounded-xl border border-slate-700 bg-slate-950 px-3 text-sm text-white outline-none focus:border-cyan-400"
          >
            {progressRows.map((item) => (
              <option key={item.progress_id} value={item.progress_id}>
                {item.course_name} — {item.status}
              </option>
            ))}
          </select>
        )}
      </div>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={18} className="animate-spin" /> Calculando progresso...
        </div>
      ) : loadError ? (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {loadError}
        </div>
      ) : !currentProgress ? (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-5 text-sm text-slate-400">
          Este aluno ainda não possui um curso vinculado. Vincule o curso no
          cadastro para iniciar o acompanhamento.
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric
              title="Carga obrigatória"
              value={formatHours(currentProgress.required_minutes)}
              description={`Base ${formatHours(
                currentProgress.base_workload_minutes
              )} • ajustes ${formatHours(
                currentProgress.required_adjustment_minutes
              )}`}
            />
            <Metric
              title="Carga cumprida"
              value={formatHours(currentProgress.completed_minutes)}
              description={`${currentProgress.progress_percentage.toFixed(
                1
              )}% do curso`}
            />
            <Metric
              title="Carga restante"
              value={formatHours(currentProgress.remaining_minutes)}
              description={
                currentProgress.estimated_weeks_remaining === null
                  ? "Configure a carga semanal da turma"
                  : `${currentProgress.estimated_weeks_remaining.toFixed(
                      1
                    )} semana(s) estimada(s)`
              }
            />
            <Metric
              title="Conclusão estimada"
              value={formatDate(currentProgress.estimated_completion_date)}
              description={evidenceLabel(currentProgress.evidence_level)}
            />
          </div>

          <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-900">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 transition-all"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(100, currentProgress.progress_percentage)
                )}%`,
              }}
            />
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center gap-2">
                <Clock3 size={18} className="text-cyan-300" />
                <h3 className="font-black text-white">Contexto do cálculo</h3>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Info label="Curso" value={currentProgress.course_name} />
                <Info
                  label="Início da trajetória"
                  value={formatDate(currentProgress.started_at)}
                />
                <Info
                  label="Turma atual"
                  value={currentProgress.current_class_name || "Sem turma"}
                />
                <Info
                  label="Carga semanal atual"
                  value={formatHours(
                    currentProgress.weekly_workload_minutes ?? 0
                  )}
                />
                <Info
                  label="Dias atuais"
                  value={
                    currentProgress.schedule_days?.length
                      ? currentProgress.schedule_days
                          .map((day) => dayNames[day] || String(day))
                          .join(", ")
                      : "Não configurados"
                  }
                />
                <Info
                  label="Frequência ponderada"
                  value={`${currentProgress.attendance_percentage.toFixed(
                    1
                  )}%`}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5">
              <div className="flex items-center gap-2">
                <Save size={18} className="text-violet-300" />
                <h3 className="font-black text-white">
                  Ajustar carga individual
                </h3>
              </div>
              <p className="mt-2 text-xs leading-5 text-slate-500">
                Registre horas adicionais, reduções autorizadas, aulas
                complementares ou correções. O histórico nunca é apagado.
              </p>

              <div className="mt-4 grid gap-3">
                <select
                  value={action}
                  onChange={(event) =>
                    setAction(event.target.value as AdjustmentAction)
                  }
                  className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-violet-400"
                >
                  <option value="add_completed">
                    Creditar aula ou atividade complementar
                  </option>
                  <option value="remove_completed">
                    Corrigir horas cumpridas para menos
                  </option>
                  <option value="increase_required">
                    Aumentar carga obrigatória
                  </option>
                  <option value="reduce_required">
                    Reduzir carga obrigatória
                  </option>
                </select>

                <input
                  type="number"
                  min="0.25"
                  step="0.25"
                  value={hours}
                  onChange={(event) => setHours(event.target.value)}
                  placeholder="Quantidade de horas"
                  className="h-11 rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-violet-400"
                />

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder="Motivo pedagógico ou administrativo do ajuste"
                  className="resize-none rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-violet-400"
                />

                {feedback && (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300">
                    {feedback}
                  </div>
                )}

                <button
                  type="button"
                  onClick={saveAdjustment}
                  disabled={saving}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-black text-white transition hover:bg-violet-400 disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 size={17} className="animate-spin" />
                  ) : action === "increase_required" ||
                    action === "add_completed" ? (
                    <PlusCircle size={17} />
                  ) : (
                    <MinusCircle size={17} />
                  )}
                  Registrar ajuste
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            <HistoryBlock
              title="Histórico de turmas"
              icon={<History size={18} />}
            >
              {enrollments.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhuma mudança de turma registrada.
                </p>
              ) : (
                enrollments.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"
                  >
                    <p className="font-bold text-white">
                      {getClassName(item.classes)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(item.started_at)} até{" "}
                      {item.ended_at ? formatDate(item.ended_at) : "atual"} •{" "}
                      {item.status}
                    </p>
                  </div>
                ))
              )}
            </HistoryBlock>

            <HistoryBlock
              title="Ajustes de carga"
              icon={<CalendarClock size={18} />}
            >
              {adjustments.filter(
                (item) => item.progress_id === currentProgress.progress_id
              ).length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum ajuste individual registrado.
                </p>
              ) : (
                adjustments
                  .filter(
                    (item) => item.progress_id === currentProgress.progress_id
                  )
                  .map((item) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-bold text-white">
                            {item.adjustment_kind === "required"
                              ? "Carga obrigatória"
                              : "Carga cumprida"}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-400">
                            {item.reason}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-black ${
                            item.minutes_delta > 0
                              ? "bg-emerald-500/10 text-emerald-200"
                              : "bg-red-500/10 text-red-200"
                          }`}
                        >
                          {item.minutes_delta > 0 ? "+" : ""}
                          {formatHours(item.minutes_delta)}
                        </span>
                      </div>
                      <p className="mt-2 text-[11px] text-slate-600">
                        {formatDate(item.effective_date)}
                      </p>
                    </div>
                  ))
              )}
            </HistoryBlock>
          </div>
        </>
      )}
    </section>
  );

  return createPortal(content, target);
}

function Metric({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
      <p className="text-xs font-black uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/45 p-3">
      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-600">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-slate-200">{value}</p>
    </div>
  );
}

function HistoryBlock({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-950/35 p-5">
      <div className="flex items-center gap-2 text-cyan-200">
        {icon}
        <h3 className="font-black text-white">{title}</h3>
      </div>
      <div className="mt-4 space-y-2">{children}</div>
    </div>
  );
}
