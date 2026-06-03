"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Gamepad2,
  Loader2,
  Play,
  Plus,
  RefreshCw,
  Rocket,
  Save,
  Search,
  Sparkles,
  Trash2,
  Trophy,
  Users,
  XCircle,
} from "lucide-react";

import { supabase } from "../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type QuizMode = "assignment" | "live";
type QuizTheme = "neon" | "arcade" | "energy" | "classic";

type ParsedQuestion = {
  questionText: string;
  options: {
    id: string;
    text: string;
  }[];
  correctOptionId: string;
};

type Quiz = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  mode: QuizMode | string | null;
  theme: QuizTheme | string | null;
  status: string | null;
  total_questions: number | null;
  grade_weight: number | null;
  time_per_question: number | null;
  current_question_order: number | null;
  created_at: string | null;
  archived_at: string | null;
};

type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_order: number;
  question_text: string;
  options: {
    id: string;
    text: string;
  }[];
  correct_option_id: string;
};

type QuizParticipant = {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name: string;
  nickname: string | null;
  emoji: string | null;
};

type QuizAnswer = {
  id: string;
  quiz_id: string;
  student_id: string;
  selected_option_id: string;
  is_correct: boolean;
  points: number | null;
};

type RankingItem = {
  student_id: string;
  student_name: string;
  nickname: string;
  emoji: string;
  correctAnswers: number;
  points: number;
};

type Message = {
  type: "success" | "error";
  text: string;
};

const quizThemes = [
  { value: "neon", label: "Neon" },
  { value: "arcade", label: "Arcade" },
  { value: "energy", label: "Energia" },
  { value: "classic", label: "Clássico" },
];

const timeOptions = [
  { value: 30, label: "30 segundos" },
  { value: 45, label: "45 segundos" },
  { value: 60, label: "1 minuto" },
  { value: 90, label: "1min30" },
];

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getStatusLabel(status: string | null) {
  if (status === "waiting") return "Sala aberta";
  if (status === "live") return "Ao vivo";
  if (status === "finished") return "Finalizado";
  if (status === "archived") return "Arquivado";
  if (status === "active") return "Ativo";
  return "Rascunho";
}

