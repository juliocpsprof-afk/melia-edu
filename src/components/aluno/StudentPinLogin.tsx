"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizePin(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getFirstNameDefaultPin(name: string) {
  const firstName = normalizeText(name).split(/\s+/)[0] || "aluno";

  return `${firstName}123`;
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
      setErrorMessage("Digite seu PIN para continuar.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("students")
      .select("id, name, class_id, portal_pin, must_change_pin")
      .eq("id", studentId)
      .eq("class_id", classId)
      .eq("archived", false)
      .single();

    if (error || !data) {
      setLoading(false);
      setErrorMessage("Aluno não encontrado.");
      return;
    }

    const typedPin = pin.trim();
    const normalizedTypedPin = normalizePin(typedPin);

    const savedPortalPin =
      typeof data.portal_pin === "string" ? data.portal_pin.trim() : "";

    const defaultPin = getFirstNameDefaultPin(data.name || "Aluno");

    const hasSavedPin = Boolean(savedPortalPin);

    const isSavedPinCorrect = hasSavedPin && typedPin === savedPortalPin;

    const isDefaultPinCorrect =
      !hasSavedPin && normalizedTypedPin === defaultPin;

    if (!isSavedPinCorrect && !isDefaultPinCorrect) {
      setLoading(false);
      setErrorMessage(
        "PIN incorreto. Use o PIN padrão do primeiro acesso ou seu PIN pessoal."
      );
      return;
    }

    if (!hasSavedPin && isDefaultPinCorrect) {
      const { error: updatePinError } = await supabase
        .from("students")
        .update({
          portal_pin: defaultPin,
          must_change_pin: true,
          pin_updated_at: new Date().toISOString(),
        })
        .eq("id", data.id);

      if (updatePinError) {
        setLoading(false);
        setErrorMessage("Não foi possível preparar seu PIN. Tente novamente.");
        return;
      }
    }

    setLoading(false);

    sessionStorage.setItem(
      "melia_student_session",
      JSON.stringify({
        studentId: data.id,
        classId: data.class_id,
        studentName: data.name,
        mustChangePin: data.must_change_pin !== false || !hasSavedPin,
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
            className="mb-6 inline-flex rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800"
          >
            ← Voltar
          </Link>

          <p className="mb-2 text-sm font-medium text-cyan-300">
            Portal do Aluno
          </p>

          <h1 className="text-3xl font-bold">Digite seu PIN</h1>

          <p className="mt-3 text-slate-300">
            No primeiro acesso, use o padrão da escola: seu primeiro nome em
            letras minúsculas seguido de <strong>123</strong>.
          </p>

          <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 px-4 py-3 text-sm text-cyan-100">
            Exemplo: se o nome for <strong>Maria Eduarda</strong>, o PIN inicial
            será <strong>maria123</strong>.
          </div>

          <div className="mt-8">
            <label className="mb-2 block text-sm text-slate-300">
              PIN de acesso
            </label>

            <input
              value={pin}
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  handleLogin();
                }
              }}
              placeholder="Ex.: maria123"
              className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
              autoComplete="current-password"
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