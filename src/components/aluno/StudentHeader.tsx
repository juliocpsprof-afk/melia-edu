"use client";

import StudentAvatar from "./StudentAvatar";

type StudentHeaderProps = {
  studentName: string;
  classNameValue: string;
  onLogout: () => void;
};

export default function StudentHeader({
  studentName,
  classNameValue,
  onLogout,
}: StudentHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-cyan-300">
            {classNameValue}
          </p>

          <h1 className="truncate text-xl font-black text-white sm:text-2xl">
            {studentName}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 md:block">
            <p className="text-xs text-slate-400">Status</p>

            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />
              <p className="text-sm font-medium text-white">Online</p>
            </div>
          </div>

          <StudentAvatar name={studentName} size="md" />

          <button
            onClick={onLogout}
            className="rounded-2xl border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-200 sm:px-4 sm:py-3"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}