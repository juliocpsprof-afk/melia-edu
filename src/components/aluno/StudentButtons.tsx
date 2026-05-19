"use client";

import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  Globe,
  BookOpen,
  Video,
  Link2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type StudentSession = {
  studentId: string;
};

type PortalButton = {
  id: string;
  button_order: number;
  button_label: string;
  button_url: string;
};

const gradients = [
  "from-cyan-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
  "from-emerald-500 to-green-600",
  "from-orange-500 to-red-500",
  "from-indigo-500 to-violet-600",
];

function getButtonIcon(url: string, label: string) {
  const value = `${url} ${label}`.toLowerCase();

  if (value.includes("youtube")) return Video;
  if (value.includes("meet")) return Video;

  if (
    value.includes("apostila") ||
    value.includes("pdf") ||
    value.includes("material")
  ) {
    return BookOpen;
  }

  if (value.includes("http")) return Globe;

  return Link2;
}

export default function StudentButtons() {
  const router = useRouter();

  const [buttons, setButtons] = useState<PortalButton[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadButtons() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      const { data, error } = await supabase
        .from("student_portal_buttons")
        .select("id, button_order, button_label, button_url")
        .eq("student_id", parsedSession.studentId)
        .order("button_order", { ascending: true });

      if (error) {
        console.error("Erro ao carregar botões:", error.message);
      }

      setButtons((data || []) as PortalButton[]);
      setLoading(false);
    }

    loadButtons();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-center text-white">
        Carregando links...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-4 py-4 backdrop-blur sm:px-5">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-2xl font-black sm:text-3xl">
              Links Rápidos
            </h1>

            <p className="mt-1 max-w-md text-sm text-slate-400">
              Acesse materiais, aulas, vídeos e plataformas externas.
            </p>
          </div>

          <div className="shrink-0 rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-4 sm:p-5">
            <p className="text-xs text-cyan-300">Atalhos</p>

            <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">
              {buttons.length}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 sm:px-5 sm:py-8">
        {buttons.length === 0 ? (
          <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-300 sm:rounded-[32px] sm:p-10">
            O professor ainda não cadastrou links para você.
          </div>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
            {buttons.map((button, index) => {
              const gradient = gradients[index % gradients.length];
              const Icon = getButtonIcon(button.button_url, button.button_label);

              return (
                <a
                  key={button.id}
                  href={button.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${gradient} p-[1px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:rounded-[32px]`}
                >
                  <div className="relative h-full rounded-[28px] bg-slate-950/90 p-5 backdrop-blur sm:rounded-[32px] sm:p-6">
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-white/5 blur-3xl sm:h-32 sm:w-32" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[24px] bg-white/10 backdrop-blur sm:h-16 sm:w-16 sm:rounded-[28px]">
                          <Icon className="h-7 w-7 text-white sm:h-8 sm:w-8" />
                        </div>

                        <div className="shrink-0 rounded-2xl bg-white/10 p-3 backdrop-blur">
                          <ExternalLink className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      <div className="mt-7 sm:mt-8">
                        <p className="text-sm text-slate-300">Link rápido</p>

                        <h2 className="mt-2 break-words text-2xl font-black text-white sm:text-3xl">
                          {button.button_label}
                        </h2>

                        <p className="mt-4 line-clamp-2 break-all text-sm text-slate-400">
                          {button.button_url}
                        </p>
                      </div>

                      <div className="mt-7 inline-flex rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition group-hover:bg-white/20 sm:mt-8">
                        Abrir agora
                      </div>
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </section>

      <StudentRealtimeNotifications />
    </main>
  );
}