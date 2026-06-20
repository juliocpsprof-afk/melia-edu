import { RealtimeDashboardUpdater } from "@/components/RealtimeDashboardUpdater";
import {
  TeacherDashboard,
  type DashboardActivity,
  type DashboardAttendance,
  type DashboardClass,
  type DashboardCourse,
  type DashboardGrade,
  type DashboardObservation,
  type DashboardStudent,
  type DashboardSubmission,
} from "@/components/dashboard/TeacherDashboard";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type RawSubmission = {
  id: string;
  student_id: string | null;
  status: string | null;
  grade: number | null;
  activity_id: string | null;
  activities:
    | {
        id?: string | null;
        title?: string | null;
        due_date?: string | null;
        class_id?: string | null;
        classes?: { name?: string | null } | { name?: string | null }[] | null;
      }
    | {
        id?: string | null;
        title?: string | null;
        due_date?: string | null;
        class_id?: string | null;
        classes?: { name?: string | null } | { name?: string | null }[] | null;
      }[]
    | null;
};

type RawActivity = {
  id: string;
  title: string | null;
  due_date: string | null;
  class_id: string | null;
  classes?: { name?: string | null } | { name?: string | null }[] | null;
};

function getRelation<T>(value: T | T[] | null | undefined) {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function getClassName(
  value: { name?: string | null } | { name?: string | null }[] | null | undefined
) {
  return getRelation(value)?.name || "Turma não informada";
}

export default async function DashboardPage() {
  const [
    studentsResponse,
    classesResponse,
    coursesResponse,
    gradesResponse,
    attendanceResponse,
    observationsResponse,
    submissionsResponse,
    activitiesResponse,
  ] = await Promise.all([
    supabase
      .from("students")
      .select(
        "id, name, average, attendance, class_id, class_name, course_id, course_name, birth_date, status, photo_path, photo_status, identity_mode, avatar_key"
      )
      .eq("archived", false)
      .order("name", { ascending: true }),
    supabase.from("classes").select("id, name").order("name", { ascending: true }),
    supabase.from("courses").select("id, name").order("name", { ascending: true }),
    supabase
      .from("grades")
      .select("id, student_id, title, score, date")
      .order("date", { ascending: true }),
    supabase
      .from("attendance")
      .select("id, student_id, status, date")
      .order("date", { ascending: true }),
    supabase
      .from("observations")
      .select("id, student_id, content, category, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("submissions")
      .select(
        `
          id,
          student_id,
          status,
          grade,
          activity_id,
          activities (
            id,
            title,
            due_date,
            class_id,
            classes (name)
          )
        `
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("activities")
      .select("id, title, due_date, class_id, classes(name)")
      .order("due_date", { ascending: true }),
  ]);

  const students: DashboardStudent[] = (studentsResponse.data ?? []).map((student) => ({
    id: String(student.id),
    name: String(student.name ?? "Aluno"),
    classId: student.class_id ? String(student.class_id) : null,
    className: student.class_name ? String(student.class_name) : null,
    courseId: student.course_id ? String(student.course_id) : null,
    courseName: student.course_name ? String(student.course_name) : null,
    birthDate: student.birth_date ? String(student.birth_date) : null,
    status: student.status ? String(student.status) : null,
    average: Number(student.average ?? 0),
    attendance: Number(student.attendance ?? 0),
    photoPath: student.photo_path ? String(student.photo_path) : null,
    photoStatus: student.photo_status ? String(student.photo_status) : null,
    identityMode: student.identity_mode ? String(student.identity_mode) : null,
    avatarKey: student.avatar_key ? String(student.avatar_key) : null,
  }));

  const classes: DashboardClass[] = (classesResponse.data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name ?? "Turma"),
  }));

  const courses: DashboardCourse[] = (coursesResponse.data ?? []).map((item) => ({
    id: String(item.id),
    name: String(item.name ?? "Curso"),
  }));

  const grades: DashboardGrade[] = (gradesResponse.data ?? []).map((item) => ({
    id: String(item.id),
    studentId: String(item.student_id ?? ""),
    title: String(item.title ?? "Avaliação"),
    score: Number(item.score ?? 0),
    date: item.date ? String(item.date) : null,
  }));

  const attendance: DashboardAttendance[] = (attendanceResponse.data ?? []).map(
    (item) => ({
      id: String(item.id),
      studentId: String(item.student_id ?? ""),
      status: String(item.status ?? ""),
      date: item.date ? String(item.date) : null,
    })
  );

  const observations: DashboardObservation[] = (observationsResponse.data ?? []).map(
    (item) => ({
      id: String(item.id),
      studentId: String(item.student_id ?? ""),
      content: String(item.content ?? ""),
      category: String(item.category ?? "Pedagógica"),
      createdAt: item.created_at ? String(item.created_at) : null,
    })
  );

  const submissions: DashboardSubmission[] = (
    (submissionsResponse.data as unknown as RawSubmission[] | null) ?? []
  ).map((item) => {
    const activity = getRelation(item.activities);

    return {
      id: String(item.id),
      studentId: item.student_id ? String(item.student_id) : null,
      status: item.status ? String(item.status) : null,
      grade: item.grade === null || item.grade === undefined ? null : Number(item.grade),
      activityId: activity?.id
        ? String(activity.id)
        : item.activity_id
        ? String(item.activity_id)
        : null,
      activityTitle: String(activity?.title ?? "Atividade"),
      dueDate: activity?.due_date ? String(activity.due_date) : null,
      classId: activity?.class_id ? String(activity.class_id) : null,
      className: getClassName(activity?.classes),
    };
  });

  const activities: DashboardActivity[] = (
    (activitiesResponse.data as unknown as RawActivity[] | null) ?? []
  ).map((item) => ({
    id: String(item.id),
    title: String(item.title ?? "Atividade"),
    dueDate: item.due_date ? String(item.due_date) : null,
    classId: item.class_id ? String(item.class_id) : null,
    className: getClassName(item.classes),
  }));

  return (
    <>
      <RealtimeDashboardUpdater />
      <TeacherDashboard
        students={students}
        classes={classes}
        courses={courses}
        grades={grades}
        attendance={attendance}
        observations={observations}
        submissions={submissions}
        activities={activities}
      />
    </>
  );
}
