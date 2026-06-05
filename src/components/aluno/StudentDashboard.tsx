"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CalendarCheck,
  Trophy,
  MessageCircle,
  BookOpen,
  Zap,
  ArrowRight,
  Users,
  ExternalLink,
  Link2,
  UserRound,
  Clock3,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Save,
  X,
  PartyPopper,
} from "lucide-react";

import StudentSidebar from "./StudentSidebar";
import StudentHeader from "./StudentHeader";
import StudentMobileNav from "./StudentMobileNav";
import StudentRealtimeNotifications from "./StudentRealtimeNotifications";

import { supabase } from "@/lib/supabase";
import { getStudentTheme } from "@/lib/studentThemes";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
  mustChangePin?: boolean;
  loggedAt: string;
};

type StudentData = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  class_id: string | null;
  class_name: string | null;
  average: number | null;
  attendance: number | null;
  status: string | null;
  course_name: string | null;
  portal_pin: string | null;
  must_change_pin: boolean | null;
  birth_date: string | null;
};

type DashboardStats = {
  messages: number;
  activities: number;
  grades: number;
};

type PortalButton = {
  id: string;
  button_order: number | null;
  button_label: string | null;
  button_url: string | null;
  is_temporary?: boolean;
};

type TemporaryButton = {
  id: string;
  button_label: string | null;
  button_url: string | null;
};

type DrawResult = {
  id: string;
  draw_id: string;
  student_id: string;
  student_name: string;
  class_id: string | null;
  class_name: string | null;
  team_number: number | null;
  created_at: string | null;
};

type DrawHistory = {
  id: string;
  draw_type: "student" | "teams";
  class_id: string | null;
  class_name: string | null;
  activity_id: string | null;
  activity_title: string | null;
  team_size: number | null;
  status: string | null;
  created_at: string | null;
};

type TeamSummary = {
  drawId: string;
  teamNumber: number;
  className: string;
  activityTitle: string | null;
  createdAt: string | null;
  members: DrawResult[];
};

type StudentDrawSummary = {
  drawId: string;
  studentName: string;
  className: string;
  activityTitle: string | null;
  createdAt: string | null;
};

type RecentMessage = {
  id: string;
  content: string | null;
  sender: string | null;
  is_read: boolean | null;
  created_at: string | null;
};

type PendingActivity = {
  id: string;
  title: string | null;
  description: string | null;
  due_date: string | null;
};

type AvailableQuiz = {
  id: string;
  title: string | null;
  mode: string | null;
  status: string | null;
  result_type: string | null;
  total_questions: number | null;
  created_at: string | null;
};

type RecentGrade = {
  id: string;
  title: string | null;
  score: number | string | null;
  date: string | null;
  feedback: string | null;
};

type BirthdayMessage = {
  id: string;
  message: string;
};

type BirthdayInfo = {
  isToday: boolean;
  isInBirthdayWeek: boolean;
  daysUntil: number;
  formattedDate: string;
  message: string;
};

const fallbackBirthdayMessages = [
  "Que seu novo ciclo venha com coragem para aprender, energia para crescer e confiança para construir o futuro que você merece.",
  "Hoje é um dia especial para lembrar que cada fase da vida traz novas chances de evoluir, sonhar e conquistar.",
  "Que sua jornada seja cheia de descobertas, boas escolhas, amizades verdadeiras e motivos para acreditar no seu próprio potencial.",
  "Parabéns pelo seu dia! Que você continue crescendo com criatividade, responsabilidade e vontade de transformar o mundo ao seu redor.",
];

function formatDateTime(value: string | null) {
  if (!value) {
    return "Data não informada";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data não informada";
  }

  return date.toLocaleString("pt-BR");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Sem data";
  }

  const date = new Date(`${value}`.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Sem data";
  }

  return date.toLocaleDateString("pt-BR");
}

