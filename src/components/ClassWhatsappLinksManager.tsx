"use client";

import {
  CheckCircle2,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  Save,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
  status: string | null;
  whatsapp_group_link: string | null;
};

type Feedback = {
  type: "success" | "error";
  text: string;
};

function normalizeWhatsappLink(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) return "";

  try {
    const url = new URL(cleanValue);

    if (!["http:", "https:"].includes(url.protocol)) {
      return "";
    }

    const hostname = url.hostname.toLowerCase();

    if (
      hostname === "wa.me" ||
      hostname.endsWith(".wa.me") ||
      hostname === "whatsapp.com" ||
      hostname.endsWith(".whatsapp.com")
    ) {
      return url.toString();
    }

    return "";
  } catch {
    return "";
  }
}

export function ClassWhatsappLinksManager({
  classes,
}: {
  classes: ClassItem[];
}) {
  const initialLinks = useMemo(() => {
    return Object.fromEntries(
      classes.map((item) => [item.id, item.whatsapp_group_link ?? ""])
    );
  }, [classes]);

  const [links, setLinks] = useState<Record<string, string>>(initialLinks);
  const [savingId, setSavingId] = useState("");
  const [feedback, setFeedback] = useState<Record<string, Feedback>>({});

  const activeClasses = useMemo(() => {
    return classes.filter((item) => item.status !== "Arquivada");
  }, [classes]);

  async function saveLink(classItem: ClassItem) {
    const rawValue = links[classItem.id] ?? "";
    const normalizedLink = rawValue.trim()
      ? normalizeWhatsappLink(rawValue)
      : "";

    if (rawValue.trim() && !normalizedLink) {
      setFeedback((current) => ({
        ...current,
        [classItem.id]: {
          type: "error",
          text: "Informe um link válido do WhatsApp, como https://chat.whatsapp.com/...",
        },
      }));
      return;
    }

    setSavingId(classItem.id);
    setFeedback((current) => {
      const next = { ...current };
      delete next[classItem.id];
      return next;
    });

    const { error } = await supabase
      .from("classes")
      .update({
        whatsapp_group_link: normalizedLink || null,
      })
      .eq("id", classItem.id);

    setSavingId("");

    if (error) {
      setFeedback((current) => ({
        ...current,
        [classItem.id]: {
          type: "error",
          text: error.message,
        },
      }));
      return;
    }

    setLinks((current) => ({
      ...current,
      [classItem.id]: normalizedLink,
    }));

    setFeedback((current) => ({
      ...current,
      [classItem.id]: {
        type: "success",
        text: normalizedLink
          ? "Link do grupo salvo."
          : "Link do grupo removido.",
      },
    }));
  }

  return (
    <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-5">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-emerald-500/15 p-3 text-emerald-300">
          <MessageCircle size={24} />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-white">
            Grupos de WhatsApp das turmas
          </h2>

          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
            Cadastre o link de convite ou abertura do grupo. Ele será usado nos
            aniversários do dashboard e no envio do relatório de frequência.
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {activeClasses.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-400">
            Nenhuma turma ativa cadastrada.
          </div>
        ) : (
          activeClasses.map((classItem) => {
            const currentLink = links[classItem.id] ?? "";
            const itemFeedback = feedback[classItem.id];
            const saving = savingId === classItem.id;
            const validLink = normalizeWhatsappLink(currentLink);

            return (
              <div
                key={classItem.id}
                className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
                  <div className="min-w-0 xl:w-64">
                    <p className="truncate font-bold text-white">
                      {classItem.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Grupo oficial da turma
                    </p>
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
                    <Link2 size={17} className="shrink-0 text-slate-500" />

                    <input
                      value={currentLink}
                      onChange={(event) => {
                        setLinks((current) => ({
                          ...current,
                          [classItem.id]: event.target.value,
                        }));

                        setFeedback((current) => {
                          const next = { ...current };
                          delete next[classItem.id];
                          return next;
                        });
                      }}
                      placeholder="https://chat.whatsapp.com/..."
                      className="h-11 min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-600"
                    />
                  </div>

                  <div className="flex gap-2">
                    {validLink && (
                      <a
                        href={validLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 text-sm font-semibold text-slate-300 transition hover:bg-slate-800"
                      >
                        <ExternalLink size={16} />
                        Testar
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => saveLink(classItem)}
                      disabled={saving}
                      className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Save size={16} />
                      )}
                      Salvar
                    </button>
                  </div>
                </div>

                {itemFeedback && (
                  <div
                    className={`mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                      itemFeedback.type === "success"
                        ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                        : "border-red-500/20 bg-red-500/10 text-red-200"
                    }`}
                  >
                    {itemFeedback.type === "success" ? (
                      <CheckCircle2 size={16} />
                    ) : (
                      <XCircle size={16} />
                    )}
                    {itemFeedback.text}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
