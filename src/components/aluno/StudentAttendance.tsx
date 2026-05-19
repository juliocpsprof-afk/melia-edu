"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarCheck, Flame, XCircle, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
};

type Attendance = {
  id: string;
  student_id: string | null;
  date: string | null;
  status: string | null;
  arrival_time: string | null;
  notes: string | null;
};

function isPresent(status: string | null) {
  const normalized = status?.toLowerCase() || "";
  return normalized.includes("present") || normalized.includes("presente");
}

export default function StudentAttendance() {
  const router = useRouter();

  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAttendance() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      const { data, error } = await supabase
        .from("attendance")
        .select("id, student_id, date, status, arrival_time, notes")
        .eq("student_id", parsedSession.studentId)
        .order("date", { ascending: false });

      if (error) {
        console.error("Erro ao carregar frequência:", error.message);
      }

      setRecords((data || []) as Attendance[]);
      setLoading(false);
    }

    loadAttendance();
  }, [router]);

  const stats = useMemo(() => {
    const total = records.length;
    const present = records.filter((item) => isPresent(item.status)).length;
    const absent = total - present;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

    return { total, present, absent, percentage };
  }, [records]);

  const recentDays = records.slice(0, 21).reverse();

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando frequência...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-3xl font-black">Frequência</h1>

            <p className="mt-1 text-sm text-slate-400">
              Acompanhe sua presença nas aulas.
            </p>
          </div>

          <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5">
            <p className="text-xs text-cyan-300">Presença</p>
            <h2 className="mt-2 text-4xl font-black text-white">
              {stats.percentage}%
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-cyan-300">Progresso</p>
                <h2 className="mt-2 text-5xl font-black text-white">
                  {stats.percentage}%
                </h2>
              </div>

              <CalendarCheck className="h-14 w-14 text-cyan-300" />
            </div>

            <div className="mt-6 h-5 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>

            <p className="mt-4 text-sm text-slate-300">
              {stats.total === 0
                ? "Ainda não há registros de frequência."
                : "Quanto mais presença, mais forte fica seu progresso."}
            </p>
          </div>

          <div className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-green-500/10 p-6">
            <CheckCircle2 className="h-10 w-10 text-emerald-300" />
            <p className="mt-4 text-sm text-emerald-300">Presenças</p>
            <h2 className="mt-2 text-4xl font-black text-white">
              {stats.present}
            </h2>
          </div>

          <div className="rounded-[32px] border border-red-500/20 bg-gradient-to-br from-red-500/10 to-orange-500/10 p-6">
            <XCircle className="h-10 w-10 text-red-300" />
            <p className="mt-4 text-sm text-red-300">Faltas</p>
            <h2 className="mt-2 text-4xl font-black text-white">
              {stats.absent}
            </h2>
          </div>
        </div>

        <div className="mt-6 rounded-[32px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-yellow-500/20">
              <Flame className="h-7 w-7 text-yellow-300" />
            </div>

            <div>
              <p className="text-sm text-yellow-300">Sequência recente</p>
              <h2 className="text-2xl font-black text-white">
                {records.slice(0, 5).filter((item) => isPresent(item.status)).length}
                /5 presenças recentes
              </h2>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-6">
            <p className="text-sm text-cyan-300">Calendário visual</p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Últimos registros
            </h2>
          </div>

          {recentDays.length === 0 ? (
            <p className="text-slate-400">Nenhum registro encontrado.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-7">
              {recentDays.map((item) => {
                const present = isPresent(item.status);

                return (
                  <div
                    key={item.id}
                    className={`rounded-3xl border p-4 text-center ${
                      present
                        ? "border-emerald-500/20 bg-emerald-500/10"
                        : "border-red-500/20 bg-red-500/10"
                    }`}
                  >
                    <p className="text-xs text-slate-400">
                      {item.date
                        ? new Date(item.date).toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                          })
                        : "--"}
                    </p>

                    <p
                      className={`mt-2 text-sm font-bold ${
                        present ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
                      {present ? "Presente" : "Falta"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
          <div className="mb-6">
            <p className="text-sm text-purple-300">Histórico completo</p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Todos os registros
            </h2>
          </div>

          <div className="space-y-3">
            {records.length === 0 ? (
              <p className="text-slate-400">Nenhum histórico disponível.</p>
            ) : (
              records.map((item) => {
                const present = isPresent(item.status);

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-3xl border border-slate-800 bg-slate-950 p-4"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {item.date
                          ? new Date(item.date).toLocaleDateString("pt-BR")
                          : "Sem data"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        {item.arrival_time
                          ? `Chegada: ${item.arrival_time}`
                          : item.notes || "Sem observações"}
                      </p>
                    </div>

                    <span
                      className={`rounded-2xl px-3 py-2 text-sm font-semibold ${
                        present
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-red-500/20 text-red-300"
                      }`}
                    >
                      {present ? "Presente" : "Falta"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>
    </main>
  );
}