function getModeLabel(mode: string | null) {
  return mode === "live" ? "Sala de aula" : "Atividade";
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function parseQuizText(rawText: string): ParsedQuestion[] {
  const lines = rawText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const parsedQuestions: ParsedQuestion[] = [];

  for (let index = 0; index + 4 < lines.length; index += 5) {
    const questionText = lines[index];
    const correctAnswer = lines[index + 1];
    const wrongAnswer1 = lines[index + 2];
    const wrongAnswer2 = lines[index + 3];
    const wrongAnswer3 = lines[index + 4];

    if (
      !questionText ||
      !correctAnswer ||
      !wrongAnswer1 ||
      !wrongAnswer2 ||
      !wrongAnswer3
    ) {
      continue;
    }

    const baseOptions = [
      {
        id: `q${parsedQuestions.length + 1}_a`,
        text: correctAnswer,
        isCorrect: true,
      },
      {
        id: `q${parsedQuestions.length + 1}_b`,
        text: wrongAnswer1,
        isCorrect: false,
      },
      {
        id: `q${parsedQuestions.length + 1}_c`,
        text: wrongAnswer2,
        isCorrect: false,
      },
      {
        id: `q${parsedQuestions.length + 1}_d`,
        text: wrongAnswer3,
        isCorrect: false,
      },
    ];

    const shuffledOptions = shuffleArray(baseOptions);

    const correctOption = shuffledOptions.find((option) => option.isCorrect);

    parsedQuestions.push({
      questionText,
      options: shuffledOptions.map((option) => ({
        id: option.id,
        text: option.text,
      })),
      correctOptionId: correctOption?.id ?? baseOptions[0].id,
    });
  }

  return parsedQuestions;
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Não foi possível concluir a operação.";
}

export function QuizManager({ classes }: { classes: ClassItem[] }) {
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<QuizMode>("assignment");
  const [theme, setTheme] = useState<QuizTheme>("neon");
  const [timePerQuestion, setTimePerQuestion] = useState("45");
  const [gradeWeight, setGradeWeight] = useState("10");
  const [rawQuestions, setRawQuestions] = useState("");

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionsByQuiz, setQuestionsByQuiz] = useState<
    Record<string, QuizQuestion[]>
  >({});
  const [participantsByQuiz, setParticipantsByQuiz] = useState<
    Record<string, QuizParticipant[]>
  >({});
  const [answersByQuiz, setAnswersByQuiz] = useState<
    Record<string, QuizAnswer[]>
  >({});

  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState<Message | null>(null);

  const parsedQuestions = useMemo(() => {
    return parseQuizText(rawQuestions);
  }, [rawQuestions]);

  const filteredQuizzes = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    if (!normalizedSearch) {
      return quizzes;
    }

    return quizzes.filter((quiz) => {
      const className =
        classes.find((classItem) => classItem.id === quiz.class_id)?.name ?? "";

      return normalizeText(
        `${quiz.title} ${quiz.description ?? ""} ${className} ${quiz.status}`
      ).includes(normalizedSearch);
    });
  }, [quizzes, search, classes]);

  async function loadQuizzes() {
    const { data, error } = await supabase
      .from("quizzes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setQuizzes([]);
      return;
    }

    const loadedQuizzes = (data as Quiz[] | null) ?? [];

    setQuizzes(loadedQuizzes);

    const quizIds = loadedQuizzes.map((quiz) => quiz.id);

    if (quizIds.length === 0) {
      setQuestionsByQuiz({});
      setParticipantsByQuiz({});
      setAnswersByQuiz({});
      return;
    }

    const [questionsResponse, participantsResponse, answersResponse] =
      await Promise.all([
        supabase
          .from("quiz_questions")
          .select("*")
          .in("quiz_id", quizIds)
          .order("question_order", { ascending: true }),

        supabase
          .from("quiz_participants")
          .select("*")
          .in("quiz_id", quizIds)
          .order("joined_at", { ascending: true }),

        supabase.from("quiz_answers").select("*").in("quiz_id", quizIds),
      ]);

    if (!questionsResponse.error) {
      const groupedQuestions: Record<string, QuizQuestion[]> = {};

      ((questionsResponse.data as QuizQuestion[] | null) ?? []).forEach(
        (question) => {
          if (!groupedQuestions[question.quiz_id]) {
            groupedQuestions[question.quiz_id] = [];
          }

          groupedQuestions[question.quiz_id].push(question);
        }
      );

      setQuestionsByQuiz(groupedQuestions);
    }

    if (!participantsResponse.error) {
      const groupedParticipants: Record<string, QuizParticipant[]> = {};

      ((participantsResponse.data as QuizParticipant[] | null) ?? []).forEach(
        (participant) => {
          if (!groupedParticipants[participant.quiz_id]) {
            groupedParticipants[participant.quiz_id] = [];
          }

          groupedParticipants[participant.quiz_id].push(participant);
        }
      );

      setParticipantsByQuiz(groupedParticipants);
    }

    if (!answersResponse.error) {
      const groupedAnswers: Record<string, QuizAnswer[]> = {};

      ((answersResponse.data as QuizAnswer[] | null) ?? []).forEach(
        (answer) => {
          if (!groupedAnswers[answer.quiz_id]) {
            groupedAnswers[answer.quiz_id] = [];
          }

          groupedAnswers[answer.quiz_id].push(answer);
        }
      );

      setAnswersByQuiz(groupedAnswers);
    }
  }

  useEffect(() => {
    loadQuizzes();

    const channel = supabase
      .channel("quiz_manager_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quizzes",
        },
        () => loadQuizzes()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_participants",
        },
        () => loadQuizzes()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_answers",
        },
        () => loadQuizzes()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function handleCreateQuiz() {
    setMessage(null);

    if (!classId || !title.trim()) {
      setMessage({
        type: "error",
        text: "Selecione a turma e informe o título do quiz.",
      });

      return;
    }

    if (parsedQuestions.length === 0) {
      setMessage({
        type: "error",
        text: "Cole perguntas no padrão: pergunta + 4 alternativas. A primeira alternativa deve ser a correta.",
      });

      return;
    }

    const numericTime = Number(timePerQuestion);
    const numericWeight = Number(gradeWeight);

    if (!Number.isFinite(numericTime) || numericTime < 10) {
      setMessage({
        type: "error",
        text: "Informe um tempo válido por pergunta.",
      });

      return;
    }

    if (!Number.isFinite(numericWeight) || numericWeight <= 0) {
      setMessage({
        type: "error",
        text: "Informe um peso válido para a nota.",
      });

      return;
    }

    setCreating(true);

    try {
      const { data: createdQuiz, error: quizError } = await supabase
        .from("quizzes")
        .insert({
          class_id: classId,
          title: title.trim(),
          description: description.trim() || null,
          mode,
          theme,
          status: mode === "live" ? "waiting" : "active",
          total_questions: parsedQuestions.length,
          grade_weight: numericWeight,
          time_per_question: numericTime,
          current_question_order: 0,
          archived_at: null,
        })
        .select("id")
        .single();

      if (quizError || !createdQuiz?.id) {
        throw quizError || new Error("Não foi possível criar o quiz.");
      }

      const questionRows = parsedQuestions.map((question, index) => ({
        quiz_id: createdQuiz.id,
        question_order: index + 1,
        question_text: question.questionText,
        options: question.options,
        correct_option_id: question.correctOptionId,
      }));

      const { error: questionsError } = await supabase
        .from("quiz_questions")
        .insert(questionRows);

      if (questionsError) {
        throw questionsError;
      }

      setMessage({
        type: "success",
        text: `Quiz criado com sucesso com ${parsedQuestions.length} pergunta(s).`,
      });

      setClassId("");
      setTitle("");
      setDescription("");
      setMode("assignment");
      setTheme("neon");
      setTimePerQuestion("45");
      setGradeWeight("10");
      setRawQuestions("");

      await loadQuizzes();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao criar quiz: ${getErrorMessage(error)}`,
      });
    } finally {
      setCreating(false);
    }
  }

  async function updateQuizStatus(
    quiz: Quiz,
    updates: Partial<Quiz> & Record<string, unknown>
  ) {
    setActionLoadingId(quiz.id);
    setMessage(null);

    const { error } = await supabase
      .from("quizzes")
      .update(updates)
      .eq("id", quiz.id);

    setActionLoadingId("");

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao atualizar quiz: ${error.message}`,
      });

      return;
    }

    await loadQuizzes();
  }

  async function handleStartLiveQuiz(quiz: Quiz) {
    await updateQuizStatus(quiz, {
      status: "live",
      current_question_order: 1,
      live_started_at: new Date().toISOString(),
    });
  }

  async function handleNextQuestion(quiz: Quiz) {
    const totalQuestions = quiz.total_questions ?? 0;
    const current = quiz.current_question_order ?? 0;

    if (current >= totalQuestions) {
      await updateQuizStatus(quiz, {
        status: "finished",
        live_finished_at: new Date().toISOString(),
      });

      return;
    }

    await updateQuizStatus(quiz, {
      current_question_order: current + 1,
    });
  }

  async function handleFinishQuiz(quiz: Quiz) {
    await updateQuizStatus(quiz, {
      status: "finished",
      live_finished_at: new Date().toISOString(),
    });
  }

  async function handleArchiveQuiz(quiz: Quiz) {
    const confirmed = window.confirm(
      "Arquivar este quiz? Ele deixará de aparecer como ativo para os alunos."
    );

    if (!confirmed) return;

    await updateQuizStatus(quiz, {
      status: "archived",
      archived_at: new Date().toISOString(),
    });
  }

  async function handleDeleteQuiz(quiz: Quiz) {
    const confirmed = window.confirm(
      "Excluir este quiz definitivamente? As perguntas, participantes e respostas serão removidos."
    );

    if (!confirmed) return;

    setActionLoadingId(quiz.id);
    setMessage(null);

    const { error } = await supabase.from("quizzes").delete().eq("id", quiz.id);

    setActionLoadingId("");

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao excluir quiz: ${error.message}`,
      });

      return;
    }

    setMessage({
      type: "success",
      text: "Quiz excluído com sucesso.",
    });

    await loadQuizzes();
  }

  function getRanking(quiz: Quiz): RankingItem[] {
    const participants = participantsByQuiz[quiz.id] ?? [];
    const answers = answersByQuiz[quiz.id] ?? [];

    return participants
      .map((participant) => {
        const participantAnswers = answers.filter(
          (answer) => answer.student_id === participant.student_id
        );

        return {
          student_id: participant.student_id,
          student_name: participant.student_name,
          nickname: participant.nickname || participant.student_name,
          emoji: participant.emoji || "🚀",
          correctAnswers: participantAnswers.filter((answer) => answer.is_correct)
            .length,
          points: participantAnswers.reduce(
            (sum, answer) => sum + Number(answer.points ?? 0),
            0
          ),
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.correctAnswers - a.correctAnswers;
      });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-4">
            <div className="rounded-3xl bg-fuchsia-500/15 p-4 text-fuchsia-300">
              <Gamepad2 size={34} />
            </div>

            <div>
              <h2 className="text-2xl font-bold">Criar quiz gamificado</h2>

              <p className="mt-1 text-slate-400">
                Cole perguntas em sequência. O sistema entende que a primeira
                alternativa de cada pergunta é a correta e embaralha tudo para
                os alunos.
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
                <CheckCircle2 size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {message.text}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            >
              <option value="">Selecione a turma</option>

              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título do quiz"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            />

            <select
              value={mode}
              onChange={(event) => setMode(event.target.value as QuizMode)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            >
              <option value="assignment">Modo atividade</option>
              <option value="live">Modo sala de aula</option>
            </select>

            <select
              value={theme}
              onChange={(event) => setTheme(event.target.value as QuizTheme)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            >
              {quizThemes.map((item) => (
                <option key={item.value} value={item.value}>
                  Tema {item.label}
                </option>
              ))}
            </select>

            <select
              value={timePerQuestion}
              onChange={(event) => setTimePerQuestion(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            >
              {timeOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label} por pergunta
                </option>
              ))}
            </select>

            <input
              value={gradeWeight}
              onChange={(event) => setGradeWeight(event.target.value)}
              type="number"
              min="1"
              max="10"
              step="0.1"
              placeholder="Peso da nota"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            />

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrição ou orientação para os alunos"
              rows={3}
              className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400 md:col-span-2"
            />

            <textarea
              value={rawQuestions}
              onChange={(event) => setRawQuestions(event.target.value)}
              placeholder={`Cole as perguntas assim:\n\nQual é a capital do Brasil?\nBrasília\nRio de Janeiro\nSão Paulo\nSalvador\n\nQuanto é 2 + 2?\n4\n3\n5\n6`}
              rows={12}
              className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm outline-none focus:border-fuchsia-400 md:col-span-2"
            />
          </div>

          <div className="mt-5 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
            <div className="flex items-center gap-3">
              <ClipboardList className="text-fuchsia-300" size={22} />

              <div>
                <h3 className="font-bold text-white">Prévia da leitura</h3>

                <p className="text-sm text-slate-400">
                  Perguntas identificadas:{" "}
                  <strong className="text-fuchsia-200">
                    {parsedQuestions.length}
                  </strong>
                </p>
              </div>
            </div>

            {parsedQuestions.length > 0 && (
              <div className="mt-4 max-h-64 space-y-3 overflow-y-auto pr-2">
                {parsedQuestions.map((question, index) => (
                  <div
                    key={`${question.questionText}-${index}`}
                    className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                  >
                    <p className="font-semibold text-white">
                      {index + 1}. {question.questionText}
                    </p>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`rounded-xl border px-3 py-2 text-sm ${
                            option.id === question.correctOptionId
                              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                              : "border-slate-800 bg-slate-900 text-slate-300"
                          }`}
                        >
                          {option.text}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleCreateQuiz}
            disabled={creating}
            className="mt-6 flex items-center gap-3 rounded-2xl bg-fuchsia-500 px-6 py-3 font-bold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
          >
            {creating ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
            {creating ? "Criando quiz..." : "Criar quiz"}
          </button>
        </div>
      </div>

      <aside className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <Trophy size={24} className="text-fuchsia-300" />
          <h2 className="text-2xl font-bold">Quizzes criados</h2>
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <Search size={18} className="text-slate-500" />

          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar quiz..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>

        <div className="mt-6 space-y-4">
          {filteredQuizzes.length === 0 ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-slate-400">
              Nenhum quiz encontrado.
            </p>
          ) : (
            filteredQuizzes.map((quiz) => {
              const className =
                classes.find((classItem) => classItem.id === quiz.class_id)
                  ?.name ?? "Turma";

              const questions = questionsByQuiz[quiz.id] ?? [];
              const participants = participantsByQuiz[quiz.id] ?? [];
              const ranking = getRanking(quiz);
              const loadingThis = actionLoadingId === quiz.id;

              return (
                <div
                  key={quiz.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/40 p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                      <Rocket size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-bold text-fuchsia-200">
                          {getModeLabel(quiz.mode)}
                        </span>

                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                          {getStatusLabel(quiz.status)}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-bold text-white">
                        {quiz.title}
                      </h3>

                      <p className="mt-1 text-sm text-slate-400">
                        {className} • {questions.length} pergunta(s)
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Participantes: {participants.length}
                      </p>
                    </div>
                  </div>

                  {quiz.mode === "live" && quiz.status !== "archived" && (
                    <div className="mt-4 rounded-2xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                      <p className="text-sm text-fuchsia-100">
                        Pergunta atual:{" "}
                        <strong>
                          {quiz.current_question_order || 0}/
                          {quiz.total_questions || 0}
                        </strong>
                      </p>

                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {quiz.status === "waiting" && (
                          <button
                            type="button"
                            onClick={() => handleStartLiveQuiz(quiz)}
                            disabled={loadingThis}
                            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                          >
                            <Play size={15} />
                            Iniciar
                          </button>
                        )}

                        {quiz.status === "live" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleNextQuestion(quiz)}
                              disabled={loadingThis}
                              className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                            >
                              <ChevronRight size={15} />
                              Próxima
                            </button>

                            <button
                              type="button"
                              onClick={() => handleFinishQuiz(quiz)}
                              disabled={loadingThis}
                              className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3 py-2 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
                            >
                              Finalizar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {ranking.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold text-yellow-200">
                        <Trophy size={16} />
                        Ranking parcial
                      </div>

                      <div className="space-y-2">
                        {ranking.slice(0, 5).map((item, index) => (
                          <div
                            key={item.student_id}
                            className="flex items-center justify-between rounded-xl bg-slate-950/50 px-3 py-2 text-sm"
                          >
                            <span className="truncate text-white">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                ? "🥈"
                                : index === 2
                                ? "🥉"
                                : `${index + 1}º`}{" "}
                              {item.emoji} {item.nickname}
                            </span>

                            <span className="font-bold text-yellow-200">
                              {item.points} pts
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleArchiveQuiz(quiz)}
                      disabled={loadingThis || quiz.status === "archived"}
                      className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3 py-2 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {loadingThis ? (
                        <RefreshCw size={15} className="animate-spin" />
                      ) : (
                        <Archive size={15} />
                      )}
                      Arquivar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteQuiz(quiz)}
                      disabled={loadingThis}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      {loadingThis ? (
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