"use client";

import { KeyRound, LogOut, ShieldAlert, Sparkles } from "lucide-react";

type StudentHeaderProps = {
  studentName: string;
  classNameValue: string;
  onLogout: () => void;
  onOpenPinSettings?: () => void;
  mustChangePin?: boolean;
};

export default function StudentHeader({
  studentName,
  classNameValue,
  onLogout,
  onOpenPinSettings,
  mustChangePin = false,
}: StudentHeaderProps) {
  const firstName = studentName.split(" ")[0] || "Aluno";

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-4 text-white backdrop-blur-xl sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <Sparkles className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-400">
                Portal do Aluno
              </p>

              <h1 className="truncate text-lg font-black text-white sm:text-xl">
                Olá, {firstName}
              </h1>
            </div>
          </div>

          <p className="mt-1 truncate pl-12 text-xs font-medium text-slate-500 sm:text-sm">
            {classNameValue}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onOpenPinSettings && (
            <button
              type="button"
              onClick={onOpenPinSettings}
              title={
                mustChangePin
                  ? "Trocar PIN inicial"
                  : "Alterar PIN de acesso"
              }
              className={`relative flex h-11 items-center gap-2 rounded-2xl border px-3 text-sm font-bold transition sm:px-4 ${
                mustChangePin
                  ? "animate-pulse border-yellow-400/40 bg-yellow-500/15 text-yellow-200 hover:bg-yellow-500/25"
                  : "border-cyan-400/20 bg-cyan-500/10 text-cyan-200 hover:bg-cyan-500/20"
              }`}
            >
              {mustChangePin ? (
                <ShieldAlert className="h-5 w-5" />
              ) : (
                <KeyRound className="h-5 w-5" />
              )}

              <span className="hidden sm:inline">
                {mustChangePin ? "Trocar PIN" : "PIN"}
              </span>

              {mustChangePin && (
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-yellow-300 shadow-lg shadow-yellow-300/40" />
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onLogout}
            className="flex h-11 items-center gap-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 sm:px-4"
          >
            <LogOut className="h-5 w-5" />

            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}