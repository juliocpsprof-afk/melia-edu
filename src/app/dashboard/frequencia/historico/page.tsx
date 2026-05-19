import { supabase } from "../../../../lib/supabase";
import { AttendanceHistoryFilter } from "../../../../components/AttendanceHistoryFilter";

type RawRelatedName =
  | {
      name?: string | null;
    }
  | {
      name?: string | null;
    }[]
  | null;

type RawRelatedDiary =
  | {
      content?: string | null;
    }
  | {
      content?: string | null;
    }[]
  | null;

type RawAttendanceItem = {
  id: string;
  date: string;
  status: string;
  arrival_time: string | null;
  notes: string | null;
  students: RawRelatedName;
  classes: RawRelatedName;
  lesson_diary: RawRelatedDiary;
};

type AttendanceItem = {
  id: string;
  date: string;
  status: string;
  arrival_time: string | null;
  notes: string | null;
  students: {
    name: string;
  } | null;
  classes: {
    name: string;
  } | null;
  lesson_diary: {
    content: string;
  } | null;
};

function getName(data: RawRelatedName, fallback: string) {
  if (!data) {
    return fallback;
  }

  if (Array.isArray(data)) {
    return data[0]?.name || fallback;
  }

  return data.name || fallback;
}

function getDiaryContent(data: RawRelatedDiary) {
  if (!data) {
    return "";
  }

  if (Array.isArray(data)) {
    return data[0]?.content || "";
  }

  return data.content || "";
}

export default async function HistoricoFrequenciaPage() {
  const { data: attendance, error } = await supabase
    .from("attendance")
    .select(`
      id,
      date,
      status,
      arrival_time,
      notes,
      students (
        name
      ),
      classes (
        name
      ),
      lesson_diary (
        content
      )
    `)
    .order("date", { ascending: false });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar histórico</h1>

        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  const rawAttendance = (attendance as unknown as RawAttendanceItem[] | null) ?? [];

  const safeAttendance: AttendanceItem[] = rawAttendance.map((item) => ({
    id: String(item.id),
    date: String(item.date),
    status: String(item.status),
    arrival_time: item.arrival_time,
    notes: item.notes,
    students: {
      name: getName(item.students, "Aluno"),
    },
    classes: {
      name: getName(item.classes, "Turma"),
    },
    lesson_diary: {
      content: getDiaryContent(item.lesson_diary),
    },
  }));

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Histórico de Frequência</h1>

        <p className="mt-1 text-slate-400">
          Consulte chamadas registradas, atrasos e observações.
        </p>
      </header>

      <section className="p-6">
        <AttendanceHistoryFilter attendance={safeAttendance} />
      </section>
    </>
  );
}