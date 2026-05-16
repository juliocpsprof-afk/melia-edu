import { supabase } from "../../../lib/supabase";
import { AttendanceActions } from "../../../components/AttendanceActions";

type Student = {
  id: string;
  name: string;
  class_name: string;
  attendance: {
    status: string;
  }[];
};

export default async function FrequenciaPage() {
  const { data: students, error } = await supabase
    .from("students")
    .select(`
      id,
      name,
      class_name,
      attendance (
        status
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar frequência</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Frequência</h1>
        <p className="mt-1 text-slate-400">
          Registre presença, falta ou atraso dos alunos.
        </p>
      </header>

      <section className="p-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold">Chamada de hoje</h2>

          <div className="mt-6 space-y-4">
            {(students as Student[] | null)?.map((student) => {
              const presencas =
                student.attendance?.filter(
                  (item) => item.status === "Presente"
                ).length ?? 0;

              const faltas =
                student.attendance?.filter(
                  (item) => item.status === "Falta"
                ).length ?? 0;

              const atrasos =
                student.attendance?.filter(
                  (item) => item.status === "Atraso"
                ).length ?? 0;

              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-950/40 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-slate-400">
                      {student.class_name}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                      <AttendanceBadge color="emerald" label={`Presenças: ${presencas}`} />
                      <AttendanceBadge color="red" label={`Faltas: ${faltas}`} />
                      <AttendanceBadge color="amber" label={`Atrasos: ${atrasos}`} />
                    </div>
                  </div>

                  <AttendanceActions studentId={student.id} />
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

function AttendanceBadge({
  label,
  color,
}: {
  label: string;
  color: "emerald" | "red" | "amber";
}) {
  const styles = {
    emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
    red: "bg-red-500/10 text-red-300 border-red-500/20",
    amber: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  };

  return (
    <span className={`rounded-full border px-3 py-1 ${styles[color]}`}>
      {label}
    </span>
  );
}