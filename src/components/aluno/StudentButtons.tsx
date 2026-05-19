"use client";

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

  if (value.includes("youtube")) {
  return Video;
}

  if (value.includes("meet")) {
    return Video;
  }

  if (
    value.includes("apostila") ||
    value.includes("pdf") ||
    value.includes("material")
  ) {
    return BookOpen;
  }

  if (value.includes("http")) {
    return Globe;
  }

  return Link2;
}

export default function StudentButtons() {
  const router = useRouter();

  const [buttons, setButtons] = useState<PortalButton[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadButtons() {
      const savedSession = sessionStorage.getItem(
        "melia_student_session"
      );

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      const { data, error } = await supabase
        .from("student_portal_buttons")
        .select(`
          id,
          button_order,
          button_label,
          button_url
        `)
        .eq("student_id", parsedSession.studentId)
        .order("button_order", { ascending: true });

      if (error) {
        console.error(
          "Erro ao carregar botões:",
          error.message
        );
      }

      setButtons((data || []) as PortalButton[]);
      setLoading(false);
    }

    loadButtons();
  }, [router]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando links...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 pb-24 text-white">
      <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-5 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-3xl font-black">
              Links Rápidos
            </h1>

            <p className="mt-1 text-sm text-slate-400">
              Acesse materiais, aulas e plataformas externas.
            </p>
          </div>

          <div className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5">
            <p className="text-xs text-cyan-300">Atalhos</p>

            <h2 className="mt-2 text-4xl font-black text-white">
              {buttons.length}
            </h2>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-8">
        {buttons.length === 0 ? (
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-10 text-center text-slate-300">
            O professor ainda não cadastrou links para você.
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {buttons.map((button, index) => {
              const gradient =
                gradients[index % gradients.length];

              const Icon = getButtonIcon(
                button.button_url,
                button.button_label
              );

              return (
                <a
                  key={button.id}
                  href={button.button_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`group relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br ${gradient} p-[1px] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
                >
                  <div className="relative h-full rounded-[32px] bg-slate-950/90 p-6 backdrop-blur">
                    <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-white/5 blur-3xl" />

                    <div className="relative z-10">
                      <div className="flex items-start justify-between">
                        <div className="flex h-16 w-16 items-center justify-center rounded-[28px] bg-white/10 backdrop-blur">
                          <Icon className="h-8 w-8 text-white" />
                        </div>

                        <div className="rounded-2xl bg-white/10 p-3 backdrop-blur">
                          <ExternalLink className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      <div className="mt-8">
                        <p className="text-sm text-slate-300">
                          Link rápido
                        </p>

                        <h2 className="mt-2 text-3xl font-black text-white">
                          {button.button_label}
                        </h2>

                        <p className="mt-4 line-clamp-2 text-sm text-slate-400">
                          {button.button_url}
                        </p>
                      </div>

                      <div className="mt-8 inline-flex rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white backdrop-blur transition group-hover:bg-white/20">
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
    </main>
  );
}