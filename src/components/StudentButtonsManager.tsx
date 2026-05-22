"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle,
  Clock3,
  Link2,
  Search,
  Trash2,
  Upload,
  Users,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_id: string | null;
  class_name: string | null;
};

type ClassItem = {
  id: string;
  name: string;
};

type StudentPortalButton = {
  id: string;
  student_id: string;
  student_name: string;
  button_order: number;
  button_label: string;
  button_url: string;
};

type TemporaryButton = {
  id: string;
  class_id: string;
  class_name: string | null;
  button_label: string;
  button_url: string;
  created_at: string | null;
  updated_at: string | null;
};

type Message = {
  type: "success" | "error";
  text: string;
};

type Props = {
  students: Student[];
  classes: ClassItem[];
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

export function StudentButtonsManager({ students, classes }: Props) {
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [search, setSearch] = useState("");

  const [buttons, setButtons] = useState<StudentPortalButton[]>([]);
  const [temporaryButtons, setTemporaryButtons] = useState<TemporaryButton[]>(
    []
  );

  const [loading, setLoading] = useState(false);
  const [temporaryLoading, setTemporaryLoading] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [message, setMessage] = useState<Message | null>(null);

  const [formButtons, setFormButtons] = useState([
    { label: "", url: "" },
    { label: "", url: "" },
    { label: "", url: "" },
  ]);

  const [temporaryClassId, setTemporaryClassId] = useState("");
  const [temporaryLabel, setTemporaryLabel] = useState("");
  const [temporaryUrl, setTemporaryUrl] = useState("");

  const [bulkText, setBulkText] = useState("");

  const filteredStudents = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return students;
    }

    return students.filter((student) =>
      normalizeText(`
        ${student.name}
        ${student.class_name ?? ""}
      `).includes(normalizedSearch)
    );
  }, [students, search]);

  const selectedStudent = students.find(
    (student) => student.id === selectedStudentId
  );

  const selectedTemporaryClass = classes.find(
    (classItem) => classItem.id === temporaryClassId
  );

  const selectedStudentButtons = selectedStudentId
    ? buttons.filter((button) => button.student_id === selectedStudentId)
    : [];

  async function loadButtons(studentId?: string) {
    const query = supabase
      .from("student_portal_buttons")
      .select("*")
      .order("button_order", { ascending: true });

    const { data, error } = studentId
      ? await query.eq("student_id", studentId)
      : await query;

    if (error) {
      console.error("Erro ao carregar botões:", error.message);
      setButtons([]);
      return;
    }

    const loadedButtons = (data as StudentPortalButton[]) ?? [];

    setButtons(loadedButtons);

    if (studentId) {
      setFormButtons(
        [1, 2, 3].map((order) => {
          const existing = loadedButtons.find(
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

  async function loadTemporaryButtons() {
    const { data, error } = await supabase
      .from("class_temporary_buttons")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar botões temporários:", error.message);
      setTemporaryButtons([]);
      return;
    }

    setTemporaryButtons((data as TemporaryButton[]) ?? []);
  }

  useEffect(() => {
    loadButtons();
    loadTemporaryButtons();

    const buttonsChannel = supabase
      .channel("student_portal_buttons_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_portal_buttons",
        },
        () => loadButtons(selectedStudentId || undefined)
      )
      .subscribe();

    const temporaryButtonsChannel = supabase
      .channel("class_temporary_buttons_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "class_temporary_buttons",
        },
        () => loadTemporaryButtons()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(buttonsChannel);
      supabase.removeChannel(temporaryButtonsChannel);
    };
  }, [selectedStudentId]);

  useEffect(() => {
    if (!temporaryClassId) {
      setTemporaryLabel("");
      setTemporaryUrl("");
      return;
    }

    const existing = temporaryButtons.find(
      (button) => button.class_id === temporaryClassId
    );

    setTemporaryLabel(existing?.button_label ?? "");
    setTemporaryUrl(existing?.button_url ?? "");
  }, [temporaryClassId, temporaryButtons]);

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
        order: index + 1,
        label: button.label.trim(),
        url: ensureUrl(button.url),
      }))
      .filter((button) => button.label && button.url);

    setLoading(true);

    await supabase
      .from("student_portal_buttons")
      .delete()
      .eq("student_id", selectedStudent.id);

    if (validButtons.length > 0) {
      const rows = validButtons.map((button) => ({
        student_id: selectedStudent.id,
        student_name: selectedStudent.name,
        button_order: button.order,
        button_label: button.label,
        button_url: button.url,
      }));

      const { error } = await supabase
        .from("student_portal_buttons")
        .insert(rows);

      setLoading(false);

      if (error) {
        console.error(error);
        setMessage({
          type: "error",
          text: `Erro ao salvar botões: ${error.message}`,
        });
        return;
      }
    } else {
      setLoading(false);
    }

    setMessage({
      type: "success",
      text: "Botões individuais salvos com sucesso!",
    });

    await loadButtons(selectedStudent.id);
  }

  async function handleSaveTemporaryButton() {
    setMessage(null);

    if (!selectedTemporaryClass) {
      setMessage({
        type: "error",
        text: "Selecione uma turma para criar o botão temporário.",
      });
      return;
    }

    if (!temporaryLabel.trim() || !temporaryUrl.trim()) {
      setMessage({
        type: "error",
        text: "Preencha o nome do botão temporário e o link.",
      });
      return;
    }

    setTemporaryLoading(true);

    const { error } = await supabase.from("class_temporary_buttons").upsert(
      {
        class_id: selectedTemporaryClass.id,
        class_name: selectedTemporaryClass.name,
        button_label: temporaryLabel.trim(),
        button_url: ensureUrl(temporaryUrl),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "class_id",
      }
    );

    setTemporaryLoading(false);

    if (error) {
      console.error(error);
      setMessage({
        type: "error",
        text: `Erro ao salvar botão temporário: ${error.message}`,
      });
      return;
    }

    setMessage({
      type: "success",
      text: `Botão temporário salvo para a turma ${selectedTemporaryClass.name}. Ele substituiu o botão temporário anterior dessa turma.`,
    });

    await loadTemporaryButtons();
  }

  async function handleDeleteTemporaryButton(classId: string) {
    const confirmed = window.confirm(
      "Deseja remover o botão temporário desta turma?"
    );

    if (!confirmed) return;

    setTemporaryLoading(true);

    const { error } = await supabase
      .from("class_temporary_buttons")
      .delete()
      .eq("class_id", classId);

    setTemporaryLoading(false);

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao remover botão temporário: ${error.message}`,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Botão temporário removido com sucesso.",
    });

    if (temporaryClassId === classId) {
      setTemporaryClassId("");
      setTemporaryLabel("");
      setTemporaryUrl("");
    }

    await loadTemporaryButtons();
  }

  async function handleBulkImportByClass() {
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

    const dataLines = lines.filter((line) => {
      const normalized = normalizeText(line);
      return !normalized.startsWith("nome") && !normalized.startsWith("aluno");
    });

    const rows: {
      student_id: string;
      student_name: string;
      button_order: number;
      button_label: string;
      button_url: string;
    }[] = [];

    const studentIdsToReplace = new Set<string>();

    for (const line of dataLines) {
      const columns = line.split("\t").map((item) => item.trim());

      const [
        studentName,
        className,
        button1,
        link1,
        button2,
        link2,
        button3,
        link3,
      ] = columns;

      if (!studentName || !className) {
        setMessage({
          type: "error",
          text: `Linha incompleta. Informe nome do aluno e turma: ${line}`,
        });
        return;
      }

      const student = students.find((item) => {
        const sameName = normalizeText(item.name) === normalizeText(studentName);
        const sameClass =
          normalizeText(item.class_name ?? "") === normalizeText(className);

        return sameName && sameClass;
      });

      if (!student) {
        setMessage({
          type: "error",
          text: `Aluno não encontrado com nome e turma informados: ${studentName} - ${className}`,
        });
        return;
      }

      studentIdsToReplace.add(student.id);

      const buttonData = [
        { order: 1, label: button1, url: link1 },
        { order: 2, label: button2, url: link2 },
        { order: 3, label: button3, url: link3 },
      ];

      buttonData.forEach((button) => {
        const label = button.label?.trim() ?? "";
        const url = ensureUrl(button.url ?? "");

        if (label && url) {
          rows.push({
            student_id: student.id,
            student_name: student.name,
            button_order: button.order,
            button_label: label,
            button_url: url,
          });
        }
      });
    }

    if (studentIdsToReplace.size === 0) {
      setMessage({
        type: "error",
        text: "Nenhum aluno válido foi encontrado.",
      });
      return;
    }

    setBulkLoading(true);

    const studentIds = Array.from(studentIdsToReplace);

    const { error: deleteError } = await supabase
      .from("student_portal_buttons")
      .delete()
      .in("student_id", studentIds);

    if (deleteError) {
      setBulkLoading(false);
      setMessage({
        type: "error",
        text: `Erro ao limpar botões antigos: ${deleteError.message}`,
      });
      return;
    }

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("student_portal_buttons")
        .insert(rows);

      setBulkLoading(false);

      if (insertError) {
        console.error(insertError);
        setMessage({
          type: "error",
          text: `Erro ao importar botões: ${insertError.message}`,
        });
        return;
      }
    } else {
      setBulkLoading(false);
    }

    setMessage({
      type: "success",
      text: `${studentIds.length} aluno(s) atualizado(s) e ${rows.length} botão(ões) configurado(s) com sucesso!`,
    });

    setBulkText("");
    await loadButtons(selectedStudentId || undefined);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <h2 className="text-2xl font-bold">Alunos</h2>

        <div className="mt-5 flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4">
          <Search size={20} className="text-slate-400" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar aluno ou turma..."
            className="w-full bg-transparent outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="mt-5 max-h-[620px] space-y-2 overflow-y-auto pr-1">
          {filteredStudents.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-sm text-slate-500">
              Nenhum aluno encontrado.
            </p>
          ) : (
            filteredStudents.map((student) => (
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
            ))
          )}
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
                Selecione um aluno e configure manualmente até três botões fixos
                para o portal.
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
                {loading ? "Salvando..." : "Salvar botões individuais"}
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
                        rel="noopener noreferrer"
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

        <div className="rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-cyan-500/15 p-4 text-cyan-300">
              <Clock3 size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Botão temporário por turma</h2>

              <p className="mt-1 text-slate-300">
                Este botão aparece para todos os alunos da turma junto dos três
                botões individuais. Ao salvar outro para a mesma turma, ele
                substitui o anterior.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <select
              value={temporaryClassId}
              onChange={(event) => setTemporaryClassId(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            >
              <option value="">Selecione a turma</option>

              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>

            <input
              value={temporaryLabel}
              onChange={(event) => setTemporaryLabel(event.target.value)}
              placeholder="Nome do botão temporário"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />

            <input
              value={temporaryUrl}
              onChange={(event) => setTemporaryUrl(event.target.value)}
              placeholder="Link do botão temporário"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-cyan-400"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              onClick={handleSaveTemporaryButton}
              disabled={temporaryLoading}
              className="rounded-2xl bg-cyan-500 px-6 py-3 font-semibold text-white transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {temporaryLoading
                ? "Salvando..."
                : "Salvar/Substituir botão temporário"}
            </button>

            {temporaryClassId &&
              temporaryButtons.some(
                (button) => button.class_id === temporaryClassId
              ) && (
                <button
                  onClick={() => handleDeleteTemporaryButton(temporaryClassId)}
                  disabled={temporaryLoading}
                  className="flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-3 font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Trash2 size={18} />
                  Remover temporário
                </button>
              )}
          </div>

          {temporaryButtons.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold text-cyan-100">
                Botões temporários ativos
              </h3>

              <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {temporaryButtons.map((button) => (
                  <div
                    key={button.id}
                    className="rounded-2xl border border-cyan-500/20 bg-slate-950/50 p-4"
                  >
                    <p className="text-sm text-cyan-300">
                      {button.class_name ?? "Turma"}
                    </p>

                    <p className="mt-2 font-bold text-white">
                      {button.button_label}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-500">
                      {button.button_url}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-emerald-500/15 p-4 text-emerald-300">
              <Upload size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">
                Configuração em massa por turma
              </h2>

              <p className="mt-1 text-slate-400">
                Copie do Excel nesta ordem: Nome do aluno, Turma, Botão 1, Link
                1, Botão 2, Link 2, Botão 3 e Link 3.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            <div className="flex items-start gap-3">
              <Users size={18} className="mt-0.5 shrink-0" />

              <p>
                O sistema identifica cada aluno pelo <strong>nome completo</strong>{" "}
                e pela <strong>turma</strong>. Os três botões antigos desses
                alunos serão substituídos pelos novos dados da planilha.
              </p>
            </div>
          </div>

          <textarea
            value={bulkText}
            onChange={(event) => setBulkText(event.target.value)}
            rows={9}
            placeholder={`Nome do aluno\tTurma\tBotão 1\tLink 1\tBotão 2\tLink 2\tBotão 3\tLink 3`}
            className="mt-6 w-full resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none placeholder:text-slate-500 focus:border-emerald-400"
          />

          <button
            onClick={handleBulkImportByClass}
            disabled={bulkLoading}
            className="mt-5 rounded-2xl bg-emerald-500 px-6 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            {bulkLoading ? "Importando..." : "Importar botões da turma"}
          </button>
        </div>
      </div>
    </div>
  );
}