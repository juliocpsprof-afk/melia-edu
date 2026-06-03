"use client";

import { useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getDefaultStudentPin(name: string) {
  const firstName = normalizeText(name).split(/\s+/)[0] || "aluno";

  return `${firstName}123`;
}

export function ResetStudentPinButton({
  studentId,
  studentName,
}: {
  studentId: string;
  studentName: string;
}) {
  const [loading, setLoading] = useState(false);

  async function handleResetPin() {
    const defaultPin = getDefaultStudentPin(studentName);

    const confirmed = window.confirm(
      `Deseja resetar o PIN de ${studentName}?\n\nO novo PIN será: ${defaultPin}\n\nNo próximo acesso, o aluno será orientado a trocar o PIN.`
    );

    if (!confirmed) {
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("students")
      .update({
        portal_pin: defaultPin,
        must_change_pin: true,
        pin_updated_at: new Date().toISOString(),
      })
      .eq("id", studentId);

    setLoading(false);

    if (error) {
      alert(`Erro ao resetar PIN: ${error.message}`);
      return;
    }

    alert(
      `PIN resetado com sucesso!\n\nAluno: ${studentName}\nPIN temporário: ${defaultPin}`
    );

    window.location.reload();
  }

  return (
    <button
      type="button"
      onClick={handleResetPin}
      disabled={loading}
      className="flex items-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-cyan-200 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <KeyRound size={18} />
      )}

      {loading ? "Resetando..." : "Resetar PIN"}
    </button>
  );
}