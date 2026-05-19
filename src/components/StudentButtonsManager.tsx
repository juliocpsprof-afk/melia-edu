"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle, Link2, Search, Upload, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_name: string | null;
};

type StudentPortalButton = {
  id: string;
  student_id: string;
  student_name: string;
  button_order: number;
  button_label: string;
  button_url: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

type Props = {
  students: Student[];
};

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function ensureUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return "";

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

export function StudentButtonsManager({ students }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [search, setSearch] = useState("");
  const [buttons, setButtons] = useState<StudentPortalButton[]>([]);
  const [bulkText, setBulkText] = useState("");
  const [loading, setLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const [formButtons, setFormButtons] = useState([
    { label: "", url: "" },
    { label: "", url: "" },
    { label: "", url: "" },
  ]);

  const filteredStudents = useMemo(() => {
    return students.filter((student) =>
      normalizeText(student.name).includes(normalizeText(search))
    );
  }, [students, search]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  async function loadButtons(studentId?: string) {
    const query = supabase
      .from("student_portal_buttons")
      .select("*")
      .order("button_order", { ascending: true });

    const { data } = studentId
      ? await query.eq("student_id", studentId)
      : await query;

    setButtons((data as StudentPortalButton[]) ?? []);

    if (studentId) {
      const studentButtons = ((data as StudentPortalButton[]) ?? []).filter(
        (button) => button.student_id === studentId
      );

      setFormButtons(
        [1, 2, 3].map((order) => {
          const existing = studentButtons.find(
            (button) => button.button_order === order
          );

          return {
            label: existing?.button_label ?? "",
            url: existing?.button_url ?? "",
          };
        })
      );
    }
  }

  useEffect(() => {
    loadButtons();

    const channel = supabase
      .channel("student_portal_buttons_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_portal_buttons",
        },
        () => loadButtons(selectedStudentId)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedStudentId]);

  async function handleSelectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setMessage(null);
    await loadButtons(studentId);
  }

  function updateFormButton(
    index: number,
    field: "label" | "url",
    value: string
  ) {
    setFormButtons((current) =>
      current.map((button, buttonIndex) =>
        buttonIndex === index ? { ...button, [field]: value } : button
      )
    );
  }

  async function handleSaveButtons() {
    setMessage(null);

    if (!selectedStudent) {
      setMessage({
        type: "error",
        text: "Selecione um aluno antes de salvar.",
      });
      return;
    }

    const validButtons = formButtons
      .map((button, index) => ({
        ...button,
        order: index + 1,
        label: button.label.trim(),
        url: ensureUrl(button.url),
      }))
      .filter((button) => button.label && button.url);

    if (validButtons.length === 0) {
      setMessage({
        type: "error",
        text: "Preencha pelo menos um botão.",
      });
      return;
    }

    setLoading(true);

    await supabase
      .from("student_portal_buttons")
      .delete()
      .eq("student_id", selectedStudent.id);

    const rows = validButtons.map((button) => ({
      student_id: selectedStudent.id,
      student_name: selectedStudent.name,
      button_order: button.order,
      button_label: button.label,
      button_url: button.url,
    }));

    const { error } = await supabase.from("student_portal_buttons").insert(rows);

    setLoading(false);

    if (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Erro ao salvar botões.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Botões salvos com sucesso!",
    });

    await loadButtons(selectedStudent.id);
  }

  async function handleBulkImport() {
    setMessage(null);

    if (!bulkText.trim()) {
      setMessage({
        type: "error",
        text: "Cole os dados da planilha antes de importar.",
      });
      return;
    }

    const lines = bulkText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const dataLines = lines.filter(
      (line) => !normalizeText(line).startsWith("aluno")
    );

    const rows = [];

    for (const line of dataLines) {
      const columns = line.split("\t").map((item) => item.trim());

      const [
        studentName,
        button1,
        link1,
        button2,
        link2,
        button3,
        link3,
      ] = columns;

      if (!studentName) continue;

      const student = students.find(
        (item) => normalizeText(item.name) === normalizeText(studentName)
      );

      if (!student) {
        setMessage({
          type: "error",
          text: `Aluno não encontrado: ${studentName}`,
        });
        return;
      }

      const buttonData = [
        { order: 1, label: button1, url: link1 },
        { order: 2, label: button2, url: link2 },
        { order: 3, label: button3, url: link3 },
      ];

      buttonData.forEach((button) => {
        if (button.label && button.url) {
          rows.push({
            student_id: student.id,
            student_name: student.name,
            button_order: button.order,
            button_label: button.label.trim(),
            button_url: ensureUrl(button.url),
          });
        }
      });
    }

    if (rows.length === 0) {
      setMessage({
        type: "error",
        text: "Nenhum botão válido foi encontrado.",
      });
      return;
    }

    setBulkLoading(true);

    const studentIds = Array.from(new Set(rows.map((row) => row.student_id)));

    await supabase
      .from("student_portal_buttons")
      .delete()
      .in("student_id", studentIds);

    const { error } = await supabase.from("student_portal_buttons").insert(rows);

    setBulkLoading(false);

    if (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: "Erro ao importar botões.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: `${rows.length} botão(ões) configurado(s) com sucesso!`,
    });

    setBulkText("");
    await loadButtons(selectedStudentId || undefined);
  }

  const selectedStudentButtons = selectedStudentId
    ? buttons.filter((button) => button.student_id === selectedStudentId)
    : [];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Alunos</h2>

        <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4">
          <Search size={20} className="text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno..."
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="mt-5 max-h-[620px] space-y-2 overflow-y-auto pr-1">
          {filteredStudents.map((student) => (
            <button
              key={student.id}
              onClick={() => handleSelectStudent(student.id)}
              className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                selectedStudentId === student.id
                  ? "border-violet-500 bg-violet-500/10"
                  : "border-slate-800 bg-slate-950/40 hover:bg-white/[0.03]"
              }`}
            >
              <p className="font-semibold">{student.name}</p>
              <p className="mt-1 text-xs text-slate-500">
                {student.class_name ?? "Sem turma"}
              </p>
            </button>
          ))}
        </div>
      </aside>

      <div className="space-y-6">
        {message && (
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/30 bg-red-500/10 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle size={20} />
            ) : (
              <XCircle size={20} />
            )}

            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-violet-500/15 p-4 text-violet-400">
              <Link2 size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Configuração individual</h2>
              <p className="mt-1 text-slate-400">
                Selecione um aluno e configure até três botões para o portal.
              </p>
            </div>
          </div>

          {!selectedStudent ? (
            <p className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-slate-400">
              Selecione um aluno na lista ao lado.
            </p>
          ) : (
            <>
              <div className="mt-6 rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
                <p className="font-semibold text-violet-200">
                  {selectedStudent.name}
                </p>
                <p className="text-sm text-slate-400">
                  {selectedStudent.class_name ?? "Sem turma"}
                </p>
              </div>

              <div className="mt-6 space-y-4">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:grid-cols-[1fr_1.5fr]"
                  >
                    <input
                      value={formButtons[index].label}
                      onChange={(event) =>
                        updateFormButton(index, "label", event.target.value)
                      }
                      placeholder={`Nome do botão ${index + 1}`}
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    />

                    <input
                      value={formButtons[index].url}
                      onChange={(event) =>
                        updateFormButton(index, "url", event.target.value)
                      }
                      placeholder={`Link do botão ${index + 1}`}
                      className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={handleSaveButtons}
                disabled={loading}
                className="mt-6 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
              >
                {loading ? "Salvando..." : "Salvar botões"}
              </button>

              {selectedStudentButtons.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold">Botões atuais</h3>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {selectedStudentButtons.map((button) => (
                      <a
                        key={button.id}
                        href={button.button_url}
                        target="_blank"
                        className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-violet-500"
                      >
                        <p className="font-semibold text-violet-300">
                          {button.button_label}
                        </p>
                        <p className="mt-2 truncate text-xs text-slate-500">
                          {button.button_url}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-violet-500/15 p-4 text-violet-400">
              <Upload size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Configuração em massa</h2>
              <p className="mt-1 text-slate-400">
                Copie do Excel: Aluno, Botão 1, Link 1, Botão 2, Link 2, Botão
                3 e Link 3.
              </p>
            </div>
          </div>

          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={8}
            placeholder={`Aluno\tBotão 1\tLink 1\tBotão 2\tLink 2\tBotão 3\tLink 3`}
            className="mt-6 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-violet-400"
          />

          <button
            onClick={handleBulkImport}
            disabled={bulkLoading}
            className="mt-5 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
          >
            {bulkLoading ? "Importando..." : "Importar botões"}
          </button>
        </div>
      </div>
    </div>
  );
}