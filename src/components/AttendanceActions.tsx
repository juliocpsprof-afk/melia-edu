"use client";

import { useState } from "react";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export function AttendanceActions({ studentId }: { studentId: string }) {
  const [loading, setLoading] = useState(false);
  const [savedStatus, setSavedStatus] = useState("");

  async function saveAttendance(status: string) {
    setLoading(true);

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("attendance").insert({
      student_id: studentId,
      status,
      date: today,
    });

    setLoading(false);

    if (error) {
      alert("Erro ao salvar frequência: " + error.message);
      return;
    }

    setSavedStatus(status);

    setTimeout(() => {
      window.location.reload();
    }, 700);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => saveAttendance("Presente")}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 font-medium text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
        >
          <CheckCircle size={18} />
          Presente
        </button>

        <button
          onClick={() => saveAttendance("Falta")}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 font-medium text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
        >
          <XCircle size={18} />
          Falta
        </button>

        <button
          onClick={() => saveAttendance("Atraso")}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 font-medium text-amber-300 transition hover:bg-amber-500/20 disabled:opacity-50"
        >
          <Clock size={18} />
          Atraso
        </button>
      </div>

      {savedStatus && (
        <p className="text-sm text-emerald-300">
          Frequência salva: {savedStatus}
        </p>
      )}
    </div>
  );
}