function formatShortDate(value: string | null) {
  if (!value) {
    return "Sem prazo";
  }

  const date = new Date(`${value}`.includes("T") ? value : `${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "Sem prazo";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });
}

function formatScore(value: number | string | null) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "-";
  }

  return numericValue.toFixed(1);
}

function getSafeUrl(value: string | null) {
  const url = value?.trim() || "#";

  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  if (url === "#") {
    return url;
  }

  return `https://${url}`;
}

function normalizeText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function normalizePin(value: string) {
  return normalizeText(value).replace(/\s+/g, "");
}

function getDefaultStudentPin(name: string) {
  const firstName = normalizeText(name).split(/\s+/)[0] || "aluno";

  return `${firstName}123`;
}

function getMessagePreview(value: string | null) {
  const text = value?.trim();

  if (!text) {
    return "Você recebeu uma nova mensagem do professor.";
  }

  if (text.length <= 160) {
    return text;
  }

  return `${text.slice(0, 160)}...`;
}

function getQuizStatusLabel(status: string | null) {
  if (status === "waiting") return "Sala aberta";
  if (status === "live") return "Ao vivo";
  if (status === "finished") return "Finalizado";
  if (status === "active") return "Disponível";

  return "Quiz";
}

function getBirthdayInfo(
  birthDate: string | null,
  firstName: string,
  messages: BirthdayMessage[]
): BirthdayInfo | null {
  if (!birthDate) {
    return null;
  }

  const [yearValue, monthValue, dayValue] = birthDate.split("-");

  const month = Number(monthValue);
  const day = Number(dayValue);

  if (!month || !day) {
    return null;
  }

  const today = new Date();
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  let nextBirthday = new Date(today.getFullYear(), month - 1, day);

  if (nextBirthday < todayStart) {
    nextBirthday = new Date(today.getFullYear() + 1, month - 1, day);
  }

  const daysUntil = Math.round(
    (nextBirthday.getTime() - todayStart.getTime()) / 86400000
  );

  const messageSource =
    messages.length > 0
      ? messages.map((item) => item.message)
      : fallbackBirthdayMessages;

  const messageIndex =
    (month * 31 + day + today.getFullYear()) % messageSource.length;

  const formattedDate = new Date(
    2000,
    month - 1,
    day
  ).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
  });

  return {
    isToday: daysUntil === 0,
    isInBirthdayWeek: daysUntil >= 0 && daysUntil <= 7,
    daysUntil,
    formattedDate,
    message: messageSource[messageIndex].replace("{nome}", firstName),
  };
}

