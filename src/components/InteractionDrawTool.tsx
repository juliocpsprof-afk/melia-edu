"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  CheckCircle,
  CheckSquare,
  History,
  ListChecks,
  RefreshCw,
  Search,
  Shuffle,
  Square,
  Trash2,
  Users,
  UserRound,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  class_id: string | null;
  class_name: string | null;
};

type Activity = {
  id: string;
  title: string;
  class_id: string | null;
  due_date: string | null;
  archived: boolean | null;
};

type DrawResult = {
  id: string;
  draw_id: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  team_number: number | null;
  created_at: string;
};

type DrawHistory = {
  id: string;
  draw_type: "student" | "teams";
  class_id: string | null;
  class_name: string | null;
  activity_id: string | null;
  activity_title: string | null;
  team_size: number | null;
  status: "active" | "archived" | string | null;
  archived_at: string | null;
  created_at: string;
};

type Message = {
  type: "success" | "error";
  text: string;
};

type Props = {
  classes: ClassItem[];
  students: Student[];
  activities: Activity[];
};

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function formatDateTime(value: string | null) {
  if (!value) return "Data não informada";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return date.toLocaleString("pt-BR");
}

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(`${value}`.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("pt-BR");
}

function getStatusLabel(status: string | null) {
  return status === "archived" ? "Arquivado" : "Ativo";
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getTeamSizeLabel(size: string) {
  const numericSize = Number(size);

  if (numericSize === 2) return "Duplas";
  if (numericSize === 3) return "Trios";
  if (numericSize > 3) return `Equipes de ${numericSize}`;

  return "Equipes";
}

export function InteractionDrawTool({ classes, students, activities }: Props) {
  const [drawType, setDrawType] = useState<"student" | "teams">("student");
  const [classId, setClassId] = useState("all");
  const [teamSize, setTeamSize] = useState("2");
  const [activityId, setActivityId] = useState("none");

  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [studentSearch, setStudentSearch] = useState("");

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [teams, setTeams] = useState<Student[][]>([]);

  const [history, setHistory] = useState<DrawHistory[]>([]);
  const [historyResults, setHistoryResults] = useState<
    Record<string, DrawResult[]>
  >({});

  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState<Message | null>(null);

  const filteredStudents = useMemo(() => {
    if (classId === "all") {
      return students;
    }

    return students.filter((student) => student.class_id === classId);
  }, [students, classId]);

  const selectedStudentIdSet = useMemo(() => {
    return new Set(selectedStudentIds);
  }, [selectedStudentIds]);

  const participatingStudents = useMemo(() => {
    return filteredStudents.filter((student) =>
      selectedStudentIdSet.has(student.id)
    );
  }, [filteredStudents, selectedStudentIdSet]);

  const visibleStudents = useMemo(() => {
    const search = normalizeText(studentSearch);

    if (!search) {
      return filteredStudents;
    }

    return filteredStudents.filter((student) => {
      const searchableText = [student.name, student.class_name ?? ""].join(" ");

      return normalizeText(searchableText).includes(search);
    });
  }, [filteredStudents, studentSearch]);

  const selectedClass = classes.find((item) => item.id === classId);

  const availableActivities = useMemo(() => {
    const activeActivities = activities.filter((activity) => !activity.archived);

    if (classId === "all") {
      return activeActivities;
    }

    return activeActivities.filter((activity) => activity.class_id === classId);
  }, [activities, classId]);

  const selectedActivity = availableActivities.find(
    (activity) => activity.id === activityId
  );

  async function loadHistory() {
    const { data: draws, error: drawsError } = await supabase
      .from("interaction_draws")
      .select(
        "id, draw_type, class_id, class_name, activity_id, activity_title, team_size, status, archived_at, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(30);

    if (drawsError) {
      console.error(drawsError);
      setHistory([]);
      setHistoryResults({});
      return;
    }

    const drawList = (draws as DrawHistory[]) ?? [];

    setHistory(drawList);

    if (drawList.length === 0) {
      setHistoryResults({});
      return;
    }

    const drawIds = drawList.map((draw) => draw.id);

    const { data: results, error: resultsError } = await supabase
      .from("interaction_draw_results")
      .select("*")
      .in("draw_id", drawIds)
      .order("team_number", { ascending: true })
      .order("student_name", { ascending: true });

    if (resultsError) {
      console.error(resultsError);
      setHistoryResults({});
      return;
    }

    const grouped: Record<string, DrawResult[]> = {};

    ((results as DrawResult[]) ?? []).forEach((result) => {
      if (!grouped[result.draw_id]) {
        grouped[result.draw_id] = [];
      }

      grouped[result.draw_id].push(result);
    });

    setHistoryResults(grouped);
  }

  useEffect(() => {
    loadHistory();

    const channel = supabase
      .channel("interaction_draws_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interaction_draws",
        },
        () => loadHistory()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "interaction_draw_results",
        },
        () => loadHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    setActivityId("none");
  }, [classId]);

  useEffect(() => {
    setSelectedStudentIds(filteredStudents.map((student) => student.id));
    setStudentSearch("");
    setSelectedStudent(null);
    setTeams([]);
    setMessage(null);
  }, [filteredStudents]);

  function markAllStudents() {
    setSelectedStudentIds(filteredStudents.map((student) => student.id));
  }

  function unmarkAllStudents() {
    setSelectedStudentIds([]);
  }

  function toggleStudent(studentId: string) {
    setSelectedStudentIds((current) => {
      if (current.includes(studentId)) {
        return current.filter((id) => id !== studentId);
      }

      return [...current, studentId];
    });
  }

  async function saveDrawResult({
    type,
    selected,
    generatedTeams,
    teamSizeNumber,
  }: {
    type: "student" | "teams";
    selected?: Student;
    generatedTeams?: Student[][];
    teamSizeNumber?: number;
  }) {
    const { data: draw, error: drawError } = await supabase
      .from("interaction_draws")
      .insert({
        draw_type: type,
        class_id: classId === "all" ? null : classId,
        class_name: classId === "all" ? "Todas as turmas" : selectedClass?.name,
        activity_id: selectedActivity?.id || null,
        activity_title: selectedActivity?.title || null,
        team_size: type === "teams" ? teamSizeNumber ?? Number(teamSize) : null,
        status: "active",
        archived_at: null,
      })
      .select("id")
      .single();

    if (drawError || !draw) {
      throw drawError || new Error("Não foi possível salvar o sorteio.");
    }

    if (type === "student" && selected) {
      const { error } = await supabase.from("interaction_draw_results").insert({
        draw_id: draw.id,
        student_id: selected.id,
        student_name: selected.name,
        class_id: selected.class_id,
        class_name: selected.class_name,
        team_number: null,
      });

      if (error) throw error;
    }

    if (type === "teams" && generatedTeams) {
      const rows = generatedTeams.flatMap((team, teamIndex) =>
        team.map((student) => ({
          draw_id: draw.id,
          student_id: student.id,
          student_name: student.name,
          class_id: student.class_id,
          class_name: student.class_name,
          team_number: teamIndex + 1,
        }))
      );

      const { error } = await supabase
        .from("interaction_draw_results")
        .insert(rows);

      if (error) throw error;
    }

    await loadHistory();
  }

  async function handleDraw() {
    setMessage(null);

    if (filteredStudents.length === 0) {
      setMessage({
        type: "error",
        text: "Não há alunos disponíveis para este filtro.",
      });
      return;
    }

    if (participatingStudents.length === 0) {
      setMessage({
        type: "error",
        text: "Marque pelo menos um aluno para participar do sorteio.",
      });
      return;
    }

    setLoading(true);

    try {
      const shuffled = shuffleArray(participatingStudents);

      if (drawType === "student") {
        const student = shuffled[0];

        setSelectedStudent(student);
        setTeams([]);

        await saveDrawResult({
          type: "student",
          selected: student,
        });
      }

      if (drawType === "teams") {
        const size = Number(teamSize);

        if (!Number.isInteger(size) || size < 2) {
          setMessage({
            type: "error",
            text: "Digite um tamanho de equipe válido. Use 2 ou mais.",
          });
          setLoading(false);
          return;
        }

        if (participatingStudents.length < 2) {
          setMessage({
            type: "error",
            text: "Para sortear equipes, marque pelo menos 2 alunos.",
          });
          setLoading(false);
          return;
        }

        const generatedTeams: Student[][] = [];

        for (let index = 0; index < shuffled.length; index += size) {
          generatedTeams.push(shuffled.slice(index, index + size));
        }

        setSelectedStudent(null);
        setTeams(generatedTeams);

        await saveDrawResult({
          type: "teams",
          generatedTeams,
          teamSizeNumber: size,
        });
      }

      setMessage({
        type: "success",
        text: selectedActivity
          ? `Sorteio realizado com ${participatingStudents.length} participante(s) e vinculado à atividade: ${selectedActivity.title}.`
          : `Sorteio realizado com ${participatingStudents.length} participante(s), sem atividade vinculada.`,
      });
    } catch (error) {
      const errorMessage =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message)
          : "Erro ao realizar sorteio.";

      setMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleArchiveDraw(drawId: string) {
    const confirmed = window.confirm(
      "Arquivar este sorteio? Ele continuará no histórico do professor, mas sairá do painel do aluno."
    );

    if (!confirmed) return;

    setActionLoadingId(drawId);
    setMessage(null);

    const { error } = await supabase
      .from("interaction_draws")
      .update({
        status: "archived",
        archived_at: new Date().toISOString(),
      })
      .eq("id", drawId);

    setActionLoadingId("");

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao arquivar sorteio: ${error.message}`,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Sorteio arquivado com sucesso.",
    });

    await loadHistory();
  }

  async function handleDeleteDraw(drawId: string) {
    const confirmed = window.confirm(
      "Excluir este sorteio definitivamente? Ele será removido do professor e também do painel do aluno."
    );

    if (!confirmed) return;

    setActionLoadingId(drawId);
    setMessage(null);

    const { error: resultsError } = await supabase
      .from("interaction_draw_results")
      .delete()
      .eq("draw_id", drawId);

    if (resultsError) {
      setActionLoadingId("");
      setMessage({
        type: "error",
        text: `Erro ao excluir resultados: ${resultsError.message}`,
      });
      return;
    }

    const { error: drawError } = await supabase
      .from("interaction_draws")
      .delete()
      .eq("id", drawId);

    setActionLoadingId("");

    if (drawError) {
      setMessage({
        type: "error",
        text: `Erro ao excluir sorteio: ${drawError.message}`,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Sorteio excluído com sucesso.",
    });

    await loadHistory();
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-violet-500/15 p-4 text-violet-400">
              <Shuffle size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Ferramenta de sorteio</h2>
              <p className="mt-1 text-slate-400">
                Escolha o tipo de sorteio, filtre por turma, marque quem vai
                participar e vincule a uma atividade quando necessário.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`mt-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
                message.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-red-500/30 bg-red-500/10 text-red-300"
              }`}
            >
              {message.type === "success" ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}

              {message.text}
            </div>
          )}

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <select
              value={drawType}
              onChange={(event) => {
                setDrawType(event.target.value as "student" | "teams");
                setSelectedStudent(null);
                setTeams([]);
                setMessage(null);
              }}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            >
              <option value="student">Sortear um aluno</option>
              <option value="teams">Sortear equipes</option>
            </select>

            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            >
              <option value="all">Todas as turmas</option>

              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>

            {drawType === "teams" && (
              <div className="rounded-3xl border border-slate-800 bg-slate-950/40 p-4 md:col-span-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm font-semibold text-slate-300">
                      Quantidade de alunos por equipe
                    </label>

                    <input
                      type="number"
                      min={2}
                      step={1}
                      value={teamSize}
                      onChange={(event) => setTeamSize(event.target.value)}
                      placeholder="Ex.: 2, 3, 4, 5, 10..."
                      className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Dupla", value: "2" },
                      { label: "Trio", value: "3" },
                      { label: "4", value: "4" },
                      { label: "6", value: "6" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTeamSize(option.value)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-bold transition ${
                          teamSize === option.value
                            ? "border-violet-400 bg-violet-500 text-white"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-500">
                  Você pode digitar qualquer tamanho de equipe. Se sobrarem
                  alunos, a última equipe ficará com menos participantes.
                </p>
              </div>
            )}

            <select
              value={activityId}
              onChange={(event) => setActivityId(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
            >
              <option value="none">Sem atividade vinculada</option>

              {availableActivities.map((activity) => (
                <option key={activity.id} value={activity.id}>
                  {activity.title}
                  {activity.due_date ? ` • ${formatDate(activity.due_date)}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-950/40 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                    <ListChecks size={22} />
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-white">
                      Alunos participantes
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      Todos aparecem marcados por padrão. Desmarque quem não
                      deve participar do sorteio.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  type="button"
                  onClick={markAllStudents}
                  disabled={filteredStudents.length === 0}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  <CheckSquare size={16} />
                  Marcar todos
                </button>

                <button
                  type="button"
                  onClick={unmarkAllStudents}
                  disabled={filteredStudents.length === 0}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  <Square size={16} />
                  Desmarcar
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300">
                Alunos da seleção:{" "}
                <strong className="text-white">{filteredStudents.length}</strong>
              </div>

              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
                Participando:{" "}
                <strong className="text-white">
                  {participatingStudents.length}
                </strong>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 text-slate-300">
                Atividade:{" "}
                <strong className="text-white">
                  {selectedActivity ? selectedActivity.title : "Sem vínculo"}
                </strong>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
              <Search size={18} className="text-slate-500" />

              <input
                value={studentSearch}
                onChange={(event) => setStudentSearch(event.target.value)}
                placeholder="Pesquisar aluno..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>

            {filteredStudents.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-sm text-yellow-100">
                Nenhum aluno encontrado para esta seleção.
              </div>
            ) : (
              <div className="mt-4 max-h-80 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/40 p-2">
                <div className="grid gap-2 md:grid-cols-2">
                  {visibleStudents.map((student) => {
                    const checked = selectedStudentIdSet.has(student.id);

                    return (
                      <button
                        key={student.id}
                        type="button"
                        onClick={() => toggleStudent(student.id)}
                        className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                          checked
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-100"
                            : "border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-800"
                        }`}
                      >
                        <div
                          className={`shrink-0 ${
                            checked ? "text-emerald-300" : "text-slate-500"
                          }`}
                        >
                          {checked ? (
                            <CheckSquare size={20} />
                          ) : (
                            <Square size={20} />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate font-semibold">
                            {student.name}
                          </p>

                          <p className="truncate text-xs opacity-70">
                            {student.class_name ?? "Sem turma"}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {visibleStudents.length === 0 && (
                  <p className="p-4 text-sm text-slate-500">
                    Nenhum aluno encontrado na pesquisa.
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleDraw}
            disabled={loading}
            className="mt-6 flex items-center gap-3 rounded-2xl bg-violet-500 px-6 py-3 font-semibold transition hover:bg-violet-400 disabled:opacity-50"
          >
            <Shuffle size={20} />
            {loading ? "Sorteando..." : "Realizar sorteio"}
          </button>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold">Resultado atual</h2>

          {!selectedStudent && teams.length === 0 ? (
            <p className="mt-4 text-slate-400">
              Nenhum sorteio realizado nesta sessão.
            </p>
          ) : selectedStudent ? (
            <div className="mt-6 rounded-3xl border border-violet-500/30 bg-violet-500/10 p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-500 text-3xl font-bold">
                {selectedStudent.name.charAt(0)}
              </div>

              <h3 className="mt-5 text-3xl font-bold">
                {selectedStudent.name}
              </h3>

              <p className="mt-2 text-slate-300">
                {selectedStudent.class_name ?? "Sem turma"}
              </p>

              <p className="mt-3 rounded-2xl bg-slate-950/40 px-4 py-3 text-sm text-slate-300">
                Atividade:{" "}
                <strong>{selectedActivity?.title || "Sem vínculo"}</strong>
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {teams.map((team, index) => (
                <div
                  key={index}
                  className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
                >
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-violet-300">
                    <Users size={20} />
                    Equipe {index + 1}
                  </h3>

                  <div className="mb-4 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-300">
                    Atividade:{" "}
                    <strong>{selectedActivity?.title || "Sem vínculo"}</strong>
                  </div>

                  <div className="space-y-3">
                    {team.map((student) => (
                      <div
                        key={student.id}
                        className="flex items-center gap-3 rounded-2xl bg-slate-900 px-4 py-3"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 font-bold">
                          {student.name.charAt(0)}
                        </div>

                        <div>
                          <p className="font-semibold">{student.name}</p>
                          <p className="text-xs text-slate-500">
                            {student.class_name ?? "Sem turma"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <History size={24} className="text-violet-400" />
          <h2 className="text-2xl font-bold">Histórico</h2>
        </div>

        <p className="mt-2 text-sm text-slate-400">
          Sorteios ativos aparecem para os alunos. Sorteios arquivados ficam
          apenas aqui no professor.
        </p>

        <div className="mt-6 space-y-4">
          {history.length === 0 ? (
            <p className="text-slate-400">Nenhum sorteio registrado.</p>
          ) : (
            history.map((draw) => {
              const results = historyResults[draw.id] ?? [];
              const isArchived = draw.status === "archived";

              return (
                <div
                  key={draw.id}
                  className={`rounded-2xl border p-4 ${
                    isArchived
                      ? "border-slate-800 bg-slate-950/30 opacity-75"
                      : "border-slate-800 bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
                      {draw.draw_type === "student" ? (
                        <UserRound size={20} />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold">
                          {draw.draw_type === "student"
                            ? "Sorteio de aluno"
                            : getTeamSizeLabel(String(draw.team_size ?? ""))}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            isArchived
                              ? "bg-slate-700 text-slate-300"
                              : "bg-emerald-500/10 text-emerald-300"
                          }`}
                        >
                          {getStatusLabel(draw.status)}
                        </span>
                      </div>

                      <p className="mt-1 text-xs text-slate-500">
                        {draw.class_name ?? "Todas as turmas"} •{" "}
                        {formatDateTime(draw.created_at)}
                      </p>

                      <p className="mt-2 rounded-xl bg-slate-900 px-3 py-2 text-xs text-slate-300">
                        Atividade:{" "}
                        <strong>{draw.activity_title || "Sem vínculo"}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-slate-300">
                    {draw.draw_type === "student" ? (
                      <p>{results[0]?.student_name ?? "Sem resultado"}</p>
                    ) : (
                      Object.entries(
                        results.reduce<Record<string, DrawResult[]>>(
                          (acc, result) => {
                            const key = String(result.team_number ?? 0);

                            if (!acc[key]) {
                              acc[key] = [];
                            }

                            acc[key].push(result);

                            return acc;
                          },
                          {}
                        )
                      ).map(([teamNumber, teamResults]) => (
                        <div key={teamNumber}>
                          <strong className="text-violet-300">
                            Equipe {teamNumber}:
                          </strong>{" "}
                          {teamResults
                            .map((result) => result.student_name)
                            .join(", ")}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleArchiveDraw(draw.id)}
                      disabled={isArchived || actionLoadingId === draw.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3 py-2 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {actionLoadingId === draw.id ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Archive size={15} />
                      )}
                      {isArchived ? "Arquivado" : "Arquivar"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDraw(draw.id)}
                      disabled={actionLoadingId === draw.id}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      {actionLoadingId === draw.id ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Trash2 size={15} />
                      )}
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}