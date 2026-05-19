"use client";

type StudentHeaderProps = {
  studentName: string;
  classNameValue: string;
  onLogout: () => void;
};

function getInitials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0][0].toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export default function StudentHeader({
  studentName,
  classNameValue,
  onLogout,
}: StudentHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-medium text-cyan-300">
            {classNameValue}
          </p>

          <h1 className="text-2xl font-black text-white">
            {studentName}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 md:block">
            <p className="text-xs text-slate-400">Status</p>

            <div className="mt-1 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-400" />

              <p className="text-sm font-medium text-white">Online</p>
            </div>
          </div>

          <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 text-lg font-black text-white shadow-lg shadow-purple-500/20">
            {getInitials(studentName)}
          </div>

          <button
            onClick={onLogout}
            className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300 transition hover:border-red-400 hover:bg-red-500/10 hover:text-red-200"
          >
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}