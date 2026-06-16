"use client";

import StudentMobileNav from "@/components/aluno/StudentMobileNav";
import StudentRealtimeNotifications from "@/components/aluno/StudentRealtimeNotifications";
import { supabase } from "@/lib/supabase";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crown,
  Gamepad2,
  Loader2,
  PartyPopper,
  Play,
  Rocket,
  Sparkles,
  Trophy,
  XCircle,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

type Quiz = {
  id: string;
  class_id: string;
  title: string;
  description: string | null;
  mode: "assignment" | "live" | string | null;
  theme: string | null;
  status: string | null;
  result_type: "grade" | "ranking" | string | null;
  total_questions: number | null;
  grade_weight: number | null;
  time_per_question: number | null;
  current_question_order: number | null;
  current_question_started_at: string | null;
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

type QuizAttempt = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number;
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
  attempt_id?: string | null;
  quiz_id: string;
  question_id: string;
  student_id: string;
  selected_option_id: string;
  is_correct: boolean;
  response_time_ms: number | null;
  points: number | null;
  answered_at: string | null;
};

type SelectedAnswers = Record<string, string>;

type RankingItem = {
  student_id: string;
  student_name: string;
  nickname: string;
  emoji: string;
  correctAnswers: number;
  answeredQuestions: number;
  points: number;
};

const emojis = [
  "🚀",
  "🔥",
  "⚡",
  "🎮",
  "👾",
  "🤖",
  "🧠",
  "🏆",
  "🐺",
  "🦊",
  "🐼",
  "🐸",
  "🐯",
  "🦁",
  "🐵",
  "🐧",
  "🦉",
  "🐲",
  "🦄",
  "🐙",
  "🦖",
  "🐝",
  "🐢",
  "🦋",
  "🐳",
  "🦥",
  "🐨",
  "🐰",
  "🍕",
];

const optionVisuals = [
  {
    letter: "A",
    symbol: "◆",
    idle:
      "border-red-400/35 bg-gradient-to-br from-red-500/25 via-rose-500/15 to-red-950/50 hover:border-red-300 hover:from-red-500/35 hover:to-red-800/40",
    selected:
      "border-red-200 bg-gradient-to-br from-red-400 via-rose-500 to-red-700 text-white shadow-2xl shadow-red-500/40 ring-red-200/70",
    badge: "bg-red-500",
  },
  {
    letter: "B",
    symbol: "●",
    idle:
      "border-blue-400/35 bg-gradient-to-br from-blue-500/25 via-cyan-500/15 to-blue-950/50 hover:border-blue-300 hover:from-blue-500/35 hover:to-blue-800/40",
    selected:
      "border-blue-200 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-700 text-white shadow-2xl shadow-blue-500/40 ring-blue-200/70",
    badge: "bg-blue-500",
  },
  {
    letter: "C",
    symbol: "▲",
    idle:
      "border-yellow-400/35 bg-gradient-to-br from-yellow-500/25 via-orange-500/15 to-yellow-950/50 hover:border-yellow-300 hover:from-yellow-500/35 hover:to-orange-800/40",
    selected:
      "border-yellow-100 bg-gradient-to-br from-yellow-300 via-orange-400 to-yellow-700 text-slate-950 shadow-2xl shadow-yellow-500/40 ring-yellow-100/70",
    badge: "bg-yellow-400 text-slate-950",
  },
  {
    letter: "D",
    symbol: "■",
    idle:
      "border-emerald-400/35 bg-gradient-to-br from-emerald-500/25 via-green-500/15 to-emerald-950/50 hover:border-emerald-300 hover:from-emerald-500/35 hover:to-emerald-800/40",
    selected:
      "border-emerald-100 bg-gradient-to-br from-emerald-300 via-green-500 to-emerald-700 text-white shadow-2xl shadow-emerald-500/40 ring-emerald-100/70",
    badge: "bg-emerald-500",
  },
];

function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

function getThemeClasses(theme: string | null) {
  if (theme === "arcade") {
    return {
      page: "from-purple-950 via-slate-950 to-fuchsia-950",
      accent: "bg-fuchsia-500",
      border: "border-fuchsia-500/30",
      soft: "bg-fuchsia-500/10",
      text: "text-fuchsia-200",
      glow: "shadow-fuchsia-500/20",
      gradient: "from-fuchsia-500 via-purple-500 to-pink-500",
    };
  }

  if (theme === "energy") {
    return {
      page: "from-orange-950 via-slate-950 to-yellow-950",
      accent: "bg-orange-500",
      border: "border-orange-500/30",
      soft: "bg-orange-500/10",
      text: "text-orange-200",
      glow: "shadow-orange-500/20",
      gradient: "from-orange-500 via-yellow-500 to-red-500",
    };
  }

  if (theme === "classic") {
    return {
      page: "from-blue-950 via-slate-950 to-cyan-950",
      accent: "bg-blue-500",
      border: "border-blue-500/30",
      soft: "bg-blue-500/10",
      text: "text-blue-200",
      glow: "shadow-blue-500/20",
      gradient: "from-blue-500 via-cyan-500 to-sky-500",
    };
  }

  return {
    page: "from-cyan-950 via-slate-950 to-violet-950",
    accent: "bg-cyan-500",
    border: "border-cyan-500/30",
    soft: "bg-cyan-500/10",
    text: "text-cyan-200",
    glow: "shadow-cyan-500/20",
    gradient: "from-cyan-500 via-blue-500 to-violet-500",
  };
}