export default function StudentDashboard() {
  const router = useRouter();

  const [session, setSession] = useState<StudentSession | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);

  const [stats, setStats] = useState<DashboardStats>({
    messages: 0,
    activities: 0,
    grades: 0,
  });

  const [recentMessage, setRecentMessage] = useState<RecentMessage | null>(
    null
  );
  const [pendingActivity, setPendingActivity] =
    useState<PendingActivity | null>(null);
  const [availableQuiz, setAvailableQuiz] = useState<AvailableQuiz | null>(
    null
  );
  const [recentGrade, setRecentGrade] = useState<RecentGrade | null>(null);
  const [birthdayMessages, setBirthdayMessages] = useState<BirthdayMessage[]>(
    []
  );

  const [portalButtons, setPortalButtons] = useState<PortalButton[]>([]);
  const [teamSummary, setTeamSummary] = useState<TeamSummary | null>(null);
  const [studentDrawSummary, setStudentDrawSummary] =
    useState<StudentDrawSummary | null>(null);

  const [loading, setLoading] = useState(true);

  const [pinFormOpen, setPinFormOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmNewPin, setConfirmNewPin] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinMessage, setPinMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    async function loadStudentInteractions(parsedSession: StudentSession) {
      try {
        const { data: buttonsData, error: buttonsError } = await supabase
          .from("student_portal_buttons")
          .select("id, button_order, button_label, button_url")
          .eq("student_id", parsedSession.studentId)
          .order("button_order", { ascending: true });

        if (buttonsError) {
          console.error("Erro ao carregar botões:", buttonsError.message);
        }

        const individualButtons = (
          (buttonsData as PortalButton[] | null) ?? []
        ).map((button) => ({
          ...button,
          is_temporary: false,
        }));

        let temporaryDashboardButton: PortalButton | null = null;

        const { data: temporaryButtonData, error: temporaryButtonError } =
          await supabase
            .from("class_temporary_buttons")
            .select("id, button_label, button_url")
            .eq("class_id", parsedSession.classId)
            .maybeSingle();

        if (temporaryButtonError) {
          console.error(
            "Erro ao carregar botão temporário:",
            temporaryButtonError.message
          );
        }

        const temporaryButton = temporaryButtonData as TemporaryButton | null;

        if (temporaryButton) {
          temporaryDashboardButton = {
            id: `temporary-${temporaryButton.id}`,
            button_order: 99,
            button_label: temporaryButton.button_label,
            button_url: temporaryButton.button_url,
            is_temporary: true,
          };
        }

        const mergedButtons = temporaryDashboardButton
          ? [...individualButtons, temporaryDashboardButton]
          : individualButtons;

        setPortalButtons(
          mergedButtons.sort((a, b) => {
            const orderA = a.button_order ?? 99;
            const orderB = b.button_order ?? 99;

            return orderA - orderB;
          })
        );

        const { data: resultData, error: resultError } = await supabase
          .from("interaction_draw_results")
          .select(
            "id, draw_id, student_id, student_name, class_id, class_name, team_number, created_at"
          )
          .eq("student_id", parsedSession.studentId)
          .order("created_at", { ascending: false })
          .limit(20);

        if (resultError) {
          console.error("Erro ao carregar sorteios:", resultError.message);
          setTeamSummary(null);
          setStudentDrawSummary(null);
          return;
        }

        const studentResults = (resultData as DrawResult[] | null) ?? [];

        const drawIds = Array.from(
          new Set(studentResults.map((item) => item.draw_id).filter(Boolean))
        );

        if (drawIds.length === 0) {
          setTeamSummary(null);
          setStudentDrawSummary(null);
          return;
        }

        const { data: drawData, error: drawError } = await supabase
          .from("interaction_draws")
          .select(
            "id, draw_type, class_id, class_name, activity_id, activity_title, team_size, status, created_at"
          )
          .in("id", drawIds)
          .eq("status", "active");

        if (drawError) {
          console.error(
            "Erro ao carregar dados dos sorteios:",
            drawError.message
          );
          setTeamSummary(null);
          setStudentDrawSummary(null);
          return;
        }

        const draws = (drawData as DrawHistory[] | null) ?? [];
        const drawById = new Map(draws.map((draw) => [draw.id, draw]));

        const latestTeamResult = studentResults.find((result) => {
          const draw = drawById.get(result.draw_id);

          return draw?.draw_type === "teams" && result.team_number !== null;
        });

        if (latestTeamResult && latestTeamResult.team_number !== null) {
          const { data: membersData, error: membersError } = await supabase
            .from("interaction_draw_results")
            .select(
              "id, draw_id, student_id, student_name, class_id, class_name, team_number, created_at"
            )
            .eq("draw_id", latestTeamResult.draw_id)
            .eq("team_number", latestTeamResult.team_number)
            .order("student_name", { ascending: true });

          if (membersError) {
            console.error("Erro ao carregar equipe:", membersError.message);
            setTeamSummary(null);
          } else {
            const draw = drawById.get(latestTeamResult.draw_id);

            setTeamSummary({
              drawId: latestTeamResult.draw_id,
              teamNumber: latestTeamResult.team_number,
              className:
                draw?.class_name ||
                latestTeamResult.class_name ||
                parsedSession.studentName,
              activityTitle: draw?.activity_title || null,
              createdAt: draw?.created_at || latestTeamResult.created_at,
              members: (membersData as DrawResult[] | null) ?? [],
            });
          }
        } else {
          setTeamSummary(null);
        }

        const latestStudentDrawResult = studentResults.find((result) => {
          const draw = drawById.get(result.draw_id);

          return draw?.draw_type === "student";
        });

        if (latestStudentDrawResult) {
          const draw = drawById.get(latestStudentDrawResult.draw_id);

          setStudentDrawSummary({
            drawId: latestStudentDrawResult.draw_id,
            studentName: latestStudentDrawResult.student_name,
            className:
              draw?.class_name ||
              latestStudentDrawResult.class_name ||
              "Turma não informada",
            activityTitle: draw?.activity_title || null,
            createdAt: draw?.created_at || latestStudentDrawResult.created_at,
          });
        } else {
          setStudentDrawSummary(null);
        }
      } catch (error) {
        console.error("Erro ao carregar interações do aluno:", error);
        setPortalButtons([]);
        setTeamSummary(null);
        setStudentDrawSummary(null);
      }
    }

    async function loadDashboard() {
      const savedSession = sessionStorage.getItem("melia_student_session");

      if (!savedSession) {
        router.push("/aluno");
        return;
      }

      const parsedSession = JSON.parse(savedSession) as StudentSession;

      setSession(parsedSession);

      const [
        studentResponse,
        messagesCountResponse,
        recentMessageResponse,
        activitiesCountResponse,
        pendingActivityResponse,
        gradesCountResponse,
        recentGradeResponse,
        availableQuizResponse,
        birthdayMessagesResponse,
      ] = await Promise.all([
        supabase
          .from("students")
          .select(
            `
            id,
            name,
            email,
            phone,
            class_id,
            class_name,
            average,
            attendance,
            status,
            course_name,
            portal_pin,
            must_change_pin,
            birth_date
          `
          )
          .eq("id", parsedSession.studentId)
          .single(),

        supabase
          .from("student_messages")
          .select("id", { count: "exact", head: true })
          .eq("student_id", parsedSession.studentId)
          .eq("sender", "teacher")
          .eq("is_read", false),

        supabase
          .from("student_messages")
          .select("id, content, sender, is_read, created_at")
          .eq("student_id", parsedSession.studentId)
          .eq("sender", "teacher")
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("activities")
          .select("id", { count: "exact", head: true })
          .eq("class_id", parsedSession.classId)
          .eq("archived", false),

        supabase
          .from("activities")
          .select("id, title, description, due_date")
          .eq("class_id", parsedSession.classId)
          .eq("archived", false)
          .order("due_date", { ascending: true })
          .limit(1),

        supabase
          .from("grades")
          .select("id", { count: "exact", head: true })
          .eq("student_id", parsedSession.studentId),

        supabase
          .from("grades")
          .select("id, title, score, date, feedback")
          .eq("student_id", parsedSession.studentId)
          .order("date", { ascending: false })
          .limit(1),

        supabase
          .from("quizzes")
          .select(
            "id, title, mode, status, result_type, total_questions, created_at"
          )
          .eq("class_id", parsedSession.classId)
          .in("status", ["active", "waiting", "live"])
          .order("created_at", { ascending: false })
          .limit(1),

        supabase
          .from("birthday_messages")
          .select("id, message")
          .eq("active", true),
      ]);

      if (studentResponse.error || !studentResponse.data) {
        sessionStorage.removeItem("melia_student_session");
        router.push("/aluno");
        return;
      }

      const loadedStudent = studentResponse.data as StudentData;

      setStudent(loadedStudent);

      setStats({
        messages: messagesCountResponse.count || 0,
        activities: activitiesCountResponse.count || 0,
        grades: gradesCountResponse.count || 0,
      });

      if (!recentMessageResponse.error) {
        const messageData =
          ((recentMessageResponse.data as RecentMessage[] | null) ?? [])[0] ??
          null;

        setRecentMessage(messageData);
      }

      if (!pendingActivityResponse.error) {
        const activityData =
          ((pendingActivityResponse.data as PendingActivity[] | null) ??
            [])[0] ?? null;

        setPendingActivity(activityData);
      }

      if (!recentGradeResponse.error) {
        const gradeData =
          ((recentGradeResponse.data as RecentGrade[] | null) ?? [])[0] ??
          null;

        setRecentGrade(gradeData);
      }

      if (!availableQuizResponse.error) {
        const quizData =
          ((availableQuizResponse.data as AvailableQuiz[] | null) ?? [])[0] ??
          null;

        setAvailableQuiz(quizData);
      }

      if (!birthdayMessagesResponse.error) {
        setBirthdayMessages(
          (birthdayMessagesResponse.data as BirthdayMessage[] | null) ?? []
        );
      }

      await loadStudentInteractions(parsedSession);

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    sessionStorage.removeItem("melia_student_session");
    router.push("/aluno");
  }

  function closePinModal() {
    setPinFormOpen(false);
    setCurrentPin("");
    setNewPin("");
    setConfirmNewPin("");
    setPinMessage(null);
  }

  async function handleChangePin() {
    setPinMessage(null);

    if (!student || !session) {
      setPinMessage({
        type: "error",
        text: "Sessão do aluno não encontrada.",
      });
      return;
    }

    if (!currentPin.trim() || !newPin.trim() || !confirmNewPin.trim()) {
      setPinMessage({
        type: "error",
        text: "Preencha o PIN atual, o novo PIN e a confirmação.",
      });
      return;
    }

    if (newPin.trim().length < 4) {
      setPinMessage({
        type: "error",
        text: "O novo PIN precisa ter pelo menos 4 caracteres.",
      });
      return;
    }

    if (newPin.trim() !== confirmNewPin.trim()) {
      setPinMessage({
        type: "error",
        text: "A confirmação do novo PIN não confere.",
      });
      return;
    }

    const savedPin = student.portal_pin?.trim() || "";
    const defaultPin = getDefaultStudentPin(student.name || session.studentName);
    const normalizedCurrentPin = normalizePin(currentPin);
    const normalizedDefaultPin = normalizePin(defaultPin);

    const currentPinIsCorrect = savedPin
      ? currentPin.trim() === savedPin
      : normalizedCurrentPin === normalizedDefaultPin;

    if (!currentPinIsCorrect) {
      setPinMessage({
        type: "error",
        text: "PIN atual incorreto.",
      });
      return;
    }

    if (normalizePin(newPin) === normalizedDefaultPin) {
      setPinMessage({
        type: "error",
        text: "Escolha um PIN diferente do PIN inicial da escola.",
      });
      return;
    }

    setPinSaving(true);

    const { error } = await supabase
      .from("students")
      .update({
        portal_pin: newPin.trim(),
        must_change_pin: false,
        pin_updated_at: new Date().toISOString(),
      })
      .eq("id", student.id);

    setPinSaving(false);

    if (error) {
      setPinMessage({
        type: "error",
        text: `Erro ao atualizar PIN: ${error.message}`,
      });
      return;
    }

    const updatedStudent = {
      ...student,
      portal_pin: newPin.trim(),
      must_change_pin: false,
    };

    const updatedSession = {
      ...session,
      mustChangePin: false,
    };

    setStudent(updatedStudent);
    setSession(updatedSession);

    sessionStorage.setItem(
      "melia_student_session",
      JSON.stringify(updatedSession)
    );

    setCurrentPin("");
    setNewPin("");
    setConfirmNewPin("");

    setPinMessage({
      type: "success",
      text: "PIN atualizado com sucesso.",
    });

    setTimeout(() => {
      closePinModal();
    }, 1000);
  }

  const studentName = student?.name || session?.studentName || "Aluno";

  const firstName = useMemo(() => {
    return studentName.split(" ")[0] || "Aluno";
  }, [studentName]);

  const attendanceValue = student?.attendance ?? 0;
  const averageValue = student?.average ?? 0;

  const theme = getStudentTheme(studentName);

  const mustChangePin =
    student?.must_change_pin === true || session?.mustChangePin === true;

  const birthdayInfo = useMemo(() => {
    return getBirthdayInfo(student?.birth_date ?? null, firstName, birthdayMessages);
  }, [student?.birth_date, firstName, birthdayMessages]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Carregando portal...
      </main>
    );
  }

  return (
    <main className="flex min-h-screen bg-slate-950 text-white">
      <StudentSidebar />

      <section className="min-w-0 flex-1 pb-28 xl:pb-0">
        <StudentHeader
          studentName={studentName}
          classNameValue={student?.class_name || "Turma"}
          onLogout={handleLogout}
          onOpenPinSettings={() => setPinFormOpen(true)}
          mustChangePin={mustChangePin}
        />

        <div className="p-4 sm:p-6">
          <div
            className={`relative overflow-hidden rounded-[28px] border ${theme.border} bg-gradient-to-br ${theme.softGradient} p-5 shadow-2xl ${theme.glow} sm:p-6`}
          >
            <div
              className={`absolute -right-24 -top-24 h-56 w-56 rounded-full bg-gradient-to-br ${theme.gradient} opacity-20 blur-3xl`}
            />

            <div
              className={`absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-gradient-to-br ${theme.gradient} opacity-10 blur-3xl`}
            />

            <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${theme.text}`}>Olá,</p>

                <h1 className="mt-1 max-w-4xl truncate text-4xl font-black leading-tight text-white sm:text-5xl xl:text-6xl">
                  {firstName}
                </h1>

                <p className="mt-3 max-w-2xl text-base font-bold text-slate-200 sm:text-lg">
                  Seu painel de rotina, avisos e atividades importantes.
                </p>

                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-400">
                  Veja o que precisa de atenção hoje sem se perder em atalhos
                  repetidos.
                </p>

                {mustChangePin && (
                  <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-yellow-400/30 bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-200">
                    <AlertTriangle className="h-4 w-4" />
                    Troque seu PIN no ícone de chave, no topo da tela.
                  </div>
                )}
              </div>

              <div className="grid shrink-0 gap-3 sm:grid-cols-3 xl:w-[520px]">
                <Link
                  href="/aluno/gamificacao"
                  className={`group flex min-h-[92px] flex-col justify-between rounded-3xl bg-gradient-to-r ${theme.gradient} p-4 text-white shadow-xl transition hover:scale-[1.02]`}
                >
                  <div className="flex items-center justify-between">
                    <Zap className="h-6 w-6" />
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>

                  <span className="text-sm font-black">Ver meu XP</span>
                </Link>

                <Link
                  href="/aluno/sorteios"
                  className="group flex min-h-[92px] flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <Users className="h-6 w-6 text-fuchsia-300" />
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>

                  <span className="text-sm font-black">Minha equipe</span>
                </Link>

                <Link
                  href="/aluno/botoes"
                  className="group flex min-h-[92px] flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-4 text-white backdrop-blur transition hover:bg-white/10"
                >
                  <div className="flex items-center justify-between">
                    <Link2 className="h-6 w-6 text-cyan-300" />
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </div>

                  <span className="text-sm font-black">Acessos rápidos</span>
                </Link>
              </div>
            </div>
          </div>

          {birthdayInfo?.isInBirthdayWeek && (
            <div className="mt-6 overflow-hidden rounded-[32px] border border-pink-400/30 bg-gradient-to-br from-pink-500/20 via-fuchsia-500/10 to-yellow-500/10 p-6 shadow-2xl shadow-pink-500/10">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-pink-500/20 text-pink-200">
                    <PartyPopper className="h-8 w-8" />
                  </div>

                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-pink-200">
                      {birthdayInfo.isToday
                        ? "Hoje é seu dia!"
                        : "Sua semana especial"}
                    </p>

                    <h2 className="mt-2 text-3xl font-black text-white">
                      {birthdayInfo.isToday
                        ? `Feliz aniversário, ${firstName}!`
                        : `${firstName}, seu aniversário está chegando`}
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-200">
                      {birthdayInfo.message}
                    </p>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-slate-950/50 px-5 py-4 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Aniversário
                  </p>

                  <p className="mt-1 text-xl font-black text-white">
                    {birthdayInfo.formattedDate}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-pink-200">
                    {birthdayInfo.isToday
                      ? "É hoje!"
                      : `Faltam ${birthdayInfo.daysUntil} dia(s)`}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Link
              href="/aluno/frequencia"
              className={`rounded-[28px] border ${theme.border} bg-gradient-to-br ${theme.softGradient} p-5 shadow-xl ${theme.glow} transition hover:-translate-y-1`}
            >
              <div className="flex items-center justify-between">
                <CalendarCheck className={`h-10 w-10 ${theme.text}`} />

                <span
                  className={`rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold ${theme.text}`}
                >
                  frequência
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {attendanceValue}%
              </h2>

              <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                  style={{
                    width: `${Math.min(attendanceValue, 100)}%`,
                  }}
                />
              </div>
            </Link>

            <Link
              href="/aluno/notas"
              className="rounded-[28px] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-5 shadow-xl shadow-yellow-500/10 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <Trophy className="h-10 w-10 text-yellow-300" />

                <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-yellow-300">
                  média
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {averageValue || "-"}
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                desempenho escolar
              </p>
            </Link>

            <Link
              href="/aluno/mensagens"
              className="rounded-[28px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-5 shadow-xl shadow-cyan-500/10 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <MessageCircle className="h-10 w-10 text-cyan-300" />

                <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-cyan-300">
                  chat
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {stats.messages}
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                mensagens não lidas
              </p>
            </Link>

            <Link
              href="/aluno/atividades"
              className="rounded-[28px] border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-5 shadow-xl shadow-purple-500/10 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <BookOpen className="h-10 w-10 text-purple-300" />

                <span className="rounded-2xl bg-white/10 px-3 py-2 text-xs font-bold text-purple-300">
                  tarefas
                </span>
              </div>

              <h2 className="mt-5 text-4xl font-black text-white">
                {stats.activities}
              </h2>

              <p className="mt-3 text-sm text-slate-300">
                atividades disponíveis
              </p>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-sm font-semibold ${theme.text}`}>
                    Seu painel de hoje
                  </p>

                  <h2 className="mt-1 text-3xl font-black text-white">
                    O que merece sua atenção
                  </h2>
                </div>

                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-300">
                  atualizado agora
                </span>
              </div>

              <div className="mt-6 grid gap-3">
                <Link
                  href="/aluno/mensagens"
                  className="group rounded-3xl border border-cyan-500/20 bg-cyan-500/10 p-5 transition hover:border-cyan-300/50 hover:bg-cyan-500/15"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-cyan-500/15 p-3 text-cyan-300">
                      <MessageCircle className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">
                          Mensagem recente
                        </h3>

                        {stats.messages > 0 && (
                          <span className="rounded-full bg-cyan-500 px-2.5 py-1 text-xs font-black text-slate-950">
                            {stats.messages} não lida(s)
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {recentMessage
                          ? getMessagePreview(recentMessage.content)
                          : "Nenhuma mensagem recente do professor."}
                      </p>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
                        Ver conversa
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/aluno/atividades"
                  className="group rounded-3xl border border-purple-500/20 bg-purple-500/10 p-5 transition hover:border-purple-300/50 hover:bg-purple-500/15"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-purple-500/15 p-3 text-purple-300">
                      <BookOpen className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">
                          Próxima atividade
                        </h3>

                        {pendingActivity?.due_date && (
                          <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-black text-purple-100">
                            até {formatShortDate(pendingActivity.due_date)}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {pendingActivity
                          ? pendingActivity.title || "Atividade sem título"
                          : "Nenhuma atividade pendente no momento."}
                      </p>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-purple-200">
                        Abrir atividades
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/aluno/quiz"
                  className="group rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/10 p-5 transition hover:border-fuchsia-300/50 hover:bg-fuchsia-500/15"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-fuchsia-500/15 p-3 text-fuchsia-300">
                      <Zap className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">
                          Quiz disponível
                        </h3>

                        {availableQuiz && (
                          <span className="rounded-full bg-fuchsia-500/20 px-2.5 py-1 text-xs font-black text-fuchsia-100">
                            {getQuizStatusLabel(availableQuiz.status)}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {availableQuiz
                          ? availableQuiz.title || "Quiz sem título"
                          : "Nenhum quiz disponível para sua turma agora."}
                      </p>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-fuchsia-200">
                        Ir para quiz
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>

                <Link
                  href="/aluno/notas"
                  className="group rounded-3xl border border-yellow-500/20 bg-yellow-500/10 p-5 transition hover:border-yellow-300/50 hover:bg-yellow-500/15"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-2xl bg-yellow-500/15 p-3 text-yellow-300">
                      <Trophy className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-white">
                          Última nota ou feedback
                        </h3>

                        {recentGrade && (
                          <span className="rounded-full bg-yellow-500/20 px-2.5 py-1 text-xs font-black text-yellow-100">
                            {formatScore(recentGrade.score)}
                          </span>
                        )}
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
                        {recentGrade
                          ? `${recentGrade.title || "Nota"} • ${formatDate(
                              recentGrade.date
                            )}${
                              recentGrade.feedback
                                ? ` — ${recentGrade.feedback}`
                                : ""
                            }`
                          : "Nenhuma nota recente registrada."}
                      </p>

                      <div className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-yellow-200">
                        Ver notas
                        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[32px] border border-slate-800 bg-slate-900/70 p-6">
                <p className={`text-sm font-semibold ${theme.text}`}>
                  Resumo acadêmico
                </p>

                <h2 className="mt-2 text-3xl font-black text-white">
                  Sua situação
                </h2>

                <div className="mt-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Frequência</p>
                      <p className="text-sm font-black text-white">
                        {attendanceValue}%
                      </p>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${theme.gradient}`}
                        style={{
                          width: `${Math.min(attendanceValue, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-400">Média atual</p>
                      <p className="text-sm font-black text-white">
                        {averageValue || "-"}
                      </p>
                    </div>

                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                        style={{
                          width: `${Math.min(Number(averageValue) * 10, 100)}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs text-slate-500">Turma</p>
                      <p className="mt-1 truncate font-black text-white">
                        {student?.class_name || "Não informada"}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                      <p className="text-xs text-slate-500">Status</p>
                      <p className="mt-1 truncate font-black text-emerald-300">
                        {student?.status || "Ativo"}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
                    <p className="text-xs text-slate-500">Curso</p>
                    <p className="mt-1 truncate font-black text-white">
                      {student?.course_name || "Não informado"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-[32px] border border-fuchsia-500/20 bg-gradient-to-br from-fuchsia-500/10 via-purple-500/10 to-cyan-500/10 p-6 shadow-2xl shadow-fuchsia-500/10">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-fuchsia-200">
                      <Users className="h-4 w-4" />
                      Interações da turma
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-white">
                      {teamSummary
                        ? `Equipe ${teamSummary.teamNumber}`
                        : "Sem equipe ativa"}
                    </h2>

                    <p className="mt-2 text-sm text-slate-300">
                      {teamSummary
                        ? `${teamSummary.className} • ${formatDateTime(
                            teamSummary.createdAt
                          )}`
                        : "Quando o professor sortear equipes, seu grupo aparecerá aqui."}
                    </p>
                  </div>

                  <Link
                    href="/aluno/sorteios"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Ver sorteios
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {teamSummary?.activityTitle && (
                  <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-fuchsia-200">
                      Atividade
                    </p>

                    <p className="mt-1 text-sm font-bold text-white">
                      {teamSummary.activityTitle}
                    </p>
                  </div>
                )}

                {teamSummary && (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {teamSummary.members.slice(0, 4).map((member) => {
                      const isMe = member.student_id === session?.studentId;

                      return (
                        <div
                          key={member.id}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
                            isMe
                              ? "border-fuchsia-400/40 bg-fuchsia-500/15"
                              : "border-white/10 bg-slate-950/50"
                          }`}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-sm font-black text-white">
                            {member.student_name.charAt(0)}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-white">
                              {member.student_name}
                            </p>

                            <p className="text-xs text-slate-400">
                              {isMe ? "Você" : member.class_name || "Colega"}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {studentDrawSummary && (
                  <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
                    <div className="flex items-center gap-3">
                      <UserRound className="h-5 w-5 text-cyan-300" />

                      <div>
                        <p className="text-sm font-bold text-cyan-200">
                          Você apareceu em sorteio individual
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatDateTime(studentDrawSummary.createdAt)}
                        </p>

                        {studentDrawSummary.activityTitle && (
                          <p className="mt-2 text-xs font-semibold text-cyan-100">
                            Atividade: {studentDrawSummary.activityTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-[32px] border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 shadow-2xl shadow-cyan-500/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-2 text-sm font-bold text-cyan-200">
                      <Link2 className="h-4 w-4" />
                      Links úteis
                    </div>

                    <h2 className="mt-4 text-2xl font-black text-white">
                      Recursos do professor
                    </h2>
                  </div>

                  <Link
                    href="/aluno/botoes"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/15"
                  >
                    Ver todos
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {portalButtons.length === 0 ? (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-300">
                    O professor ainda não cadastrou links para você ou para sua
                    turma.
                  </div>
                ) : (
                  <div className="mt-5 grid gap-3">
                    {portalButtons.slice(0, 3).map((button) => (
                      <a
                        key={button.id}
                        href={getSafeUrl(button.button_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-4 transition hover:border-cyan-400/40 hover:bg-cyan-500/10"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate font-black text-white">
                              {button.button_label || "Link sem nome"}
                            </p>

                            {button.is_temporary && (
                              <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-cyan-200">
                                <Clock3 className="h-3 w-3" />
                                Temporário
                              </span>
                            )}
                          </div>

                          <p className="mt-1 line-clamp-1 break-all text-xs text-slate-400">
                            {button.button_url || "Sem URL"}
                          </p>
                        </div>

                        <ExternalLink className="h-5 w-5 shrink-0 text-cyan-300 transition group-hover:translate-x-1" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {pinFormOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur">
            <div className="w-full max-w-lg rounded-[28px] border border-slate-700 bg-slate-900 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div
                    className={`rounded-2xl p-3 ${
                      mustChangePin
                        ? "bg-yellow-500/15 text-yellow-300"
                        : "bg-cyan-500/15 text-cyan-300"
                    }`}
                  >
                    {mustChangePin ? (
                      <AlertTriangle className="h-5 w-5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-xl font-black text-white">
                      Alterar PIN
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-slate-400">
                      {mustChangePin
                        ? "Você está usando o PIN inicial. Crie um PIN pessoal."
                        : "Troque seu PIN de acesso quando necessário."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={closePinModal}
                  className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {pinMessage && (
                <div
                  className={`mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
                    pinMessage.type === "success"
                      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                      : "border-red-500/30 bg-red-500/10 text-red-200"
                  }`}
                >
                  {pinMessage.type === "success" ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <XCircle className="h-5 w-5" />
                  )}

                  <span className="font-semibold">{pinMessage.text}</span>
                </div>
              )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    PIN atual
                  </label>

                  <input
                    value={currentPin}
                    onChange={(event) => setCurrentPin(event.target.value)}
                    placeholder="Digite seu PIN atual"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    autoComplete="current-password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Novo PIN
                  </label>

                  <input
                    value={newPin}
                    onChange={(event) => setNewPin(event.target.value)}
                    placeholder="Crie um novo PIN"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-300">
                    Confirmar novo PIN
                  </label>

                  <input
                    value={confirmNewPin}
                    onChange={(event) => setConfirmNewPin(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleChangePin();
                      }
                    }}
                    placeholder="Repita o novo PIN"
                    className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs leading-relaxed text-slate-500">
                  O PIN inicial é o primeiro nome + 123. Depois da troca, só o
                  novo PIN funcionará.
                </p>

                <button
                  type="button"
                  onClick={handleChangePin}
                  disabled={pinSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-500 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Save className="h-4 w-4" />
                  {pinSaving ? "Salvando..." : "Salvar PIN"}
                </button>
              </div>
            </div>
          </div>
        )}

        <StudentRealtimeNotifications />
        <StudentMobileNav />
      </section>
    </main>
  );
}