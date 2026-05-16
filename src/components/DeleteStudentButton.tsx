"use client";

import { Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";

export function DeleteStudentButton({ studentId }: { studentId: string }) {
  async function handleDelete() {
    const confirmed = confirm("Tem certeza que deseja excluir este aluno?");

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("students")
      .delete()
      .eq("id", studentId);

    if (error) {
      alert("Erro ao excluir aluno.");
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={handleDelete}
      className="rounded-xl border border-red-500/30 p-2 text-red-300 transition hover:bg-red-500/10"
      title="Excluir aluno"
    >
      <Trash2 size={18} />
    </button>
  );
}