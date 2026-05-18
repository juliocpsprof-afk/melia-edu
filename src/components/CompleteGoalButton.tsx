"use client";

import { CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export function CompleteGoalButton({ goalId }: { goalId: string }) {
  async function handleCompleteGoal() {
    const { error } = await supabase
      .from("goals")
      .update({
        status: "Concluída",
      })
      .eq("id", goalId);

    if (error) {
      alert("Erro ao concluir meta.");
      return;
    }

    window.location.reload();
  }

  return (
    <button
      onClick={handleCompleteGoal}
      className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 transition hover:bg-emerald-500/20"
    >
      <CheckCircle size={16} />
      Concluir
    </button>
  );
}