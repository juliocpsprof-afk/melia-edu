"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Archive,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ClipboardList,
  Copy,
  Database,
  Gamepad2,
  Layers3,
  Loader2,
  MonitorPlay,
  Play,
  PlusCircle,
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

type StudentItem = {
  id: string;
  name: string | null;
};

type QuizMode = "assignment" | "live";
type QuizTheme = "neon" | "arcade" | "energy" | "classic";
type QuizResultType = "grade" | "ranking";
type CreationTarget = "class-only" | "class-and-template" | "template-only";

type QuizOption = {
  id: string;
  text: string;
};

type ParsedQuestion = {
  questionText: string;
  options: QuizOption[];
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
  result_type: QuizResultType | string | null;
  total_questions: number | null;
  grade_weight: number | null;
  time_per_question: number | null;
  current_question_order: number | null;
  current_question_started_at: string | null;
  live_started_at: string | null;
  live_finished_at: string | null;
  created_at: string | null;
  archived_at: string | null;
};

type QuizQuestion = {
  id: string;
  quiz_id: string;
  question_order: number;
  question_text: string;
  options: QuizOption[];
  correct_option_id: string;
};

type QuizTemplate = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  mode: QuizMode | string | null;
  theme: QuizTheme | string | null;
  result_type: QuizResultType | string | null;
  total_questions: number | null;
  grade_weight: number | null;
  time_per_question: number | null;
  created_at: string | null;
  archived_at: string | null;
};

type QuizTemplateQuestion = {
  id: string;
  template_id: string;
  question_order: number;
  question_text: string;
  options: QuizOption[];
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
  question_id: string;
  student_id: string;
  selected_option_id: string;
  is_correct: boolean;
  points: number | null;
  answered_at: string | null;
};

type QuizAttempt = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  correct_answers: number | null;
  total_questions: number | null;
  total_points: number | null;
  finished_at: string | null;
};

type RankingItem = {
  student_id: string;
  student_name: string;
  nickname: string;
  emoji: string;
  answeredQuestions: number;
  correctAnswers: number;
  points: number;
};

type Message = {
  type: "success" | "error";
  text: string;
};

const quizThemes: {
  value: QuizTheme;
  label: string;
  description: string;
  classes: string;
}[] = [
  {
    value: "neon",
    label: "Neon",
    description: "Visual gamer",
    classes: "border-cyan-400/40 bg-cyan-500/10 text-cyan-100",
  },
  {
    value: "arcade",
    label: "Arcade",
    description: "Competitivo",
    classes: "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-100",
  },
  {
    value: "energy",
    label: "Energia",
    description: "Rápido",
    classes: "border-orange-400/40 bg-orange-500/10 text-orange-100",
  },
  {
    value: "classic",
    label: "Clássico",
    description: "Limpo",
    classes: "border-blue-400/40 bg-blue-500/10 text-blue-100",
  },
];

const timeOptions = [
  { value: 30, label: "30s" },
  { value: 45, label: "45s" },
  { value: 60, label: "60s" },
  { value: 90, label: "90s" },
];

const templateCategories = [
  "Revisão",
  "Diagnóstico",
  "Fixação",
  "Avaliação",
  "Simulado",
  "Dinâmica",
  "Conhecimentos gerais",
];

function shuffleArray<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message);
  }

  return "Não foi possível concluir a operação.";
}

function getStatusLabel(status: string | null) {
  if (status === "waiting") return "Sala aberta";
  if (status === "live") return "Ao vivo";
  if (status === "finished") return "Finalizado";
  if (status === "archived") return "Arquivado";
  if (status === "active") return "Ativo";
  return "Rascunho";
}

function getResultTypeLabel(resultType: string | null, mode: string | null) {
  if (mode !== "live") return "Gera nota";
  if (resultType === "ranking") return "Apenas ranking";
  return "Converte em nota";
}

function getModeLabel(mode: string | null) {
  if (mode === "live") return "Sala de aula";
  return "Atividade";
}

function getClassNameById(classes: ClassItem[], classId: string) {
  return classes.find((classItem) => classItem.id === classId)?.name ?? "Turma";
}

