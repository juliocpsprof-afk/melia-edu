"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Cake,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Filter,
  LineChart as LineChartIcon,
  NotebookPen,
  RefreshCcw,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  UserRoundSearch,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { StudentIdentity } from "@/components/StudentIdentity";

export type DashboardStudent = {
  id: string;
  name: string;
  classId: string | null;
  className: string | null;
  courseId: string | null;
  courseName: string | null;
  birthDate: string | null;
  status: string | null;
  average: number;
  attendance: number;
  photoPath: string | null;
  photoStatus: string | null;
  identityMode: string | null;
  avatarKey: string | null;
};

export type DashboardClass = { id: string; name: string };
export type DashboardCourse = { id: string; name: string };
export type DashboardGrade = {
  id: string;
  studentId: string;
  title: string;
  score: number;
  date: string | null;
};
export type DashboardAttendance = {
  id: string;
  studentId: string;
  status: string;
  date: string | null;
};
export type DashboardObservation = {
  id: string;
  studentId: string;
  content: string;
  category: string;
  createdAt: string | null;
};
export type DashboardSubmission = {
  id: string;
  studentId: string | null;
  status: string | null;
  grade: number | null;
  activityId: string | null;
  activityTitle: string;
  dueDate: string | null;
  classId: string | null;
  className: string;
};
export type DashboardActivity = {
  id: string;
  title: string;
  dueDate: string | null;
  classId: string | null;
  className: string;
};

type DashboardProps = {
  students: DashboardStudent[];
  classes: DashboardClass[];
  courses: DashboardCourse[];
  grades: DashboardGrade[];
  attendance: DashboardAttendance[];
  observations: DashboardObservation[];
  submissions: DashboardSubmission[];
  activities: DashboardActivity[];
};

type PeriodPreset = "7" | "30" | "60" | "90" | "180" | "365" | "all" | "custom";
type AgeRange = "all" | "under15" | "15to17" | "18to24" | "25plus";
type ClassMetric = "average" | "attendance" | "risk";
type DateRange = { start: Date | null; end: Date; label: string };
type RiskStudent = {
  student: DashboardStudent;
  average: number;
  attendance: number;
  absenceCount: number;
  score: number;
  reasons: string[];
};

