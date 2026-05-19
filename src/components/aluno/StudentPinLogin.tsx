"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function normalizePhone(value: string) {
  return value.replace(/\D/g, "");
}

export default function StudentPinLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const studentId = searchParams.get("studentId");
  const classId = searchParams.get("classId");

  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin() {
    setErrorMessage("");

    if (!studentId || !classId) {
      setErrorMessage("Dados do aluno não encontrados.");
      return;
    }

    if (!pin.trim()) {
      setErrorMessage("Digite o telefone/PIN para continuar.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("id, name, phone, class_id")
      .eq("id", studentId)
      .eq("class_id", classId)
      .single();

    setLoading(false);

    if (error || !data) {
      setErrorMessage("Aluno não encontrado.");
      return;
    }

    const typedPin = normalizePhone(pin);
    const savedPhone = normalizePhone(data.phone || "");

    if (!savedPhone || typedPin !== savedPhone) {
      setErrorMessage("PIN incorreto. Digite o telefone cadastrado.");
      return;
    }

    sessionStorage.setItem(
      "melia_student_session",
      JSON.stringify({
        studentId: data.id,
        classId: data.class_id,
        studentName: data.name,
        loggedAt: new Date().toISOString(),
      })
    );

    router.push("/aluno/dashboard");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <section className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
          <Link
            href={classId ? `/aluno/turma/${classId}` : "/aluno"}
            className="mb-6 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800"
          >
            ← Voltar
          </Link>

          <p className="mb-2 text-sm font-medium text-cyan-300">
            Portal do Aluno
          </p>

          <h1 className="text-3xl font-bold">Digite seu PIN</h1>

          <p className="mt-3 text-slate-300">
            Use o telefone cadastrado pelo professor para acessar seu painel.
          </p>

          <div className="mt-8">
            <label className="mb-2 block text-sm text-slate-300">
              Telefone/PIN
            </label>

            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              placeholder="Digite seu telefone"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              inputMode="numeric"
            />
          </div>

          {errorMessage && (
            <div className="mt-4 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verificando..." : "Entrar no meu portal"}
          </button>
        </div>
      </section>
    </main>
  );
}