function getScore({
  correctAnswers,
  totalQuestions,
  gradeWeight,
}: {
  correctAnswers: number;
  totalQuestions: number;
  gradeWeight: number;
}) {
  if (totalQuestions <= 0) {
    return 0;
  }

  return Number(((correctAnswers / totalQuestions) * gradeWeight).toFixed(1));
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Não foi possível concluir a operação.";
}

function getRemainingSeconds(quiz: Quiz | null | undefined, now: number) {
  if (!quiz) return 0;

  const totalSeconds = Number(quiz.time_per_question ?? 45);

  if (quiz.status !== "live" || !quiz.current_question_started_at) {
    return totalSeconds;
  }

  const startedAt = new Date(quiz.current_question_started_at).getTime();

  if (Number.isNaN(startedAt)) {
    return totalSeconds;
  }

  const elapsedSeconds = Math.floor((now - startedAt) / 1000);

  return Math.max(0, totalSeconds - elapsedSeconds);
}

function getTimerPercent(quiz: Quiz | null | undefined, now: number) {
  if (!quiz) return 0;

  const totalSeconds = Number(quiz.time_per_question ?? 45);
  const remaining = getRemainingSeconds(quiz, now);

  if (totalSeconds <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
}

function getResponseTimeMs(quiz: Quiz | null | undefined) {
  if (!quiz?.current_question_started_at) {
    return 0;
  }

  const startedAt = new Date(quiz.current_question_started_at).getTime();

  if (Number.isNaN(startedAt)) {
    return 0;
  }

  return Math.max(0, Date.now() - startedAt);
}

function isRankingOnlyQuiz(quiz: Quiz | null | undefined) {
  return quiz?.mode === "live" && quiz.result_type === "ranking";
}

export default function StudentQuizzes() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionsByQuiz, setQuestionsByQuiz] = useState<
    Record<string, QuizQuestion[]>
  >({});
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [participants, setParticipants] = useState<QuizParticipant[]>([]);
  const [rankingAnswers, setRankingAnswers] = useState<QuizAnswer[]>([]);

  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<SelectedAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [nickname, setNickname] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🚀");

  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingLiveAnswer, setSendingLiveAnswer] = useState(false);
  const [finalizingLiveGrade, setFinalizingLiveGrade] = useState(false);

  const [now, setNow] = useState(Date.now());

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function loadData(parsedSession?: StudentSession) {
    const activeSession = parsedSession || session;

    if (!activeSession) {
      return;
    }

    const [quizzesResponse, attemptsResponse] = await Promise.all([
      supabase
        .from("quizzes")
        .select("*")
        .eq("class_id", activeSession.classId)
        .in("status", ["active", "waiting", "live", "finished"])
        .order("created_at", { ascending: false }),

      supabase
        .from("quiz_attempts")
        .select("*")
        .eq("student_id", activeSession.studentId),
    ]);

    if (quizzesResponse.error) {
      console.error(quizzesResponse.error.message);
      setQuizzes([]);
      setLoading(false);
      return;
    }

    const loadedQuizzes = (quizzesResponse.data as Quiz[] | null) ?? [];
    setQuizzes(loadedQuizzes);
    setAttempts((attemptsResponse.data as QuizAttempt[] | null) ?? []);

    const quizIds = loadedQuizzes.map((quiz) => quiz.id);

    if (quizIds.length > 0) {
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
            .in("quiz_id", quizIds),

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
        setParticipants(
          (participantsResponse.data as QuizParticipant[] | null) ?? []
        );
      }

      if (!answersResponse.error) {
        setRankingAnswers((answersResponse.data as QuizAnswer[] | null) ?? []);
      }
    } else {
      setQuestionsByQuiz({});
      setParticipants([]);
      setRankingAnswers([]);
    }

    setLoading(false);
  }

  useEffect(() => {
    const savedSession = sessionStorage.getItem("melia_student_session");

    if (!savedSession) {
      router.push("/aluno");
      return;
    }

    const parsedSession = JSON.parse(savedSession) as StudentSession;

    setSession(parsedSession);
    setNickname(parsedSession.studentName.split(" ")[0] || "Aluno");

    loadData(parsedSession);
  }, [router]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!session) return;

    const channel = supabase
      .channel(`student_quiz_realtime_${session.studentId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quizzes",
        },
        () => loadData(session)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_answers",
        },
        () => loadData(session)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_participants",
        },
        () => loadData(session)
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_attempts",
        },
        () => loadData(session)
      )
      .subscribe();

    const fallbackPolling = setInterval(() => {
      loadData(session);
    }, 3000);

    return () => {
      clearInterval(fallbackPolling);
      supabase.removeChannel(channel);
    };
  }, [session]);

  const selectedQuiz = quizzes.find((quiz) => quiz.id === selectedQuizId);

  const selectedQuestions = selectedQuiz
    ? questionsByQuiz[selectedQuiz.id] ?? []
    : [];

  const selectedQuizAttempt = selectedQuiz
    ? attempts.find((attempt) => attempt.quiz_id === selectedQuiz.id)
    : null;

  const isLiveMode = selectedQuiz?.mode === "live";
  const rankingOnly = isRankingOnlyQuiz(selectedQuiz);

  const assignmentQuestion =
    selectedQuestions[currentQuestionIndex] ?? selectedQuestions[0] ?? null;

  const liveQuestion = selectedQuiz
    ? selectedQuestions.find(
        (question) =>
          question.question_order ===
          Number(selectedQuiz.current_question_order ?? 0)
      ) ?? null
    : null;

  const currentQuestion = isLiveMode ? liveQuestion : assignmentQuestion;

  const alreadyAnswered = Boolean(selectedQuizAttempt);

  const liveAnswerForCurrentQuestion =
    session && selectedQuiz && currentQuestion
      ? rankingAnswers.find(
          (answer) =>
            answer.quiz_id === selectedQuiz.id &&
            answer.question_id === currentQuestion.id &&
            answer.student_id === session.studentId
        )
      : null;

  const currentSelectedOptionId = currentQuestion
    ? liveAnswerForCurrentQuestion?.selected_option_id ||
      selectedAnswers[currentQuestion.id] ||
      ""
    : "";

  const progressPercent =
    selectedQuestions.length > 0
      ? isLiveMode
        ? ((selectedQuiz?.current_question_order ?? 0) /
            selectedQuestions.length) *
          100
        : ((currentQuestionIndex + 1) / selectedQuestions.length) * 100
      : 0;

  const remainingSeconds = getRemainingSeconds(selectedQuiz, now);
  const timerPercent = getTimerPercent(selectedQuiz, now);
  const timeExpired =
    Boolean(selectedQuiz) &&
    selectedQuiz?.mode === "live" &&
    selectedQuiz?.status === "live" &&
    remainingSeconds <= 0;

  const ranking = useMemo<RankingItem[]>(() => {
    if (!selectedQuiz) {
      return [];
    }

    return participants
      .filter((participant) => participant.quiz_id === selectedQuiz.id)
      .map((participant) => {
        const answers = rankingAnswers.filter(
          (answer) =>
            answer.quiz_id === selectedQuiz.id &&
            answer.student_id === participant.student_id
        );

        return {
          student_id: participant.student_id,
          student_name: participant.student_name,
          nickname: participant.nickname || participant.student_name,
          emoji: participant.emoji || "🚀",
          answeredQuestions: answers.length,
          correctAnswers: answers.filter((answer) => answer.is_correct).length,
          points: answers.reduce(
            (sum, answer) => sum + Number(answer.points ?? 0),
            0
          ),
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        return b.correctAnswers - a.correctAnswers;
      });
  }, [participants, rankingAnswers, selectedQuiz]);

  async function recalculateStudentAverage(studentId: string) {
    const { data, error } = await supabase
      .from("grades")
      .select("score")
      .eq("student_id", studentId);

    if (error) throw error;

    const scores =
      data
        ?.map((item) => Number(item.score))
        .filter((score) => !Number.isNaN(score)) ?? [];

    const average =
      scores.length > 0
        ? Number(
            (
              scores.reduce((sum, score) => sum + score, 0) / scores.length
            ).toFixed(1)
          )
        : 0;

    const { error: updateStudentError } = await supabase
      .from("students")
      .update({ average })
      .eq("id", studentId);

    if (updateStudentError) throw updateStudentError;
  }

  async function joinQuiz(quiz: Quiz) {
    if (!session) return;

    setJoining(true);
    setMessage(null);

    const { error } = await supabase.from("quiz_participants").upsert(
      {
        quiz_id: quiz.id,
        student_id: session.studentId,
        class_id: session.classId,
        student_name: session.studentName,
        nickname: nickname.trim() || session.studentName,
        emoji: selectedEmoji,
      },
      {
        onConflict: "quiz_id,student_id",
      }
    );

    setJoining(false);

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao entrar no quiz: ${error.message}`,
      });

      return;
    }

    setSelectedQuizId(quiz.id);
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    await loadData(session);
  }

  async function finishAssignmentQuiz() {
    if (!session || !selectedQuiz) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const totalQuestions = selectedQuestions.length;
      const gradeWeight = Number(selectedQuiz.grade_weight ?? 10);

      const answerRows = selectedQuestions.map((question) => {
        const selectedOptionId = selectedAnswers[question.id] || "";
        const isCorrect = selectedOptionId === question.correct_option_id;

        return {
          quiz_id: selectedQuiz.id,
          question_id: question.id,
          student_id: session.studentId,
          selected_option_id: selectedOptionId,
          is_correct: isCorrect,
          response_time_ms: 0,
          points: isCorrect ? 1000 : 0,
          answered_at: new Date().toISOString(),
        };
      });

      const correctAnswers = answerRows.filter((answer) => answer.is_correct)
        .length;

      const score = getScore({
        correctAnswers,
        totalQuestions,
        gradeWeight,
      });

      const { data: createdAttempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: selectedQuiz.id,
          student_id: session.studentId,
          class_id: session.classId,
          mode: selectedQuiz.mode || "assignment",
          score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_points: correctAnswers * 1000,
          finished_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (attemptError || !createdAttempt?.id) {
        throw attemptError || new Error("Não foi possível salvar sua tentativa.");
      }

      const answersWithAttempt = answerRows.map((answer) => ({
        ...answer,
        attempt_id: createdAttempt.id,
      }));

      const { error: answersError } = await supabase
        .from("quiz_answers")
        .insert(answersWithAttempt);

      if (answersError) throw answersError;

      const { error: gradeError } = await supabase.from("grades").insert({
        student_id: session.studentId,
        title: `Quiz: ${selectedQuiz.title}`,
        score,
        date: getTodayDate(),
        feedback: `Nota gerada automaticamente pelo Quiz. Acertos: ${correctAnswers}/${totalQuestions}.`,
        source_type: "quiz",
        source_id: selectedQuiz.id,
      });

      if (gradeError) throw gradeError;

      await recalculateStudentAverage(session.studentId);

      setMessage({
        type: "success",
        text: `Quiz finalizado! Sua nota foi ${score.toFixed(1)}.`,
      });

      await loadData(session);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao finalizar quiz: ${getErrorMessage(error)}`,
      });
    } finally {
      setSubmitting(false);
    }
  }

  async function sendLiveAnswer(optionId: string) {
    if (!session || !selectedQuiz || !currentQuestion) return;
    if (liveAnswerForCurrentQuestion) return;

    if (timeExpired) {
      setMessage({
        type: "error",
        text: "O tempo desta pergunta acabou. Aguarde a próxima.",
      });
      return;
    }

    setSendingLiveAnswer(true);
    setMessage(null);

    try {
      const isCorrect = optionId === currentQuestion.correct_option_id;
      const responseTimeMs = getResponseTimeMs(selectedQuiz);
      const remaining = getRemainingSeconds(selectedQuiz, Date.now());
      const speedBonus = Math.max(0, remaining * 10);
      const points = isCorrect ? 1000 + speedBonus : 0;

      const { error } = await supabase.from("quiz_answers").insert({
        attempt_id: null,
        quiz_id: selectedQuiz.id,
        question_id: currentQuestion.id,
        student_id: session.studentId,
        selected_option_id: optionId,
        is_correct: isCorrect,
        response_time_ms: responseTimeMs,
        points,
        answered_at: new Date().toISOString(),
      });

      if (error) throw error;

      setMessage({
        type: "success",
        text: "Resposta enviada. Aguarde o professor liberar a próxima pergunta.",
      });

      await loadData(session);
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao enviar resposta: ${getErrorMessage(error)}`,
      });
    } finally {
      setSendingLiveAnswer(false);
    }
  }

  async function finalizeLiveQuizGrade() {
    if (!session || !selectedQuiz || selectedQuiz.mode !== "live") return;
    if (selectedQuiz.result_type === "ranking") return;
    if (selectedQuizAttempt || finalizingLiveGrade) return;

    setFinalizingLiveGrade(true);

    try {
      const totalQuestions = selectedQuestions.length;
      const gradeWeight = Number(selectedQuiz.grade_weight ?? 10);

      const myAnswers = rankingAnswers.filter(
        (answer) =>
          answer.quiz_id === selectedQuiz.id &&
          answer.student_id === session.studentId
      );

      const correctAnswers = myAnswers.filter((answer) => answer.is_correct)
        .length;

      const totalPoints = myAnswers.reduce(
        (sum, answer) => sum + Number(answer.points ?? 0),
        0
      );

      const score = getScore({
        correctAnswers,
        totalQuestions,
        gradeWeight,
      });

      const { data: createdAttempt, error: attemptError } = await supabase
        .from("quiz_attempts")
        .insert({
          quiz_id: selectedQuiz.id,
          student_id: session.studentId,
          class_id: session.classId,
          mode: "live",
          score,
          total_questions: totalQuestions,
          correct_answers: correctAnswers,
          total_points: totalPoints,
          finished_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (attemptError || !createdAttempt?.id) {
        throw attemptError || new Error("Não foi possível registrar sua nota.");
      }

      const { error: updateAnswersError } = await supabase
        .from("quiz_answers")
        .update({
          attempt_id: createdAttempt.id,
        })
        .eq("quiz_id", selectedQuiz.id)
        .eq("student_id", session.studentId);

      if (updateAnswersError) throw updateAnswersError;

      const { error: gradeError } = await supabase.from("grades").insert({
        student_id: session.studentId,
        title: `Quiz: ${selectedQuiz.title}`,
        score,
        date: getTodayDate(),
        feedback: `Nota gerada automaticamente pelo Quiz ao vivo. Acertos: ${correctAnswers}/${totalQuestions}. Pontuação: ${totalPoints} pts.`,
        source_type: "quiz",
        source_id: selectedQuiz.id,
      });

      if (gradeError) throw gradeError;

      await recalculateStudentAverage(session.studentId);
      await loadData(session);
    } catch (error) {
      console.error("Erro ao finalizar nota do quiz ao vivo:", error);
    } finally {
      setFinalizingLiveGrade(false);
    }
  }

  useEffect(() => {
    if (
      !session ||
      !selectedQuiz ||
      selectedQuiz.mode !== "live" ||
      selectedQuiz.status !== "finished" ||
      selectedQuiz.result_type === "ranking" ||
      selectedQuizAttempt ||
      finalizingLiveGrade
    ) {
      return;
    }

    finalizeLiveQuizGrade();
  }, [
    session,
    selectedQuiz?.id,
    selectedQuiz?.status,
    selectedQuiz?.result_type,
    selectedQuizAttempt?.id,
    finalizingLiveGrade,
  ]);

  function selectAnswer(questionId: string, optionId: string) {
    setSelectedAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));

    setMessage(null);
  }

  function handleOptionClick(optionId: string) {
    if (!currentQuestion) return;

    if (isLiveMode) {
      sendLiveAnswer(optionId);
      return;
    }

    selectAnswer(currentQuestion.id, optionId);
  }

  function goToNextQuestion() {
    if (!currentQuestion) return;

    if (!selectedAnswers[currentQuestion.id]) {
      setMessage({
        type: "error",
        text: "Toque em uma alternativa antes de continuar.",
      });
      return;
    }

    setMessage(null);

    if (currentQuestionIndex >= selectedQuestions.length - 1) {
      finishAssignmentQuiz();
      return;
    }

    setCurrentQuestionIndex((current) => current + 1);

    window.requestAnimationFrame(() => {
      document
        .getElementById("quiz-question-card")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const theme = getThemeClasses(selectedQuiz?.theme ?? "neon");

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 animate-pulse items-center justify-center rounded-[28px] bg-cyan-500/20 text-cyan-300">
            <Gamepad2 className="h-10 w-10" />
          </div>

          <p className="text-lg font-bold">Carregando quizzes...</p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`relative min-h-screen overflow-hidden bg-gradient-to-br ${theme.page} pb-28 text-white`}
    >
      <div className="pointer-events-none fixed left-10 top-24 h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none fixed bottom-20 right-10 h-80 w-80 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/80 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <Link
              href="/aluno/dashboard"
              className="mb-2 inline-flex text-sm text-cyan-300 hover:text-cyan-200"
            >
              ← Voltar ao painel
            </Link>

            <h1 className="text-3xl font-black">Quiz</h1>

            <p className="mt-1 text-sm text-slate-400">
              Escolha seu avatar, responda e acompanhe sua pontuação.
            </p>
          </div>

          <div className="hidden rounded-3xl border border-white/10 bg-white/5 px-5 py-3 text-right sm:block">
            <p className="text-xs text-slate-400">Jogador</p>
            <p className="text-lg font-black">
              {selectedEmoji} {nickname || "Aluno"}
            </p>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-6xl px-4 py-6">
        {message && (
          <div
            className={`mb-5 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${
              message.type === "success"
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-red-500/30 bg-red-500/10 text-red-200"
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

        {!selectedQuiz ? (
          <div className="grid gap-5">
            <div className="relative overflow-hidden rounded-[36px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/15 via-slate-900/80 to-cyan-500/10 p-6 shadow-2xl shadow-fuchsia-500/10">
              <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />

              <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="rounded-3xl bg-fuchsia-500/20 p-4 text-fuchsia-200 shadow-xl shadow-fuchsia-500/20">
                    <Gamepad2 size={38} />
                  </div>

                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-fuchsia-100">
                      <Sparkles className="h-4 w-4" />
                      Modo Quiz
                    </div>

                    <h2 className="mt-4 text-3xl font-black sm:text-4xl">
                      Escolha seu avatar e entre no jogo
                    </h2>

                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                      No modo atividade você responde sozinho. No modo sala de
                      aula, aguarde o professor liberar cada pergunta.
                    </p>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-slate-950/50 p-4 lg:w-[360px]">
                  <input
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="Seu apelido no ranking"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none transition focus:border-fuchsia-400"
                  />

                  <div className="mt-3 grid max-h-40 grid-cols-7 gap-1.5 overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950/50 p-2 sm:grid-cols-8">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setSelectedEmoji(emoji)}
                        className={`flex aspect-square min-h-10 items-center justify-center rounded-xl border p-1 text-xl transition hover:scale-105 sm:text-2xl ${
                          selectedEmoji === emoji
                            ? "scale-110 border-fuchsia-300 bg-fuchsia-500/25 shadow-lg shadow-fuchsia-500/20"
                            : "border-slate-800 bg-slate-900 hover:border-fuchsia-400/40"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {quizzes.length === 0 ? (
              <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-8 text-center">
                <AlertTriangle className="mx-auto h-12 w-12 text-slate-500" />

                <h2 className="mt-4 text-2xl font-black">
                  Nenhum quiz disponível
                </h2>

                <p className="mt-2 text-sm text-slate-400">
                  Quando o professor liberar um quiz para sua turma, ele
                  aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {quizzes.map((quiz) => {
                  const attempt = attempts.find(
                    (item) => item.quiz_id === quiz.id
                  );

                  const quizTheme = getThemeClasses(quiz.theme);
                  const isRankingOnly = isRankingOnlyQuiz(quiz);

                  return (
                    <div
                      key={quiz.id}
                      className={`group relative overflow-hidden rounded-[34px] border ${quizTheme.border} bg-slate-900/75 p-6 shadow-2xl transition hover:-translate-y-1 hover:shadow-fuchsia-500/10`}
                    >
                      <div
                        className={`absolute -right-16 -top-16 h-44 w-44 rounded-full bg-gradient-to-br ${quizTheme.gradient} opacity-20 blur-3xl transition group-hover:opacity-30`}
                      />

                      <div className="relative z-10">
                        <div className="flex items-start gap-4">
                          <div
                            className={`rounded-3xl bg-gradient-to-br ${quizTheme.gradient} p-4 text-white shadow-xl ${quizTheme.glow}`}
                          >
                            <Rocket size={30} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap gap-2">
                              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-200">
                                {quiz.mode === "live"
                                  ? "Sala de aula"
                                  : "Atividade"}
                              </span>

                              <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                                {quiz.status === "waiting"
                                  ? "Sala aberta"
                                  : quiz.status === "live"
                                  ? "Ao vivo"
                                  : quiz.status === "finished"
                                  ? "Finalizado"
                                  : "Ativo"}
                              </span>

                              <span
                                className={`rounded-full px-3 py-1 text-xs font-bold ${
                                  isRankingOnly
                                    ? "bg-yellow-500/10 text-yellow-200"
                                    : "bg-emerald-500/10 text-emerald-200"
                                }`}
                              >
                                {isRankingOnly ? "Ranking" : "Vale nota"}
                              </span>
                            </div>

                            <h3 className="mt-3 text-2xl font-black">
                              {quiz.title}
                            </h3>

                            {quiz.description && (
                              <p className="mt-2 text-sm leading-6 text-slate-400">
                                {quiz.description}
                              </p>
                            )}

                            <p className="mt-3 text-sm text-slate-500">
                              {quiz.total_questions ?? 0} pergunta(s)
                            </p>
                          </div>
                        </div>

                        {attempt ? (
                          <div className="mt-5 rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
                            <CheckCircle2 className="mb-2 h-5 w-5" />
                            Quiz respondido. Nota:{" "}
                            <strong>{Number(attempt.score).toFixed(1)}</strong>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => joinQuiz(quiz)}
                            disabled={joining || quiz.status === "finished"}
                            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${quizTheme.gradient} px-5 py-4 text-base font-black text-white shadow-xl transition hover:scale-[1.02] disabled:opacity-50`}
                          >
                            {joining ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Play size={18} />
                            )}

                            {quiz.status === "finished"
                              ? "Quiz finalizado"
                              : quiz.mode === "live"
                              ? "Entrar na sala"
                              : "Responder atividade"}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : selectedQuiz.mode === "live" && selectedQuiz.status === "waiting" ? (
          <div className="rounded-[36px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/20 to-orange-500/10 p-8 text-center shadow-2xl shadow-yellow-500/10">
            <Sparkles className="mx-auto h-16 w-16 animate-pulse text-yellow-300" />

            <h2 className="mt-4 text-4xl font-black">Você entrou na sala!</h2>

            <p className="mt-2 text-yellow-100">
              Aguarde o professor iniciar o quiz.
            </p>

            <div className="mt-8 text-7xl">{selectedEmoji}</div>

            <p className="mt-4 text-2xl font-black text-white">{nickname}</p>

            <div className="mx-auto mt-6 flex max-w-xs items-center justify-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-100">
              <Loader2 className="h-4 w-4 animate-spin" />
              Esperando início...
            </div>
          </div>
        ) : selectedQuiz.mode === "live" &&
          selectedQuiz.status === "finished" ? (
          <div className="rounded-[36px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/20 via-orange-500/10 to-slate-900 p-8 shadow-2xl shadow-yellow-500/10">
            <div className="text-center">
              <Crown className="mx-auto h-20 w-20 text-yellow-300" />

              <h2 className="mt-4 text-4xl font-black">Ranking da rodada</h2>

              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                O ranking mostra a participação desta rodada. O mais importante
                é aprender, evoluir e tentar de novo.
              </p>

              {rankingOnly && (
                <div className="mx-auto mt-5 max-w-md rounded-2xl border border-yellow-400/20 bg-yellow-500/10 px-4 py-3 text-sm font-bold text-yellow-100">
                  Este quiz foi configurado apenas como ranking. Nenhuma nota
                  será lançada.
                </div>
              )}

              {!rankingOnly && finalizingLiveGrade && (
                <div className="mx-auto mt-5 flex max-w-sm items-center justify-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-100">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registrando sua nota...
                </div>
              )}

              {!rankingOnly && selectedQuizAttempt && (
                <div className="mx-auto mt-5 max-w-sm rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-emerald-100">
                  Sua nota foi{" "}
                  <strong>{Number(selectedQuizAttempt.score).toFixed(1)}</strong>
                </div>
              )}
            </div>

            <div className="mt-8 space-y-3">
              {ranking.map((item, index) => (
                <div
                  key={item.student_id}
                  className={`flex items-center justify-between rounded-3xl border px-5 py-4 transition ${
                    index === 0
                      ? "border-yellow-300/50 bg-yellow-500/20 shadow-xl shadow-yellow-500/10"
                      : index === 1
                      ? "border-slate-300/30 bg-slate-300/10"
                      : index === 2
                      ? "border-orange-400/30 bg-orange-500/10"
                      : "border-slate-800 bg-slate-950/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">
                      {index === 0
                        ? "🥇"
                        : index === 1
                        ? "🥈"
                        : index === 2
                        ? "🥉"
                        : `${index + 1}º`}
                    </div>

                    <div>
                      <p className="text-lg font-black">
                        {item.emoji} {item.nickname}
                      </p>

                      <p className="text-sm text-slate-400">
                        {item.correctAnswers} acerto(s) •{" "}
                        {item.answeredQuestions} respondida(s)
                      </p>
                    </div>
                  </div>

                  <p className="text-xl font-black text-yellow-200">
                    {item.points} pts
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedQuizId("")}
              className="mt-6 w-full rounded-2xl bg-yellow-500 px-5 py-4 font-black text-slate-950 transition hover:scale-[1.01] hover:bg-yellow-400"
            >
              Voltar
            </button>
          </div>
        ) : alreadyAnswered ? (
          <div className="rounded-[36px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 to-green-500/10 p-8 text-center shadow-2xl shadow-emerald-500/10">
            <PartyPopper className="mx-auto h-16 w-16 text-emerald-300" />

            <h2 className="mt-4 text-4xl font-black">Quiz concluído!</h2>

            <p className="mt-3 text-lg text-emerald-100">
              Sua nota foi{" "}
              <strong>{Number(selectedQuizAttempt?.score ?? 0).toFixed(1)}</strong>
              .
            </p>

            <button
              type="button"
              onClick={() => setSelectedQuizId("")}
              className="mt-6 rounded-2xl bg-emerald-500 px-6 py-4 font-black text-white transition hover:scale-[1.02] hover:bg-emerald-400"
            >
              Voltar aos quizzes
            </button>
          </div>
        ) : currentQuestion ? (
          <div className="grid gap-5">
            <div id="quiz-question-card" className="scroll-mt-24 overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur">
              <div className={`h-2 bg-gradient-to-r ${theme.gradient}`}>
                <div
                  className="h-full bg-white/80 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, progressPercent))}%`,
                  }}
                />
              </div>

              {isLiveMode && (
                <div className="border-b border-white/10 bg-slate-950/50 px-4 py-3 sm:px-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl ${
                          timeExpired
                            ? "bg-red-500/20 text-red-200"
                            : "bg-yellow-500/20 text-yellow-200"
                        }`}
                      >
                        <Clock3 className="h-6 w-6" />
                      </div>

                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                          Tempo da pergunta
                        </p>

                        <p
                          className={`text-2xl font-black ${
                            remainingSeconds <= 10
                              ? "text-red-300"
                              : "text-yellow-200"
                          }`}
                        >
                          {remainingSeconds}s
                        </p>
                      </div>
                    </div>

                    <div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          remainingSeconds <= 10
                            ? "bg-red-500"
                            : "bg-yellow-400"
                        }`}
                        style={{
                          width: `${timerPercent}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 sm:p-5">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border ${theme.border} ${theme.soft} px-4 py-2 text-xs font-black uppercase tracking-wide ${theme.text}`}
                      >
                        <Zap className="h-4 w-4" />
                        Pergunta{" "}
                        {isLiveMode
                          ? selectedQuiz.current_question_order ?? 0
                          : currentQuestionIndex + 1}{" "}
                        de {selectedQuestions.length}
                      </span>

                      {currentSelectedOptionId && (
                        <span className="inline-flex animate-pulse items-center gap-2 rounded-full border border-emerald-300/30 bg-emerald-500/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-200">
                          <CheckCircle2 className="h-4 w-4" />
                          Resposta enviada
                        </span>
                      )}

                      {timeExpired && !currentSelectedOptionId && (
                        <span className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/15 px-4 py-2 text-xs font-black uppercase tracking-wide text-red-200">
                          <XCircle className="h-4 w-4" />
                          Tempo esgotado
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-black leading-snug sm:text-2xl lg:text-3xl">
                      {currentQuestion.question_text}
                    </h2>
                  </div>

                  <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center sm:block">
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Jogador
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {selectedEmoji} {nickname}
                    </p>
                  </div>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                  {currentQuestion.options.map((option, index) => {
                    const selected = currentSelectedOptionId === option.id;
                    const visual = optionVisuals[index] ?? optionVisuals[0];

                    const disabled =
                      sendingLiveAnswer ||
                      (isLiveMode &&
                        (Boolean(liveAnswerForCurrentQuestion) ||
                          timeExpired));

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleOptionClick(option.id)}
                        disabled={disabled}
                        className={`group relative min-h-[66px] overflow-hidden rounded-2xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] disabled:cursor-not-allowed sm:min-h-[82px] sm:p-4 ${
                          selected
                            ? `scale-[1.01] ring-2 ${visual.selected}`
                            : `${visual.idle} ${
                                disabled ? "opacity-60 grayscale" : ""
                              }`
                        }`}
                      >
                        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl transition group-hover:bg-white/20" />

                        {selected && (
                          <div className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-white p-1.5 text-[10px] font-black uppercase tracking-wide text-slate-950 shadow-xl sm:right-3 sm:top-3 sm:px-2.5 sm:py-1">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="hidden sm:inline">Selecionada</span>
                          </div>
                        )}

                        <div className="relative z-10 flex h-full items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base font-black shadow-lg sm:h-12 sm:w-12 sm:text-lg ${
                              selected
                                ? "bg-white text-slate-950"
                                : `${visual.badge} text-white`
                            }`}
                          >
                            {visual.letter}
                          </div>

                          <p className="min-w-0 flex-1 pr-7 text-sm font-black leading-snug sm:pr-20 sm:text-base lg:text-lg">
                            {option.text}
                          </p>

                          <span className="hidden shrink-0 text-xl opacity-70 sm:block">
                            {visual.symbol}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-sm text-slate-300">
                    {isLiveMode ? (
                      currentSelectedOptionId ? (
                        <span className="font-semibold text-emerald-200">
                          Resposta enviada. Aguarde o professor liberar a
                          próxima pergunta.
                        </span>
                      ) : timeExpired ? (
                        <span className="font-semibold text-red-200">
                          O tempo acabou. Aguarde a próxima pergunta.
                        </span>
                      ) : (
                        <span>Escolha uma alternativa antes do tempo acabar.</span>
                      )
                    ) : currentSelectedOptionId ? (
                      <span className="font-semibold text-emerald-200">
                        Resposta marcada. Agora você pode avançar.
                      </span>
                    ) : (
                      <span>Escolha uma alternativa para continuar.</span>
                    )}
                  </div>

                  {!isLiveMode && (
                    <button
                      type="button"
                      onClick={goToNextQuestion}
                      disabled={submitting || !currentSelectedOptionId}
                      className={`flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r ${theme.gradient} px-5 py-3 text-base font-black text-white shadow-xl ${theme.glow} transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:grayscale disabled:opacity-40`}
                    >
                      {submitting ? (
                        <Loader2 className="animate-spin" size={20} />
                      ) : currentQuestionIndex >=
                        selectedQuestions.length - 1 ? (
                        <Trophy size={20} />
                      ) : (
                        <ArrowRight size={20} />
                      )}

                      {currentQuestionIndex >= selectedQuestions.length - 1
                        ? "Finalizar quiz"
                        : "Próxima pergunta"}
                    </button>
                  )}

                  {isLiveMode && sendingLiveAnswer && (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-7 py-4 text-lg font-black text-white">
                      <Loader2 className="animate-spin" size={20} />
                      Enviando...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-slate-500" />

            <h2 className="mt-4 text-2xl font-black">
              Aguardando pergunta
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              O professor ainda não liberou uma pergunta para este quiz.
            </p>
          </div>
        )}
      </section>

      <StudentRealtimeNotifications />
      <StudentMobileNav />
    </main>
  );
}