const pieColors = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6"];

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : `${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function toInputDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string | null | undefined) {
  const date = parseDate(value);
  if (!date) return "Sem data";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getCurrentMonthName() {
  return new Date().toLocaleDateString("pt-BR", { month: "long" });
}

function getStudentAge(birthDate: string | null) {
  const date = parseDate(birthDate);
  if (!date) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const anniversary = new Date(today.getFullYear(), date.getMonth(), date.getDate());
  if (anniversary > startOfDay(today)) age -= 1;
  return age >= 0 ? age : null;
}

function matchesAgeRange(age: number | null, range: AgeRange) {
  if (range === "all") return true;
  if (age === null) return false;
  if (range === "under15") return age < 15;
  if (range === "15to17") return age >= 15 && age <= 17;
  if (range === "18to24") return age >= 18 && age <= 24;
  return age >= 25;
}

function getRange(preset: PeriodPreset, customStart: string, customEnd: string): DateRange {
  const today = endOfDay(new Date());
  if (preset === "all") return { start: null, end: today, label: "Todo o histórico" };

  if (preset === "custom") {
    const start = customStart ? startOfDay(new Date(`${customStart}T00:00:00`)) : null;
    const end = customEnd ? endOfDay(new Date(`${customEnd}T00:00:00`)) : today;
    return {
      start,
      end,
      label: start
        ? `${start.toLocaleDateString("pt-BR")} até ${end.toLocaleDateString("pt-BR")}`
        : `Até ${end.toLocaleDateString("pt-BR")}`,
    };
  }

  const days = Number(preset);
  const start = startOfDay(new Date());
  start.setDate(start.getDate() - Math.max(0, days - 1));
  const labels: Record<Exclude<PeriodPreset, "all" | "custom">, string> = {
    "7": "Últimos 7 dias",
    "30": "Últimos 30 dias",
    "60": "Últimos 60 dias",
    "90": "Últimos 90 dias",
    "180": "Últimos 6 meses",
    "365": "Últimos 12 meses",
  };
  return { start, end: today, label: labels[preset] };
}

function getPreviousRange(range: DateRange) {
  if (!range.start) return null;
  const duration = range.end.getTime() - range.start.getTime();
  const previousEnd = new Date(range.start.getTime() - 1);
  return { start: new Date(previousEnd.getTime() - duration), end: previousEnd };
}

function dateInRange(value: string | null, range: { start: Date | null; end: Date }) {
  const date = parseDate(value);
  if (!date) return false;
  return (!range.start || date >= range.start) && date <= range.end;
}

function mean(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function getAttendanceRate(records: DashboardAttendance[]) {
  if (!records.length) return 0;
  const positive = records.filter(
    (record) => record.status === "Presente" || record.status === "Atraso"
  ).length;
  return (positive / records.length) * 100;
}

function isCorrected(submission: DashboardSubmission) {
  const status = String(submission.status ?? "").toLowerCase();
  return (
    status.includes("corrig") ||
    status.includes("avaliad") ||
    status.includes("conclu") ||
    submission.grade !== null
  );
}

function getBirthdayParts(value: string | null) {
  if (!value) return null;
  const clean = value.slice(0, 10).split("-").map(Number);
  if (!clean[0] || !clean[1] || !clean[2]) return null;
  return { year: clean[0], month: clean[1], day: clean[2] };
}

function isBirthdayToday(value: string | null) {
  const parts = getBirthdayParts(value);
  if (!parts) return false;
  const today = new Date();
  return parts.month === today.getMonth() + 1 && parts.day === today.getDate();
}

function isBirthdayThisMonth(value: string | null) {
  const parts = getBirthdayParts(value);
  return Boolean(parts && parts.month === new Date().getMonth() + 1);
}

function getBucketMode(range: DateRange) {
  if (!range.start) return "month" as const;
  const days = Math.max(1, Math.ceil((range.end.getTime() - range.start.getTime()) / 86400000));
  if (days <= 14) return "day" as const;
  if (days <= 120) return "week" as const;
  return "month" as const;
}

function getBucket(date: Date, mode: "day" | "week" | "month") {
  if (mode === "day") {
    return {
      key: toInputDate(date),
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
    };
  }
  if (mode === "week") {
    const monday = startOfDay(date);
    const day = monday.getDay();
    monday.setDate(monday.getDate() + (day === 0 ? -6 : 1 - day));
    return {
      key: toInputDate(monday),
      label: `Sem. ${monday.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`,
    };
  }
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return {
    key: toInputDate(firstDay),
    label: firstDay.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
  };
}

function getDelta(current: number, previous: number) {
  if (!previous && !current) return null;
  return current - previous;
}

function getTrendTone(delta: number | null) {
  if (delta === null || Math.abs(delta) < 0.05) return "neutral" as const;
  return delta > 0 ? ("positive" as const) : ("negative" as const);
}

export function TeacherDashboard({
  students,
  classes,
  courses,
  grades,
  attendance,
  observations,
  submissions,
  activities,
}: DashboardProps) {
  const [classId, setClassId] = useState("");
  const [courseId, setCourseId] = useState("");
  const [ageRange, setAgeRange] = useState<AgeRange>("all");
  const [studentId, setStudentId] = useState("");
  const [period, setPeriod] = useState<PeriodPreset>("90");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [classMetric, setClassMetric] = useState<ClassMetric>("average");

  const range = useMemo(
    () => getRange(period, customStart, customEnd),
    [period, customStart, customEnd]
  );

  const studentOptions = useMemo(() => {
    return students.filter((student) => {
      if (classId && student.classId !== classId) return false;
      if (courseId && student.courseId !== courseId) return false;
      return matchesAgeRange(getStudentAge(student.birthDate), ageRange);
    });
  }, [students, classId, courseId, ageRange]);

  useEffect(() => {
    if (studentId && !studentOptions.some((student) => student.id === studentId)) {
      setStudentId("");
    }
  }, [studentId, studentOptions]);

  const filteredStudents = useMemo(
    () => studentOptions.filter((student) => !studentId || student.id === studentId),
    [studentOptions, studentId]
  );
  const filteredStudentIds = useMemo(
    () => new Set(filteredStudents.map((student) => student.id)),
    [filteredStudents]
  );

  const currentGrades = useMemo(
    () => grades.filter((grade) => filteredStudentIds.has(grade.studentId) && dateInRange(grade.date, range)),
    [grades, filteredStudentIds, range]
  );
  const currentAttendance = useMemo(
    () => attendance.filter((record) => filteredStudentIds.has(record.studentId) && dateInRange(record.date, range)),
    [attendance, filteredStudentIds, range]
  );
  const currentObservations = useMemo(
    () => observations.filter((item) => filteredStudentIds.has(item.studentId) && dateInRange(item.createdAt, range)),
    [observations, filteredStudentIds, range]
  );

  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const previousGrades = useMemo(() => {
    if (!previousRange) return [];
    return grades.filter((grade) => filteredStudentIds.has(grade.studentId) && dateInRange(grade.date, previousRange));
  }, [grades, filteredStudentIds, previousRange]);
  const previousAttendance = useMemo(() => {
    if (!previousRange) return [];
    return attendance.filter((record) => filteredStudentIds.has(record.studentId) && dateInRange(record.date, previousRange));
  }, [attendance, filteredStudentIds, previousRange]);

  const studentMetrics = useMemo(() => {
    return new Map(
      filteredStudents.map((student) => {
        const studentGrades = currentGrades.filter((grade) => grade.studentId === student.id);
        const studentAttendanceRecords = currentAttendance.filter((record) => record.studentId === student.id);
        return [
          student.id,
          {
            average: studentGrades.length ? mean(studentGrades.map((grade) => grade.score)) : student.average,
            attendance: studentAttendanceRecords.length ? getAttendanceRate(studentAttendanceRecords) : student.attendance,
            grades: studentGrades,
            attendanceRecords: studentAttendanceRecords,
          },
        ] as const;
      })
    );
  }, [filteredStudents, currentGrades, currentAttendance]);

  const currentAverage = currentGrades.length
    ? mean(currentGrades.map((grade) => grade.score))
    : mean(filteredStudents.map((student) => student.average));
  const previousAverage = previousGrades.length ? mean(previousGrades.map((grade) => grade.score)) : 0;
  const currentAttendanceRate = currentAttendance.length
    ? getAttendanceRate(currentAttendance)
    : mean(filteredStudents.map((student) => student.attendance));
  const previousAttendanceRate = previousAttendance.length ? getAttendanceRate(previousAttendance) : 0;

  const allRiskStudents = useMemo<RiskStudent[]>(() => {
    const recentLimit = new Date();
    recentLimit.setDate(recentLimit.getDate() - 90);

    return filteredStudents
      .map((student) => {
        const metrics = studentMetrics.get(student.id);
        if (!metrics) return null;
        const oldGrades = previousGrades.filter((grade) => grade.studentId === student.id);
        const oldAverage = oldGrades.length ? mean(oldGrades.map((grade) => grade.score)) : null;
        const absenceCount = metrics.attendanceRecords.filter((record) => record.status === "Falta").length;
        const hasRecentObservation = observations.some((observation) => {
          if (observation.studentId !== student.id) return false;
          const date = parseDate(observation.createdAt);
          return Boolean(date && date >= recentLimit);
        });
        const reasons: string[] = [];
        let score = 0;

        if (metrics.average < 5) {
          reasons.push("Média crítica");
          score += 5;
        } else if (metrics.average < 7) {
          reasons.push("Média abaixo de 7");
          score += 3;
        }
        if (metrics.attendance < 75) {
          reasons.push("Frequência abaixo de 75%");
          score += 4;
        } else if (metrics.attendance < 85) {
          reasons.push("Frequência em atenção");
          score += 2;
        }
        if (absenceCount >= 3) {
          reasons.push(`${absenceCount} faltas no período`);
          score += Math.min(4, absenceCount - 1);
        }
        if (metrics.grades.length === 0) {
          reasons.push("Sem nota no período");
          score += 2;
        }
        if (oldAverage !== null && metrics.average <= oldAverage - 0.8) {
          reasons.push(`Queda de ${(oldAverage - metrics.average).toFixed(1)} ponto`);
          score += 3;
        }
        if (score > 0 && !hasRecentObservation) {
          reasons.push("Sem observação recente");
          score += 1;
        }
        if (!score) return null;
        return { student, average: metrics.average, attendance: metrics.attendance, absenceCount, score, reasons };
      })
      .filter((item): item is RiskStudent => Boolean(item))
      .sort((a, b) => b.score - a.score || a.average - b.average);
  }, [filteredStudents, studentMetrics, previousGrades, observations]);

  const riskStudents = allRiskStudents.slice(0, 8);

  const trendData = useMemo(() => {
    const mode = getBucketMode(range);
    const map = new Map<string, { key: string; label: string; grades: number[]; present: number; total: number }>();
    currentGrades.forEach((grade) => {
      const date = parseDate(grade.date);
      if (!date) return;
      const bucket = getBucket(date, mode);
      const item = map.get(bucket.key) ?? { key: bucket.key, label: bucket.label, grades: [], present: 0, total: 0 };
      item.grades.push(grade.score);
      map.set(bucket.key, item);
    });
    currentAttendance.forEach((record) => {
      const date = parseDate(record.date);
      if (!date) return;
      const bucket = getBucket(date, mode);
      const item = map.get(bucket.key) ?? { key: bucket.key, label: bucket.label, grades: [], present: 0, total: 0 };
      item.total += 1;
      if (record.status === "Presente" || record.status === "Atraso") item.present += 1;
      map.set(bucket.key, item);
    });
    return Array.from(map.values())
      .sort((a, b) => a.key.localeCompare(b.key))
      .map((item) => ({
        period: item.label,
        media: item.grades.length ? Number(mean(item.grades).toFixed(1)) : null,
        frequencia: item.total ? Number(((item.present / item.total) * 100).toFixed(0)) : null,
      }));
  }, [currentGrades, currentAttendance, range]);

  const classComparison = useMemo(() => {
    const ids = Array.from(new Set(filteredStudents.map((student) => student.classId).filter(Boolean)));
    return ids
      .map((id) => {
        const classStudents = filteredStudents.filter((student) => student.classId === id);
        const validMetrics = classStudents
          .map((student) => studentMetrics.get(student.id))
          .filter(Boolean) as Array<{ average: number; attendance: number }>;
        const risk = classStudents.filter((student) => {
          const item = studentMetrics.get(student.id);
          return Boolean(item && (item.average < 7 || item.attendance < 75));
        }).length;
        return {
          id: String(id),
          turma: classes.find((item) => item.id === id)?.name || classStudents[0]?.className || "Turma",
          media: Number(mean(validMetrics.map((item) => item.average)).toFixed(1)),
          frequencia: Number(mean(validMetrics.map((item) => item.attendance)).toFixed(0)),
          risco: risk,
          alunos: classStudents.length,
        };
      })
      .sort((a, b) => {
        if (classMetric === "risk") return b.risco - a.risco;
        if (classMetric === "attendance") return a.frequencia - b.frequencia;
        return a.media - b.media;
      })
      .slice(0, 10);
  }, [filteredStudents, studentMetrics, classes, classMetric]);

  const distribution = useMemo(() => {
    const groups = [
      { name: "Crítica", value: 0 },
      { name: "Atenção", value: 0 },
      { name: "Boa", value: 0 },
      { name: "Excelente", value: 0 },
    ];
    filteredStudents.forEach((student) => {
      const average = studentMetrics.get(student.id)?.average ?? student.average;
      if (average < 5) groups[0].value += 1;
      else if (average < 7) groups[1].value += 1;
      else if (average < 9) groups[2].value += 1;
      else groups[3].value += 1;
    });
    return groups;
  }, [filteredStudents, studentMetrics]);

  const birthdayStudents = useMemo(() => {
    return filteredStudents
      .filter((student) => isBirthdayThisMonth(student.birthDate))
      .sort((a, b) => {
        const todayDifference = Number(isBirthdayToday(b.birthDate)) - Number(isBirthdayToday(a.birthDate));
        if (todayDifference !== 0) return todayDifference;
        return (getBirthdayParts(a.birthDate)?.day ?? 99) - (getBirthdayParts(b.birthDate)?.day ?? 99);
      });
  }, [filteredStudents]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      if (submission.studentId && !filteredStudentIds.has(submission.studentId)) return false;
      if (!submission.studentId && classId && submission.classId !== classId) return false;
      return true;
    });
  }, [submissions, filteredStudentIds, classId]);

  const pendingCorrections = filteredSubmissions.filter((submission) => !isCorrected(submission));
  const overdueCorrections = pendingCorrections.filter((submission) => {
    const dueDate = parseDate(submission.dueDate);
    return Boolean(dueDate && dueDate < startOfDay(new Date()));
  });

  const upcomingActivities = useMemo(() => {
    const today = startOfDay(new Date());
    const limit = new Date(today);
    limit.setDate(limit.getDate() + 30);
    return activities
      .filter((activity) => {
        if (classId && activity.classId !== classId) return false;
        const dueDate = parseDate(activity.dueDate);
        return Boolean(dueDate && dueDate >= today && dueDate <= limit);
      })
      .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
      .slice(0, 6);
  }, [activities, classId]);

  const recentObservations = useMemo(
    () => [...currentObservations].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))).slice(0, 5),
    [currentObservations]
  );

  const selectedStudent = studentId ? students.find((student) => student.id === studentId) ?? null : null;
  const contextLabel = selectedStudent
    ? selectedStudent.name
    : classId
    ? classes.find((item) => item.id === classId)?.name || "Turma selecionada"
    : courseId
    ? courses.find((item) => item.id === courseId)?.name || "Curso selecionado"
    : "Visão geral";

  const resetFilters = () => {
    setClassId("");
    setCourseId("");
    setAgeRange("all");
    setStudentId("");
    setPeriod("90");
    setCustomStart("");
    setCustomEnd("");
  };

  const averageDelta = getDelta(currentAverage, previousAverage);
  const attendanceDelta = getDelta(currentAttendanceRate, previousAttendanceRate);

  return (
    <div data-no-student-photo="true" className="min-h-screen bg-[#020617] text-white">
      <header className="border-b border-slate-800/80 bg-slate-950/70 px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-[1600px]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-violet-200">
                <Sparkles size={14} /> Inteligência pedagógica
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">Painel de decisões do professor</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
                Encontre padrões, identifique estudantes que precisam de apoio e transforme dados em ações pedagógicas objetivas.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Contexto atual</p>
              <p className="mt-1 font-black text-white">{contextLabel}</p>
              <p className="mt-1 text-xs text-slate-400">{range.label}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6">
        <section className="sticky top-0 z-30 rounded-[28px] border border-slate-800 bg-slate-950/90 p-4 shadow-2xl backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-black text-slate-200">
              <Filter size={17} className="text-violet-300" /> Filtrar visão pedagógica
            </div>
            <button type="button" onClick={resetFilters} className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800">
              <RefreshCcw size={14} /> Limpar
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <FilterSelect value={classId} onChange={setClassId} label="Turma">
              <option value="">Todas as turmas</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect value={courseId} onChange={setCourseId} label="Curso">
              <option value="">Todos os cursos</option>
              {courses.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </FilterSelect>
            <FilterSelect value={ageRange} onChange={(value) => setAgeRange(value as AgeRange)} label="Faixa etária">
              <option value="all">Todas as idades</option>
              <option value="under15">Até 14 anos</option>
              <option value="15to17">15 a 17 anos</option>
              <option value="18to24">18 a 24 anos</option>
              <option value="25plus">25 anos ou mais</option>
            </FilterSelect>
            <FilterSelect value={studentId} onChange={setStudentId} label="Aluno">
              <option value="">Todos os alunos</option>
              {studentOptions.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </FilterSelect>
            <FilterSelect value={period} onChange={(value) => setPeriod(value as PeriodPreset)} label="Período">
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
              <option value="180">Últimos 6 meses</option>
              <option value="365">Últimos 12 meses</option>
              <option value="all">Todo o histórico</option>
              <option value="custom">Período personalizado</option>
            </FilterSelect>
          </div>
          {period === "custom" && (
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:max-w-xl">
              <DateInput label="Data inicial" value={customStart} onChange={setCustomStart} />
              <DateInput label="Data final" value={customEnd} onChange={setCustomEnd} />
            </div>
          )}
        </section>

        {filteredStudents.length === 0 ? (
          <section className="rounded-[32px] border border-slate-800 bg-slate-900/50 p-10 text-center">
            <Search className="mx-auto h-12 w-12 text-slate-600" />
            <h2 className="mt-4 text-2xl font-black">Nenhum aluno encontrado</h2>
            <p className="mt-2 text-slate-400">Ajuste os filtros para ampliar a análise.</p>
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <MetricCard title="Alunos analisados" value={String(filteredStudents.length)} description={selectedStudent ? "Visão individual" : "No recorte selecionado"} icon={<Users />} tone="violet" />
              <MetricCard title="Média de desempenho" value={currentAverage.toFixed(1)} description="Notas no período" icon={<TrendingUp />} tone={currentAverage < 7 ? "amber" : "emerald"} delta={averageDelta} deltaSuffix=" pt" />
              <MetricCard title="Frequência média" value={`${currentAttendanceRate.toFixed(0)}%`} description="Presenças e atrasos" icon={<BookOpenCheck />} tone={currentAttendanceRate < 75 ? "red" : currentAttendanceRate < 85 ? "amber" : "cyan"} delta={attendanceDelta} deltaSuffix=" pp" />
              <MetricCard title="Prioridade pedagógica" value={String(allRiskStudents.length)} description="Alunos com sinais de atenção" icon={<AlertTriangle />} tone={allRiskStudents.length ? "red" : "emerald"} />
              <MetricCard title="Correções pendentes" value={String(pendingCorrections.length)} description={`${overdueCorrections.length} atrasada(s)`} icon={<ClipboardCheck />} tone={overdueCorrections.length ? "amber" : "blue"} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
              <Panel title="Evolução do desempenho e da frequência" description="Acompanhe a direção da aprendizagem no período selecionado." icon={<LineChartIcon />}>
                {trendData.length === 0 ? <EmptyState text="Ainda não há notas ou registros de frequência neste período." /> : (
                  <div className="h-[340px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData} margin={{ top: 12, right: 12, left: -12, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gradeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="period" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="grade" domain={[0, 10]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis yAxisId="attendance" orientation="right" domain={[0, 100]} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 16 }} />
                        <Legend />
                        <Area yAxisId="grade" type="monotone" dataKey="media" name="Média" stroke="#8b5cf6" strokeWidth={3} fill="url(#gradeGradient)" connectNulls />
                        <Line yAxisId="attendance" type="monotone" dataKey="frequencia" name="Frequência %" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} connectNulls />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Panel>

              <Panel title="Distribuição das médias" description="Proporção dos estudantes em cada faixa." icon={<Target />}>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={62} outerRadius={96} paddingAngle={4}>
                        {distribution.map((entry, index) => <Cell key={entry.name} fill={pieColors[index]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {distribution.map((item, index) => (
                    <div key={item.name} className="rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pieColors[index] }} />
                        <span className="text-xs text-slate-400">{item.name}</span>
                      </div>
                      <p className="mt-1 text-xl font-black">{item.value}</p>
                    </div>
                  ))}
                </div>
              </Panel>
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Panel title="Radar pedagógico" description="Estudantes ordenados pela urgência de acompanhamento." icon={<UserRoundSearch />} action={<Link href="/dashboard/alunos" className="text-xs font-bold text-violet-300 hover:text-violet-200">Ver todos</Link>}>
                {riskStudents.length === 0 ? (
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-200">
                    <CheckCircle2 size={22} /><p className="font-semibold">Nenhum sinal crítico no recorte atual.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 md:grid-cols-2">
                    {riskStudents.map((item) => (
                      <Link key={item.student.id} href={`/dashboard/alunos/${item.student.id}`} className="group rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:-translate-y-0.5 hover:border-red-400/40 hover:bg-red-500/5">
                        <div className="flex items-start gap-3">
                          <StudentIdentity studentId={item.student.id} name={item.student.name} photoPath={item.student.photoPath} photoStatus={item.student.photoStatus} identityMode={item.student.identityMode} avatarKey={item.student.avatarKey} viewer="teacher" size="lg" expandable />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div><p className="truncate font-black text-white">{item.student.name}</p><p className="mt-1 text-xs text-slate-500">{item.student.className || "Sem turma"}</p></div>
                              <ChevronRight className="h-5 w-5 shrink-0 text-slate-600 transition group-hover:translate-x-1 group-hover:text-red-300" />
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.reasons.slice(0, 3).map((reason) => <span key={reason} className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold text-red-200">{reason}</span>)}
                            </div>
                            <div className="mt-3 flex gap-4 text-xs text-slate-400">
                              <span>Média <strong className="text-white">{item.average.toFixed(1)}</strong></span>
                              <span>Freq. <strong className="text-white">{item.attendance.toFixed(0)}%</strong></span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title={`Aniversariantes de ${getCurrentMonthName()}`} description="Clique no aluno para preparar a mensagem individual." icon={<Cake />}>
                {birthdayStudents.length === 0 ? <EmptyState text="Nenhum aniversariante neste recorte." /> : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                    {birthdayStudents.map((student) => {
                      const today = isBirthdayToday(student.birthDate);
                      return (
                        <div key={student.id} className={`flex items-center gap-3 rounded-2xl border p-3 transition hover:-translate-y-0.5 ${today ? "border-yellow-300/40 bg-yellow-500/15 shadow-lg shadow-yellow-500/10" : "border-pink-400/20 bg-pink-500/10"}`}>
                          <StudentIdentity studentId={student.id} name={student.name} photoPath={student.photoPath} photoStatus={student.photoStatus} identityMode={student.identityMode} avatarKey={student.avatarKey} viewer="teacher" size="md" expandable />
                          <span className="min-w-0 flex-1 truncate text-sm font-black text-white">{student.name}</span>
                          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${today ? "bg-yellow-300 text-slate-950" : "bg-slate-950/70 text-pink-200"}`}>{today ? "Hoje" : formatShortDate(student.birthDate)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </section>

            <Panel title="Comparativo por turma" description="Compare médias, frequência ou quantidade de alunos em atenção." icon={<BarChart3 />} action={
              <div className="flex flex-wrap gap-2">
                {([["average", "Média"], ["attendance", "Frequência"], ["risk", "Em atenção"]] as [ClassMetric, string][]).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setClassMetric(value)} className={`rounded-xl px-3 py-2 text-xs font-bold transition ${classMetric === value ? "bg-violet-500 text-white" : "border border-slate-700 bg-slate-950 text-slate-400 hover:text-white"}`}>{label}</button>
                ))}
              </div>
            }>
              {classComparison.length === 0 ? <EmptyState text="Nenhuma turma disponível neste recorte." /> : (
                <div className="h-[360px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classComparison} layout="vertical" margin={{ top: 5, right: 25, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" domain={classMetric === "average" ? [0, 10] : undefined} stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="turma" width={130} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: "#020617", border: "1px solid #334155", borderRadius: 16 }} />
                      <Bar dataKey={classMetric === "average" ? "media" : classMetric === "attendance" ? "frequencia" : "risco"} name={classMetric === "average" ? "Média" : classMetric === "attendance" ? "Frequência %" : "Alunos em atenção"} fill={classMetric === "risk" ? "#ef4444" : classMetric === "attendance" ? "#22d3ee" : "#8b5cf6"} radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Panel>

            <section className="grid gap-6 xl:grid-cols-3">
              <Panel title="Centro de ação" description="Atalhos para transformar o diagnóstico em registro." icon={<Activity />}>
                <div className="grid gap-3">
                  <ActionLink href="/dashboard/frequencia" icon={<BookOpenCheck />} title="Registrar frequência" description="Faça a chamada e registre atrasos." />
                  <ActionLink href="/dashboard/notas" icon={<TrendingUp />} title="Lançar notas" description="Atualize o desempenho das avaliações." />
                  <ActionLink href="/dashboard/diario" icon={<NotebookPen />} title="Preencher diário" description="Registre conteúdo e encaminhamentos." />
                  <ActionLink href="/dashboard/entregas" icon={<ClipboardCheck />} title="Corrigir entregas" description={`${pendingCorrections.length} entrega(s) aguardando correção.`} />
                </div>
              </Panel>

              <Panel title="Próximas atividades" description="Prazos dos próximos 30 dias." icon={<CalendarClock />}>
                {upcomingActivities.length === 0 ? <EmptyState text="Nenhuma atividade próxima neste recorte." /> : (
                  <div className="space-y-3">
                    {upcomingActivities.map((activity) => (
                      <Link key={activity.id} href="/dashboard/atividades" className="block rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-cyan-500/40">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0"><p className="truncate font-bold text-white">{activity.title}</p><p className="mt-1 text-xs text-slate-500">{activity.className}</p></div>
                          <span className="shrink-0 rounded-full bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-200">{formatShortDate(activity.dueDate)}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Observações recentes" description="Últimos registros pedagógicos do recorte." icon={<NotebookPen />}>
                {recentObservations.length === 0 ? <EmptyState text="Nenhuma observação registrada neste período." /> : (
                  <div className="space-y-3">
                    {recentObservations.map((observation) => {
                      const student = students.find((item) => item.id === observation.studentId);
                      return (
                        <Link key={observation.id} href={student ? `/dashboard/alunos/${student.id}` : "/dashboard/alunos"} className="block rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-violet-500/40">
                          <div className="flex items-center gap-3">
                            {student && <StudentIdentity studentId={student.id} name={student.name} photoPath={student.photoPath} photoStatus={student.photoStatus} identityMode={student.identityMode} avatarKey={student.avatarKey} viewer="teacher" size="sm" expandable />}
                            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{student?.name || "Aluno"}</p><p className="mt-1 text-xs text-slate-500">{observation.category} • {formatShortDate(observation.createdAt)}</p></div>
                          </div>
                          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">{observation.content}</p>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </Panel>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none transition focus:border-violet-400">{children}</select>
    </label>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      <span className="mb-1.5 block text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)} style={{ colorScheme: "dark" }} className="h-11 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 text-sm text-white outline-none focus:border-violet-400" />
    </label>
  );
}

function Panel({ title, description, icon, action, children }: { title: string; description: string; icon: ReactNode; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-slate-800 bg-slate-900/45 p-5 shadow-xl shadow-slate-950/20 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300">{icon}</div>
          <div><h2 className="text-xl font-black text-white sm:text-2xl">{title}</h2><p className="mt-1 text-sm leading-5 text-slate-400">{description}</p></div>
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function MetricCard({ title, value, description, icon, tone, delta, deltaSuffix = "" }: { title: string; value: string; description: string; icon: ReactNode; tone: "violet" | "emerald" | "cyan" | "amber" | "red" | "blue"; delta?: number | null; deltaSuffix?: string }) {
  const styles = {
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    cyan: "border-cyan-500/20 bg-cyan-500/10 text-cyan-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    red: "border-red-500/20 bg-red-500/10 text-red-200",
    blue: "border-blue-500/20 bg-blue-500/10 text-blue-200",
  };
  const trend = getTrendTone(delta ?? null);
  return (
    <div className={`rounded-[26px] border p-5 ${styles[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950/35">{icon}</div>
        {delta !== undefined && delta !== null && (
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-black ${trend === "positive" ? "bg-emerald-500/15 text-emerald-200" : trend === "negative" ? "bg-red-500/15 text-red-200" : "bg-slate-500/15 text-slate-300"}`}>
            {trend === "positive" ? <TrendingUp size={13} /> : trend === "negative" ? <TrendingDown size={13} /> : null}
            {delta > 0 ? "+" : ""}{delta.toFixed(1)}{deltaSuffix}
          </span>
        )}
      </div>
      <p className="mt-5 text-xs font-black uppercase tracking-wide opacity-75">{title}</p>
      <p className="mt-2 text-4xl font-black text-white">{value}</p>
      <p className="mt-2 text-xs opacity-70">{description}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/30 p-6 text-center text-sm text-slate-500">{text}</div>;
}

function ActionLink({ href, icon, title, description }: { href: string; icon: ReactNode; title: string; description: string }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4 transition hover:border-violet-500/40 hover:bg-violet-500/5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">{icon}</div>
      <div className="min-w-0 flex-1"><p className="font-bold text-white">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div>
      <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300" />
    </Link>
  );
}
