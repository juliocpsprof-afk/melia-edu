"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Shuffle, Users, UserRound } from "lucide-react";
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
  team_size: number | null;
  created_at: string;
};

type Props = {
  classes: ClassItem[];
  students: Student[];
};

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export function InteractionDrawTool({ classes, students }: Props) {
  const [drawType, setDrawType] = useState<"student" | "teams">("student");
  const [classId, setClassId] = useState("all");
  const [teamSize, setTeamSize] = useState("2");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [teams, setTeams] = useState<Student[][]>([]);
  const [history, setHistory] = useState<DrawHistory[]>([]);
  const [historyResults, setHistoryResults] = useState<
    Record<string, DrawResult[]>
  >({});
  const [loading, setLoading] = useState(false);

  const filteredStudents = useMemo(() => {
    if (classId === "all") {
      return students;
    }

    return students.filter((student) => student.class_id === classId);
  }, [students, classId]);

  const selectedClass = classes.find((item) => item.id === classId);

  async function loadHistory() {
    const { data: draws } = await supabase
      .from("interaction_draws")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    const drawList = (draws as DrawHistory[]) ?? [];

    setHistory(drawList);

    if (drawList.length === 0) {
      setHistoryResults({});
      return;
    }

    const drawIds = drawList.map((draw) => draw.id);

    const { data: results } = await supabase
      .from("interaction_draw_results")
      .select("*")
      .in("draw_id", drawIds)
      .order("team_number", { ascending: true })
      .order("student_name", { ascending: true });

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

  async function saveDrawResult({
    type,
    selected,
    generatedTeams,
  }: {
    type: "student" | "teams";
    selected?: Student;
    generatedTeams?: Student[][];
  }) {
    const { data: draw, error: drawError } = await supabase
      .from("interaction_draws")
      .insert({
        draw_type: type,
        class_id: classId === "all" ? null : classId,
        class_name: classId === "all" ? "Todas as turmas" : selectedClass?.name,
        team_size: type === "teams" ? Number(teamSize) : null,
      })
      .select("id")
      .single();

    if (drawError || !draw) {
      console.error(drawError);
      return;
    }

    if (type === "student" && selected) {
      await supabase.from("interaction_draw_results").insert({
        draw_id: draw.id,
        student_id: selected.id,
        student_name: selected.name,
        class_id: selected.class_id,
        class_name: selected.class_name,
        team_number: null,
      });
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

      await supabase.from("interaction_draw_results").insert(rows);
    }

    await loadHistory();
  }

  async function handleDraw() {
    if (filteredStudents.length === 0) {
      alert("Não há alunos disponíveis para este filtro.");
      return;
    }

    setLoading(true);

    const shuffled = shuffleArray(filteredStudents);

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

      if (!size || size < 2) {
        alert("Escolha um tamanho de equipe válido.");
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
      });
    }

    setLoading(false);
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
                Escolha o tipo de sorteio, filtre por turma e gere o resultado.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <select
              value={drawType}
              onChange={(event) =>
                setDrawType(event.target.value as "student" | "teams")
              }
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
              <select
                value={teamSize}
                onChange={(event) => setTeamSize(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400 md:col-span-2"
              >
                <option value="2">Duplas</option>
                <option value="3">Trios</option>
                <option value="4">Equipes de 4</option>
                <option value="5">Equipes de 5</option>
                <option value="6">Equipes de 6</option>
              </select>
            )}
          </div>

          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-slate-300">
            Alunos disponíveis para este sorteio:{" "}
            <strong>{filteredStudents.length}</strong>
          </div>

          <button
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

        <div className="mt-6 space-y-4">
          {history.length === 0 ? (
            <p className="text-slate-400">Nenhum sorteio registrado.</p>
          ) : (
            history.map((draw) => {
              const results = historyResults[draw.id] ?? [];

              return (
                <div
                  key={draw.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-violet-500/15 p-3 text-violet-400">
                      {draw.draw_type === "student" ? (
                        <UserRound size={20} />
                      ) : (
                        <Users size={20} />
                      )}
                    </div>

                    <div>
                      <h3 className="font-semibold">
                        {draw.draw_type === "student"
                          ? "Sorteio de aluno"
                          : `Equipes de ${draw.team_size}`}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {draw.class_name ?? "Todas as turmas"} •{" "}
                        {new Date(draw.created_at).toLocaleString("pt-BR")}
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
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
}


