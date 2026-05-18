import { supabase } from "../../../../lib/supabase";
import { AttendanceHistoryFilter } from "../../../../components/AttendanceHistoryFilter";

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
        <h1 className="text-3xl font-bold">
          Erro ao carregar histórico
        </h1>

        <p className="mt-2 text-red-300">
          {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">
          Histórico de Frequência
        </h1>

        <p className="mt-1 text-slate-400">
          Consulte chamadas registradas,
          atrasos e observações.
        </p>
      </header>

      <section className="p-6">
        <AttendanceHistoryFilter
          attendance={
            (attendance as AttendanceItem[]) ?? []
          }
        />
      </section>
    </>
  );
}