function formatDate(value: string | null) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("pt-BR");
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

    const questionNumber = parsedQuestions.length + 1;
    const baseOptions = [
      {
        id: `q${questionNumber}_a`,
        text: correctAnswer,
        isCorrect: true,
      },
      {
        id: `q${questionNumber}_b`,
        text: wrongAnswer1,
        isCorrect: false,
      },
      {
        id: `q${questionNumber}_c`,
        text: wrongAnswer2,
        isCorrect: false,
      },
      {
        id: `q${questionNumber}_d`,
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

function normalizeTemplateQuestion(
  question: QuizTemplateQuestion,
  questionNumber: number
): ParsedQuestion {
  return {
    questionText: question.question_text,
    options: (question.options ?? []).map((option, index) => ({
      id: option.id || `q${questionNumber}_${index}`,
      text: option.text,
    })),
    correctOptionId: question.correct_option_id,
  };
}

function getRemainingSeconds(quiz: Quiz, now: number) {
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

function getTimerPercent(quiz: Quiz, now: number) {
  const totalSeconds = Number(quiz.time_per_question ?? 45);
  const remaining = getRemainingSeconds(quiz, now);

  if (totalSeconds <= 0) return 0;

  return Math.max(0, Math.min(100, (remaining / totalSeconds) * 100));
}

export function QuizManager({ classes }: { classes: ClassItem[] }) {
  const [creationTarget, setCreationTarget] =
    useState<CreationTarget>("class-only");
  const [classId, setClassId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateCategory, setTemplateCategory] = useState("Revisão");
  const [mode, setMode] = useState<QuizMode>("assignment");
  const [theme, setTheme] = useState<QuizTheme>("neon");
  const [resultType, setResultType] = useState<QuizResultType>("ranking");
  const [timePerQuestion, setTimePerQuestion] = useState("45");
  const [gradeWeight, setGradeWeight] = useState("10");
  const [rawQuestions, setRawQuestions] = useState("");

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [templates, setTemplates] = useState<QuizTemplate[]>([]);
  const [questionsByQuiz, setQuestionsByQuiz] = useState<
    Record<string, QuizQuestion[]>
  >({});
  const [questionsByTemplate, setQuestionsByTemplate] = useState<
    Record<string, QuizTemplateQuestion[]>
  >({});
  const [participantsByQuiz, setParticipantsByQuiz] = useState<
    Record<string, QuizParticipant[]>
  >({});
  const [answersByQuiz, setAnswersByQuiz] = useState<
    Record<string, QuizAnswer[]>
  >({});
  const [attemptsByQuiz, setAttemptsByQuiz] = useState<
    Record<string, QuizAttempt[]>
  >({});
  const [studentNamesById, setStudentNamesById] = useState<
    Record<string, string>
  >({});

  const [search, setSearch] = useState("");
  const [quizClassFilter, setQuizClassFilter] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templateTargetClassId, setTemplateTargetClassId] = useState("");
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [message, setMessage] = useState<Message | null>(null);
  const [now, setNow] = useState(Date.now());

  const parsedQuestions = useMemo(() => {
    return parseQuizText(rawQuestions);
  }, [rawQuestions]);

  const shouldNeedClass = creationTarget !== "template-only";
  const shouldSaveTemplate = creationTarget !== "class-only";
  const shouldGenerateGrade = mode === "assignment" || resultType === "grade";

  const assignmentQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => quiz.mode !== "live");
  }, [quizzes]);

  const liveQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => quiz.mode === "live");
  }, [quizzes]);

  const filteredAssignmentQuizzes = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return assignmentQuizzes.filter((quiz) => {
      if (quizClassFilter && quiz.class_id !== quizClassFilter) {
        return false;
      }

      if (!normalizedSearch) return true;

      const className = getClassNameById(classes, quiz.class_id);

      return normalizeText(
        `${quiz.title} ${quiz.description ?? ""} ${className} ${quiz.status}`
      ).includes(normalizedSearch);
    });
  }, [assignmentQuizzes, search, classes, quizClassFilter]);

  const filteredLiveQuizzes = useMemo(() => {
    const normalizedSearch = normalizeText(search);

    return liveQuizzes.filter((quiz) => {
      if (quizClassFilter && quiz.class_id !== quizClassFilter) {
        return false;
      }

      if (!normalizedSearch) return true;

      const className = getClassNameById(classes, quiz.class_id);

      return normalizeText(
        `${quiz.title} ${quiz.description ?? ""} ${className} ${quiz.status}`
      ).includes(normalizedSearch);
    });
  }, [liveQuizzes, search, classes, quizClassFilter]);

  const filteredTemplates = useMemo(() => {
    const normalizedSearch = normalizeText(templateSearch);
    const activeTemplates = templates.filter((template) => !template.archived_at);

    if (!normalizedSearch) return activeTemplates;

    return activeTemplates.filter((template) =>
      normalizeText(
        `${template.title} ${template.description ?? ""} ${
          template.category ?? ""
        } ${template.mode ?? ""}`
      ).includes(normalizedSearch)
    );
  }, [templates, templateSearch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

    const { data: studentsData, error: studentsError } = await supabase
      .from("students")
      .select("id, name");

    if (!studentsError) {
      const studentsMap: Record<string, string> = {};

      ((studentsData as StudentItem[] | null) ?? []).forEach((student) => {
        studentsMap[String(student.id)] = String(
          student.name ?? "Aluno sem nome"
        );
      });

      setStudentNamesById(studentsMap);
    }

    if (quizIds.length === 0) {
      setQuestionsByQuiz({});
      setParticipantsByQuiz({});
      setAnswersByQuiz({});
      setAttemptsByQuiz({});
      return;
    }

    const [
      questionsResponse,
      participantsResponse,
      answersResponse,
      attemptsResponse,
    ] = await Promise.all([
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

      supabase.from("quiz_attempts").select("*").in("quiz_id", quizIds),
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

      ((answersResponse.data as QuizAnswer[] | null) ?? []).forEach((answer) => {
        if (!groupedAnswers[answer.quiz_id]) {
          groupedAnswers[answer.quiz_id] = [];
        }

        groupedAnswers[answer.quiz_id].push(answer);
      });

      setAnswersByQuiz(groupedAnswers);
    }

    if (!attemptsResponse.error) {
      const groupedAttempts: Record<string, QuizAttempt[]> = {};

      ((attemptsResponse.data as QuizAttempt[] | null) ?? []).forEach(
        (attempt) => {
          if (!groupedAttempts[attempt.quiz_id]) {
            groupedAttempts[attempt.quiz_id] = [];
          }

          groupedAttempts[attempt.quiz_id].push(attempt);
        }
      );

      setAttemptsByQuiz(groupedAttempts);
    }
  }

  async function loadTemplates() {
    const { data, error } = await supabase
      .from("quiz_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setTemplates([]);
      setQuestionsByTemplate({});
      return;
    }

    const loadedTemplates = (data as QuizTemplate[] | null) ?? [];
    setTemplates(loadedTemplates);

    const templateIds = loadedTemplates.map((template) => template.id);

    if (templateIds.length === 0) {
      setQuestionsByTemplate({});
      return;
    }

    const { data: questionsData, error: questionsError } = await supabase
      .from("quiz_template_questions")
      .select("*")
      .in("template_id", templateIds)
      .order("question_order", { ascending: true });

    if (questionsError) {
      console.error(questionsError);
      setQuestionsByTemplate({});
      return;
    }

    const groupedQuestions: Record<string, QuizTemplateQuestion[]> = {};

    ((questionsData as QuizTemplateQuestion[] | null) ?? []).forEach(
      (question) => {
        if (!groupedQuestions[question.template_id]) {
          groupedQuestions[question.template_id] = [];
        }

        groupedQuestions[question.template_id].push(question);
      }
    );

    setQuestionsByTemplate(groupedQuestions);
  }

  async function loadEverything() {
    await Promise.all([loadQuizzes(), loadTemplates()]);
  }

  useEffect(() => {
    loadEverything();

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
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_attempts",
        },
        () => loadQuizzes()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_templates",
        },
        () => loadTemplates()
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "quiz_template_questions",
        },
        () => loadTemplates()
      )
      .subscribe();

    const fallbackPolling = setInterval(() => {
      loadEverything();
    }, 5000);

    return () => {
      clearInterval(fallbackPolling);
      supabase.removeChannel(channel);
    };
  }, []);

  async function createQuizForClass({
    targetClassId,
    quizTitle,
    quizDescription,
    quizMode,
    quizTheme,
    quizResultType,
    quizGradeWeight,
    quizTimePerQuestion,
    questions,
  }: {
    targetClassId: string;
    quizTitle: string;
    quizDescription: string | null;
    quizMode: QuizMode;
    quizTheme: QuizTheme;
    quizResultType: QuizResultType;
    quizGradeWeight: number;
    quizTimePerQuestion: number;
    questions: ParsedQuestion[];
  }) {
    const { data: createdQuiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        class_id: targetClassId,
        title: quizTitle,
        description: quizDescription,
        mode: quizMode,
        theme: quizTheme,
        result_type: quizMode === "live" ? quizResultType : "grade",
        status: quizMode === "live" ? "waiting" : "active",
        total_questions: questions.length,
        grade_weight: quizGradeWeight,
        time_per_question: quizTimePerQuestion,
        current_question_order: 0,
        current_question_started_at: null,
        archived_at: null,
      })
      .select("id")
      .single();

    if (quizError || !createdQuiz?.id) {
      throw quizError || new Error("Não foi possível criar o quiz.");
    }

    const questionRows = questions.map((question, index) => ({
      quiz_id: String(createdQuiz.id),
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

    return String(createdQuiz.id);
  }

  async function saveQuizTemplate({
    templateTitle,
    templateDescription,
    category,
    templateMode,
    templateTheme,
    templateResultType,
    templateGradeWeight,
    templateTimePerQuestion,
    questions,
  }: {
    templateTitle: string;
    templateDescription: string | null;
    category: string | null;
    templateMode: QuizMode;
    templateTheme: QuizTheme;
    templateResultType: QuizResultType;
    templateGradeWeight: number;
    templateTimePerQuestion: number;
    questions: ParsedQuestion[];
  }) {
    const { data: createdTemplate, error: templateError } = await supabase
      .from("quiz_templates")
      .insert({
        title: templateTitle,
        description: templateDescription,
        category,
        mode: templateMode,
        theme: templateTheme,
        result_type: templateMode === "live" ? templateResultType : "grade",
        total_questions: questions.length,
        grade_weight: templateGradeWeight,
        time_per_question: templateTimePerQuestion,
        archived_at: null,
      })
      .select("id")
      .single();

    if (templateError || !createdTemplate?.id) {
      throw templateError || new Error("Não foi possível salvar o modelo.");
    }

    const questionRows = questions.map((question, index) => ({
      template_id: String(createdTemplate.id),
      question_order: index + 1,
      question_text: question.questionText,
      options: question.options,
      correct_option_id: question.correctOptionId,
    }));

    const { error: questionsError } = await supabase
      .from("quiz_template_questions")
      .insert(questionRows);

    if (questionsError) {
      throw questionsError;
    }

    return String(createdTemplate.id);
  }

  async function handleCreateQuiz() {
    setMessage(null);

    if (shouldNeedClass && !classId) {
      setMessage({
        type: "error",
        text: "Selecione a turma para criar o quiz.",
      });
      return;
    }

    if (!title.trim()) {
      setMessage({
        type: "error",
        text: "Informe o título do quiz.",
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
    const numericWeight = shouldGenerateGrade ? Number(gradeWeight) : 0;

    if (!Number.isFinite(numericTime) || numericTime < 10) {
      setMessage({
        type: "error",
        text: "Informe um tempo válido por pergunta.",
      });
      return;
    }

    if (
      shouldGenerateGrade &&
      (!Number.isFinite(numericWeight) || numericWeight <= 0)
    ) {
      setMessage({
        type: "error",
        text: "Informe um valor válido para a nota.",
      });
      return;
    }

    setCreating(true);

    try {
      if (shouldNeedClass) {
        await createQuizForClass({
          targetClassId: classId,
          quizTitle: title.trim(),
          quizDescription: description.trim() || null,
          quizMode: mode,
          quizTheme: theme,
          quizResultType: resultType,
          quizGradeWeight: numericWeight,
          quizTimePerQuestion: numericTime,
          questions: parsedQuestions,
        });
      }

      if (shouldSaveTemplate) {
        await saveQuizTemplate({
          templateTitle: title.trim(),
          templateDescription: description.trim() || null,
          category: templateCategory.trim() || null,
          templateMode: mode,
          templateTheme: theme,
          templateResultType: resultType,
          templateGradeWeight: numericWeight,
          templateTimePerQuestion: numericTime,
          questions: parsedQuestions,
        });
      }

      const resultText =
        creationTarget === "class-only"
          ? `Quiz criado para a turma com ${parsedQuestions.length} pergunta(s).`
          : creationTarget === "class-and-template"
          ? `Quiz criado para a turma e salvo no banco de quizzes para reutilização.`
          : `Quiz salvo no banco de quizzes. Agora ele pode ser usado em qualquer turma.`;

      setMessage({
        type: "success",
        text: resultText,
      });

      setClassId("");
      setTitle("");
      setDescription("");
      setTemplateCategory("Revisão");
      setMode("assignment");
      setTheme("neon");
      setResultType("ranking");
      setTimePerQuestion("45");
      setGradeWeight("10");
      setRawQuestions("");
      setCreationTarget("class-only");

      await loadEverything();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao criar quiz: ${getErrorMessage(error)}`,
      });
    } finally {
      setCreating(false);
    }
  }

  async function handleUseTemplate(template: QuizTemplate) {
    setMessage(null);

    if (!templateTargetClassId) {
      setMessage({
        type: "error",
        text: "Selecione a turma que receberá o quiz salvo.",
      });
      return;
    }

    const templateQuestions = questionsByTemplate[template.id] ?? [];

    if (templateQuestions.length === 0) {
      setMessage({
        type: "error",
        text: "Este modelo não possui perguntas salvas.",
      });
      return;
    }

    setActionLoadingId(template.id);

    try {
      const templateMode = template.mode === "live" ? "live" : "assignment";
      const templateResultType =
        template.result_type === "ranking" ? "ranking" : "grade";
      const templateTheme = ["neon", "arcade", "energy", "classic"].includes(
        String(template.theme)
      )
        ? (template.theme as QuizTheme)
        : "neon";

      await createQuizForClass({
        targetClassId: templateTargetClassId,
        quizTitle: template.title,
        quizDescription: template.description,
        quizMode: templateMode,
        quizTheme: templateTheme,
        quizResultType: templateResultType,
        quizGradeWeight: Number(template.grade_weight ?? 10),
        quizTimePerQuestion: Number(template.time_per_question ?? 45),
        questions: templateQuestions.map((question, index) =>
          normalizeTemplateQuestion(question, index + 1)
        ),
      });

      setMessage({
        type: "success",
        text: `Quiz "${template.title}" aplicado à turma ${getClassNameById(
          classes,
          templateTargetClassId
        )}.`,
      });

      await loadQuizzes();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao usar quiz salvo: ${getErrorMessage(error)}`,
      });
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleSaveExistingQuizAsTemplate(quiz: Quiz) {
    const questions = questionsByQuiz[quiz.id] ?? [];

    if (questions.length === 0) {
      setMessage({
        type: "error",
        text: "Este quiz não possui perguntas carregadas para salvar como modelo.",
      });
      return;
    }

    const confirmed = window.confirm(
      `Salvar "${quiz.title}" no banco de quizzes para reutilizar em outras turmas?`
    );

    if (!confirmed) return;

    setActionLoadingId(`template-${quiz.id}`);
    setMessage(null);

    try {
      await saveQuizTemplate({
        templateTitle: quiz.title,
        templateDescription: quiz.description,
        category: "Importado de turma",
        templateMode: quiz.mode === "live" ? "live" : "assignment",
        templateTheme: ["neon", "arcade", "energy", "classic"].includes(
          String(quiz.theme)
        )
          ? (quiz.theme as QuizTheme)
          : "neon",
        templateResultType: quiz.result_type === "ranking" ? "ranking" : "grade",
        templateGradeWeight: Number(quiz.grade_weight ?? 10),
        templateTimePerQuestion: Number(quiz.time_per_question ?? 45),
        questions: questions.map((question) => ({
          questionText: question.question_text,
          options: question.options,
          correctOptionId: question.correct_option_id,
        })),
      });

      setMessage({
        type: "success",
        text: "Quiz salvo no banco de quizzes para reutilização.",
      });

      await loadTemplates();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao salvar modelo: ${getErrorMessage(error)}`,
      });
    } finally {
      setActionLoadingId("");
    }
  }

  async function handleArchiveTemplate(template: QuizTemplate) {
    const confirmed = window.confirm(
      "Arquivar este quiz salvo? Ele deixará de aparecer no banco de uso rápido."
    );

    if (!confirmed) return;

    setActionLoadingId(template.id);
    setMessage(null);

    const { error } = await supabase
      .from("quiz_templates")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", template.id);

    setActionLoadingId("");

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao arquivar modelo: ${error.message}`,
      });
      return;
    }

    await loadTemplates();
  }

  async function handleDeleteTemplate(template: QuizTemplate) {
    const confirmed = window.confirm(
      "Excluir definitivamente este quiz salvo do banco? Os quizzes já aplicados às turmas não serão removidos."
    );

    if (!confirmed) return;

    setActionLoadingId(template.id);
    setMessage(null);

    const { error } = await supabase
      .from("quiz_templates")
      .delete()
      .eq("id", template.id);

    setActionLoadingId("");

    if (error) {
      setMessage({
        type: "error",
        text: `Erro ao excluir modelo: ${error.message}`,
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Quiz salvo excluído do banco de modelos.",
    });

    await loadTemplates();
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
      current_question_started_at: new Date().toISOString(),
    });
  }

  async function handleRestartQuestionTimer(quiz: Quiz) {
    await updateQuizStatus(quiz, {
      current_question_started_at: new Date().toISOString(),
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
      current_question_started_at: new Date().toISOString(),
    });
  }

  async function handleFinishQuiz(quiz: Quiz) {
    await updateQuizStatus(quiz, {
      status: "finished",
      live_finished_at: new Date().toISOString(),
    });
  }

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
      "Excluir este quiz definitivamente? As perguntas, participantes, respostas e notas geradas por este quiz serão removidas da média dos alunos."
    );

    if (!confirmed) return;

    setActionLoadingId(quiz.id);
    setMessage(null);

    try {
      const affectedStudentIds = new Set<string>();

      const [attemptsResponse, answersResponse, participantsResponse] =
        await Promise.all([
          supabase
            .from("quiz_attempts")
            .select("student_id")
            .eq("quiz_id", quiz.id),
          supabase
            .from("quiz_answers")
            .select("student_id")
            .eq("quiz_id", quiz.id),
          supabase
            .from("quiz_participants")
            .select("student_id")
            .eq("quiz_id", quiz.id),
        ]);

      if (attemptsResponse.error) throw attemptsResponse.error;
      if (answersResponse.error) throw answersResponse.error;
      if (participantsResponse.error) throw participantsResponse.error;

      attemptsResponse.data?.forEach((item) => {
        if (item.student_id) affectedStudentIds.add(String(item.student_id));
      });

      answersResponse.data?.forEach((item) => {
        if (item.student_id) affectedStudentIds.add(String(item.student_id));
      });

      participantsResponse.data?.forEach((item) => {
        if (item.student_id) affectedStudentIds.add(String(item.student_id));
      });

      const { error: linkedGradesError } = await supabase
        .from("grades")
        .delete()
        .eq("source_type", "quiz")
        .eq("source_id", quiz.id);

      if (linkedGradesError) throw linkedGradesError;

      const affectedIds = Array.from(affectedStudentIds);

      if (affectedIds.length > 0) {
        const { error: legacyGradesError } = await supabase
          .from("grades")
          .delete()
          .eq("title", `Quiz: ${quiz.title}`)
          .is("source_type", null)
          .in("student_id", affectedIds);

        if (legacyGradesError) throw legacyGradesError;
      }

      const { error: deleteQuizError } = await supabase
        .from("quizzes")
        .delete()
        .eq("id", quiz.id);

      if (deleteQuizError) throw deleteQuizError;

      await Promise.all(
        affectedIds.map((studentId) => recalculateStudentAverage(studentId))
      );

      setMessage({
        type: "success",
        text: "Quiz excluído. As notas geradas por ele foram removidas e as médias dos alunos foram recalculadas.",
      });

      await loadQuizzes();
    } catch (error) {
      setMessage({
        type: "error",
        text: `Erro ao excluir quiz: ${getErrorMessage(error)}`,
      });
    } finally {
      setActionLoadingId("");
    }
  }

  function getCurrentQuestion(quiz: Quiz) {
    const questions = questionsByQuiz[quiz.id] ?? [];
    const currentOrder = quiz.current_question_order ?? 0;

    return questions.find(
      (question) => question.question_order === currentOrder
    );
  }

  function getCurrentQuestionAnswers(quiz: Quiz) {
    const currentQuestion = getCurrentQuestion(quiz);
    const answers = answersByQuiz[quiz.id] ?? [];

    if (!currentQuestion) return [];

    return answers.filter(
      (answer) => answer.question_id === currentQuestion.id
    );
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
          answeredQuestions: participantAnswers.length,
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
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-6 shadow-2xl shadow-slate-950/40">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[28px] bg-fuchsia-500/15 p-4 text-fuchsia-300 shadow-lg shadow-fuchsia-500/10">
              <Gamepad2 size={36} />
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-4 py-2 text-xs font-black uppercase tracking-wide text-fuchsia-100">
                <Sparkles className="h-4 w-4" />
                Criador de Quiz
              </div>

              <h2 className="mt-4 text-3xl font-black text-white">
                Crie para uma turma ou salve no banco
              </h2>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Agora você pode criar um quiz apenas para a turma atual, criar e
                salvar como modelo, ou salvar somente no banco para usar em
                qualquer turma depois.
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-950/60 p-4 xl:w-[360px]">
            <p className="text-sm font-bold text-white">Formato das perguntas</p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Pergunta, resposta correta e três respostas erradas. A primeira
              resposta de cada bloco será tratada como correta e as alternativas
              serão embaralhadas.
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

        <div className="mt-7 grid gap-5">
          <div className="grid gap-3 xl:grid-cols-3">
            <button
              type="button"
              onClick={() => setCreationTarget("class-only")}
              className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-1 ${
                creationTarget === "class-only"
                  ? "border-cyan-300 bg-cyan-500/15 shadow-xl shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-950/50 hover:border-cyan-500/40"
              }`}
            >
              <p className="font-black text-white">Criar só para a turma</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Uso direto, sem guardar no banco de modelos.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCreationTarget("class-and-template")}
              className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-1 ${
                creationTarget === "class-and-template"
                  ? "border-emerald-300 bg-emerald-500/15 shadow-xl shadow-emerald-500/10"
                  : "border-slate-800 bg-slate-950/50 hover:border-emerald-500/40"
              }`}
            >
              <p className="font-black text-white">Criar e salvar no banco</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Aplica na turma e deixa disponível para outras turmas.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setCreationTarget("template-only")}
              className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-1 ${
                creationTarget === "template-only"
                  ? "border-violet-300 bg-violet-500/15 shadow-xl shadow-violet-500/10"
                  : "border-slate-800 bg-slate-950/50 hover:border-violet-500/40"
              }`}
            >
              <p className="font-black text-white">Salvar só no banco</p>
              <p className="mt-1 text-sm leading-6 text-slate-400">
                Cria um modelo reutilizável, sem enviar para turma agora.
              </p>
            </button>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("assignment")}
              className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-1 ${
                mode === "assignment"
                  ? "border-cyan-300 bg-cyan-500/15 shadow-xl shadow-cyan-500/10"
                  : "border-slate-800 bg-slate-950/50 hover:border-cyan-500/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                  <Layers3 size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    Modo atividade
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    O aluno faz sozinho. Ideal para tarefa, revisão ou atividade
                    em casa. Sempre gera nota.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMode("live")}
              className={`rounded-[24px] border p-4 text-left transition hover:-translate-y-1 ${
                mode === "live"
                  ? "border-fuchsia-300 bg-fuchsia-500/15 shadow-xl shadow-fuchsia-500/10"
                  : "border-slate-800 bg-slate-950/50 hover:border-fuchsia-500/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                  <MonitorPlay size={22} />
                </div>

                <div>
                  <h3 className="text-lg font-black text-white">
                    Modo sala de aula
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-slate-400">
                    Professor conduz ao vivo. Pode ser apenas ranking ou valer
                    nota.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {shouldNeedClass && (
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
            )}

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Título do quiz"
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400"
            />

            {shouldSaveTemplate && (
              <select
                value={templateCategory}
                onChange={(event) => setTemplateCategory(event.target.value)}
                className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
              >
                {templateCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            )}

            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descrição ou orientação para os alunos"
              rows={3}
              className="resize-none rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-fuchsia-400 md:col-span-2"
            />
          </div>

          {mode === "live" && (
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/50 p-4">
              <p className="text-sm font-bold text-white">
                Resultado do quiz sala de aula
              </p>

              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setResultType("ranking")}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${
                    resultType === "ranking"
                      ? "border-yellow-300 bg-yellow-500/15 text-yellow-100"
                      : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-yellow-500/40"
                  }`}
                >
                  <p className="font-black">Apenas ranking</p>
                  <p className="mt-1 text-xs opacity-80">
                    Gera competição, pontos e pódio, sem lançar nota.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setResultType("grade")}
                  className={`rounded-2xl border p-4 text-left transition hover:-translate-y-1 ${
                    resultType === "grade"
                      ? "border-emerald-300 bg-emerald-500/15 text-emerald-100"
                      : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-emerald-500/40"
                  }`}
                >
                  <p className="font-black">Converter em nota</p>
                  <p className="mt-1 text-xs opacity-80">
                    A nota será calculada por acertos proporcionais.
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-[24px] border border-slate-800 bg-slate-950/50 p-4">
              <p className="mb-3 text-sm font-bold text-white">
                Tema visual do aluno
              </p>

              <div className="grid grid-cols-2 gap-2">
                {quizThemes.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTheme(item.value)}
                    className={`rounded-2xl border px-3 py-3 text-left transition hover:-translate-y-0.5 ${
                      theme === item.value
                        ? item.classes
                        : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-slate-600"
                    }`}
                  >
                    <p className="text-sm font-black">{item.label}</p>
                    <p className="mt-0.5 text-[11px] opacity-80">
                      {item.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-800 bg-slate-950/50 p-4">
              <p className="mb-3 text-sm font-bold text-white">Tempo e valor</p>

              <div className="grid grid-cols-4 gap-2">
                {timeOptions.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setTimePerQuestion(String(item.value))}
                    className={`rounded-2xl border px-3 py-3 text-center transition ${
                      timePerQuestion === String(item.value)
                        ? "border-yellow-300 bg-yellow-500/15 text-yellow-100"
                        : "border-slate-800 bg-slate-900/70 text-slate-300 hover:border-yellow-500/40"
                    }`}
                  >
                    <p className="text-sm font-black">{item.label}</p>
                  </button>
                ))}
              </div>

              <div className="mt-3">
                <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
                  {shouldGenerateGrade
                    ? "Valor máximo da nota"
                    : "Sem nota neste quiz"}
                </label>

                <input
                  value={gradeWeight}
                  onChange={(event) => setGradeWeight(event.target.value)}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  disabled={!shouldGenerateGrade}
                  placeholder="Ex.: 1, 2, 5 ou 10"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-yellow-400 disabled:cursor-not-allowed disabled:opacity-40"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <textarea
              value={rawQuestions}
              onChange={(event) => setRawQuestions(event.target.value)}
              placeholder={`Cole as perguntas assim:\n\nQual é a capital do Brasil?\nBrasília\nRio de Janeiro\nSão Paulo\nSalvador\n\nQuanto é 2 + 2?\n4\n3\n5\n6`}
              rows={15}
              className="resize-none rounded-[24px] border border-slate-700 bg-slate-950 px-5 py-4 font-mono text-sm outline-none focus:border-fuchsia-400"
            />

            <div className="rounded-[24px] border border-fuchsia-500/20 bg-fuchsia-500/10 p-5">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-fuchsia-300" size={22} />

                <div>
                  <h3 className="font-bold text-white">Prévia automática</h3>

                  <p className="text-sm text-slate-400">
                    Perguntas identificadas: {" "}
                    <strong className="text-fuchsia-200">
                      {parsedQuestions.length}
                    </strong>
                  </p>
                </div>
              </div>

              {parsedQuestions.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 text-sm text-slate-400">
                  Cole pelo menos uma pergunta com quatro alternativas para ver
                  a prévia.
                </div>
              ) : (
                <div className="mt-4 max-h-[430px] space-y-3 overflow-y-auto pr-2">
                  {parsedQuestions.map((question, index) => (
                    <div
                      key={`${question.questionText}-${index}`}
                      className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                    >
                      <p className="font-semibold text-white">
                        {index + 1}. {question.questionText}
                      </p>

                      <div className="mt-3 grid gap-2">
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
          </div>

          <button
            type="button"
            onClick={handleCreateQuiz}
            disabled={creating}
            className="group flex w-full items-center justify-center gap-3 rounded-[24px] bg-gradient-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-6 py-5 text-xl font-black text-white shadow-2xl shadow-fuchsia-500/20 transition hover:-translate-y-1 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {creating ? (
              <Loader2 className="animate-spin" size={24} />
            ) : creationTarget === "template-only" ? (
              <Database size={24} />
            ) : creationTarget === "class-and-template" ? (
              <PlusCircle size={24} />
            ) : (
              <Save size={24} />
            )}

            {creating
              ? "Processando..."
              : creationTarget === "template-only"
              ? "Salvar quiz no banco"
              : creationTarget === "class-and-template"
              ? "Criar na turma e salvar no banco"
              : "Criar quiz para turma"}
          </button>
        </div>
      </section>

      <section className="rounded-[32px] border border-violet-500/20 bg-violet-500/10 p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-[28px] bg-violet-500/15 p-4 text-violet-200">
              <Database size={32} />
            </div>

            <div>
              <h2 className="text-2xl font-black text-white">
                Banco de quizzes salvos
              </h2>

              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                Use um quiz pronto em qualquer turma. O modelo fica guardado e
                cada aplicação cria uma cópia independente para a turma escolhida.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:w-[560px]">
            <select
              value={templateTargetClassId}
              onChange={(event) => setTemplateTargetClassId(event.target.value)}
              className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-violet-400"
            >
              <option value="">Turma que receberá o quiz</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
              <Search size={18} className="text-slate-500" />
              <input
                value={templateSearch}
                onChange={(event) => setTemplateSearch(event.target.value)}
                placeholder="Pesquisar no banco..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {filteredTemplates.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400 xl:col-span-2">
              Nenhum quiz salvo no banco ainda. Crie um quiz acima usando a
              opção “Criar e salvar no banco” ou “Salvar só no banco”.
            </div>
          ) : (
            filteredTemplates.map((template) => {
              const questions = questionsByTemplate[template.id] ?? [];
              const loadingThis = actionLoadingId === template.id;

              return (
                <div
                  key={template.id}
                  className="rounded-3xl border border-slate-800 bg-slate-950/50 p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-200">
                          {template.category || "Sem categoria"}
                        </span>
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-300">
                          {getModeLabel(template.mode)}
                        </span>
                        <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-200">
                          {getResultTypeLabel(
                            template.result_type,
                            template.mode
                          )}
                        </span>
                      </div>

                      <h3 className="mt-3 text-lg font-black text-white">
                        {template.title}
                      </h3>

                      {template.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-slate-400">
                          {template.description}
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-violet-400/20 bg-violet-500/10 px-4 py-3 text-center">
                      <p className="text-2xl font-black text-white">
                        {questions.length}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-violet-200">
                        questões
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-400">
                    <span>Criado em {formatDate(template.created_at)}</span>
                    <span>•</span>
                    <span>{template.time_per_question ?? 45}s por pergunta</span>
                    <span>•</span>
                    <span>Nota máx.: {template.grade_weight ?? 10}</span>
                  </div>

                  {questions.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Prévia
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm font-semibold text-slate-200">
                        {questions[0].question_text}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
                    <button
                      type="button"
                      onClick={() => handleUseTemplate(template)}
                      disabled={loadingThis}
                      className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50 lg:col-span-2"
                    >
                      {loadingThis ? (
                        <Loader2 className="animate-spin" size={15} />
                      ) : (
                        <Copy size={15} />
                      )}
                      Usar nesta turma
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchiveTemplate(template)}
                      disabled={loadingThis}
                      className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3 py-2 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
                    >
                      <Archive size={15} />
                      Arquivar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(template)}
                      disabled={loadingThis}
                      className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
                    >
                      <Trash2 size={15} />
                      Excluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-800 bg-slate-900/60 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 lg:flex-1">
            <h2 className="text-lg font-black text-white">
              Localizar quizzes realizados
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Pesquise por palavra-chave ou selecione uma turma.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[640px]">
            <select
              value={quizClassFilter}
              onChange={(event) => setQuizClassFilter(event.target.value)}
              className="min-w-0 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400"
            >
              <option value="">Todas as turmas</option>
              {classes.map((classItem) => (
                <option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </option>
              ))}
            </select>

            <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
              <Search size={18} className="shrink-0 text-slate-500" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Título, turma ou palavra-chave..."
                className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-cyan-200">
            {filteredAssignmentQuizzes.length} atividade(s)
          </span>
          <span className="rounded-full bg-fuchsia-500/10 px-3 py-1 text-fuchsia-200">
            {filteredLiveQuizzes.length} sala(s) de aula
          </span>
          {(search || quizClassFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setQuizClassFilter("");
              }}
              className="rounded-full border border-slate-700 px-3 py-1 text-slate-300 transition hover:bg-slate-800"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <QuizListPanel
          title="Quizzes atividade"
          description="O aluno responde sozinho, sem condução do professor."
          icon={<Layers3 size={26} className="text-cyan-300" />}
          tone="cyan"
          emptyText="Nenhum quiz atividade encontrado."
          hideSearch
          search={search}
          setSearch={setSearch}
        >
          {filteredAssignmentQuizzes.map((quiz) => {
            const attempts = attemptsByQuiz[quiz.id] ?? [];
            const questions = questionsByQuiz[quiz.id] ?? [];
            const className = getClassNameById(classes, quiz.class_id);
            const loadingThis = actionLoadingId === quiz.id;

            return (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                classNameLabel={className}
                questionsCount={questions.length}
                loadingThis={loadingThis}
                onArchive={() => handleArchiveQuiz(quiz)}
                onDelete={() => handleDeleteQuiz(quiz)}
                onSaveTemplate={() => handleSaveExistingQuizAsTemplate(quiz)}
              >
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <MetricCard label="Responderam" value={attempts.length} />
                  <MetricCard label="Nota máxima" value={quiz.grade_weight ?? 10} />
                  <MetricCard label="Modo" value="Autônomo" small />
                </div>

                {attempts.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="text-sm font-bold text-emerald-200">
                      Últimas notas registradas
                    </p>

                    <div className="mt-3 space-y-2">
                      {attempts.slice(0, 5).map((attempt) => {
                        const studentName =
                          studentNamesById[attempt.student_id] ??
                          "Aluno sem nome";

                        return (
                          <div
                            key={attempt.id}
                            className="flex items-center justify-between rounded-xl bg-slate-950/50 px-3 py-2 text-sm"
                          >
                            <span className="truncate text-slate-300">
                              {studentName}
                            </span>
                            <strong className="text-emerald-200">
                              {Number(attempt.score ?? 0).toFixed(1)}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </QuizCard>
            );
          })}
        </QuizListPanel>

        <QuizListPanel
          title="Quizzes sala de aula"
          description="Professor conduz ao vivo com alunos conectados."
          icon={<MonitorPlay size={26} className="text-fuchsia-300" />}
          tone="fuchsia"
          emptyText="Nenhum quiz sala de aula encontrado."
          hideSearch
          search={search}
          setSearch={setSearch}
        >
          {filteredLiveQuizzes.map((quiz) => {
            const className = getClassNameById(classes, quiz.class_id);
            const questions = questionsByQuiz[quiz.id] ?? [];
            const participants = participantsByQuiz[quiz.id] ?? [];
            const ranking = getRanking(quiz);
            const loadingThis = actionLoadingId === quiz.id;
            const currentQuestion = getCurrentQuestion(quiz);
            const currentAnswers = getCurrentQuestionAnswers(quiz);
            const answeredStudentCount = new Set(
              currentAnswers.map((answer) => answer.student_id)
            ).size;
            const remainingSeconds = getRemainingSeconds(quiz, now);
            const timerPercent = getTimerPercent(quiz, now);
            const totalQuestions = quiz.total_questions ?? questions.length;
            const currentOrder = quiz.current_question_order ?? 0;

            return (
              <QuizCard
                key={quiz.id}
                quiz={quiz}
                classNameLabel={className}
                questionsCount={questions.length}
                loadingThis={loadingThis}
                onArchive={() => handleArchiveQuiz(quiz)}
                onDelete={() => handleDeleteQuiz(quiz)}
                onSaveTemplate={() => handleSaveExistingQuizAsTemplate(quiz)}
              >
                <div className="mt-4 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-4">
                  {quiz.status === "waiting" && (
                    <div>
                      <div className="flex items-center gap-2 text-sm font-bold text-fuchsia-100">
                        <Users size={16} />
                        Sala aberta para entrada dos alunos
                      </div>

                      {participants.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-400">
                          Nenhum aluno entrou ainda.
                        </p>
                      ) : (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {participants.map((participant) => (
                            <span
                              key={participant.id}
                              className="rounded-full border border-fuchsia-400/20 bg-slate-950/60 px-3 py-2 text-xs font-bold text-fuchsia-100"
                            >
                              {participant.emoji || "🚀"} {" "}
                              {participant.nickname || participant.student_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {quiz.status === "live" && (
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-fuchsia-100">
                            Pergunta atual: {" "}
                            <strong>
                              {currentOrder}/{totalQuestions}
                            </strong>
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Responderam: {" "}
                            <strong className="text-white">
                              {answeredStudentCount}/{participants.length}
                            </strong>
                          </p>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-center">
                          <Clock3 className="mx-auto h-5 w-5 text-yellow-300" />
                          <p className="mt-1 text-xl font-black text-white">
                            {remainingSeconds}s
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            remainingSeconds <= 10 ? "bg-red-500" : "bg-fuchsia-400"
                          }`}
                          style={{ width: `${timerPercent}%` }}
                        />
                      </div>

                      {currentQuestion && (
                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                          <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-200">
                            Pergunta liberada
                          </p>
                          <p className="mt-2 text-sm font-semibold text-white">
                            {currentQuestion.question_text}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {quiz.status === "finished" && (
                    <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/10 p-4">
                      <p className="font-bold text-yellow-100">
                        Quiz finalizado. Ranking disponível para os alunos.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {quiz.status === "waiting" && (
                      <button
                        type="button"
                        onClick={() => handleStartLiveQuiz(quiz)}
                        disabled={loadingThis}
                        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
                      >
                        <Play size={15} />
                        Iniciar quiz
                      </button>
                    )}

                    {quiz.status === "live" && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleNextQuestion(quiz)}
                          disabled={loadingThis}
                          className="flex items-center justify-center gap-2 rounded-xl bg-fuchsia-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-fuchsia-400 disabled:opacity-50"
                        >
                          <ChevronRight size={15} />
                          {currentOrder >= totalQuestions ? "Finalizar" : "Próxima"}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRestartQuestionTimer(quiz)}
                          disabled={loadingThis}
                          className="flex items-center justify-center gap-2 rounded-xl bg-blue-500 px-3 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:opacity-50"
                        >
                          <RefreshCw size={15} />
                          Reiniciar tempo
                        </button>

                        <button
                          type="button"
                          onClick={() => handleFinishQuiz(quiz)}
                          disabled={loadingThis}
                          className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3 py-3 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50 sm:col-span-2"
                        >
                          Finalizar quiz agora
                        </button>
                      </>
                    )}
                  </div>
                </div>

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
                              : `${index + 1}º`} {" "}
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
              </QuizCard>
            );
          })}
        </QuizListPanel>
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  small,
}: {
  label: string;
  value: string | number;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p
        className={`mt-1 font-black text-white ${
          small ? "text-sm text-cyan-200" : "text-2xl"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function QuizListPanel({
  title,
  description,
  icon,
  tone,
  emptyText,
  search,
  setSearch,
  hideSearch,
  children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  tone: "cyan" | "fuchsia";
  emptyText: string;
  search: string;
  setSearch: (value: string) => void;
  hideSearch?: boolean;
  children: ReactNode;
}) {
  const border = tone === "cyan" ? "border-cyan-500/20" : "border-fuchsia-500/20";
  const background = tone === "cyan" ? "bg-cyan-500/10" : "bg-fuchsia-500/10";

  return (
    <div className={`rounded-[32px] border ${border} ${background} p-6`}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <h2 className="text-2xl font-black text-white">{title}</h2>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </div>

      {!hideSearch && (
        <div className="mt-5 flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar quiz..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-500"
          />
        </div>
      )}

      <div className="mt-5 space-y-4">
        {Array.isArray(children) && children.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-400">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function QuizCard({
  quiz,
  classNameLabel,
  questionsCount,
  loadingThis,
  onArchive,
  onDelete,
  onSaveTemplate,
  children,
}: {
  quiz: Quiz;
  classNameLabel: string;
  questionsCount: number;
  loadingThis: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onSaveTemplate: () => void;
  children: ReactNode;
}) {
  const shouldStartExpanded =
    quiz.mode === "live" &&
    (quiz.status === "waiting" || quiz.status === "live");

  const [expanded, setExpanded] = useState(shouldStartExpanded);
  const createdDate = formatDate(quiz.created_at);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/50 transition hover:border-slate-700">
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        className="flex w-full min-w-0 items-center gap-3 px-3 py-3 text-left sm:px-4"
      >
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            quiz.mode === "live"
              ? "bg-fuchsia-500/15 text-fuchsia-300"
              : "bg-cyan-500/15 text-cyan-300"
          }`}
        >
          <Rocket size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <h3 className="truncate text-sm font-black text-white sm:text-base">
              {quiz.title}
            </h3>

            <span className="w-fit shrink-0 rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-slate-300">
              {classNameLabel}
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500 sm:text-xs">
            <span
              className={
                quiz.mode === "live" ? "text-fuchsia-300" : "text-cyan-300"
              }
            >
              {getModeLabel(quiz.mode)}
            </span>
            <span>{getStatusLabel(quiz.status)}</span>
            <span>{questionsCount} pergunta(s)</span>
            {createdDate && <span>{createdDate}</span>}
          </div>
        </div>

        <ChevronRight
          size={20}
          className={`shrink-0 text-slate-400 transition-transform ${
            expanded ? "rotate-90" : ""
          }`}
        />
      </button>

      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 sm:px-5">
          {children}

          <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-3">
            <button
              type="button"
              onClick={onSaveTemplate}
              disabled={loadingThis}
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-violet-400 disabled:opacity-50"
            >
              <Database size={15} />
              Salvar modelo
            </button>

            <button
              type="button"
              onClick={onArchive}
              disabled={loadingThis || quiz.status === "archived"}
              className="flex items-center justify-center gap-2 rounded-xl bg-yellow-500 px-3 py-2 text-sm font-bold text-black transition hover:bg-yellow-400 disabled:opacity-50"
            >
              <Archive size={15} />
              Arquivar
            </button>

            <button
              type="button"
              onClick={onDelete}
              disabled={loadingThis}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
            >
              <Trash2 size={15} />
              Excluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
