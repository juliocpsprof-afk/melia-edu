import { supabase } from "../../../lib/supabase";
import { NewGradeForm } from "../../../components/NewGradeForm";

type Student = {
  id: string;
  name: string;
  class_name: string;
  grades: {
    title: string;
    score: number;
    date: string;
  }[];
};

export default async function NotasPage() {
  const { data: students, error } = await supabase
    .from("students")
    .select(`
      id,
      name,
      class_name,
      grades (
        title,
        score,
        date
      )
    `)
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar notas</h1>
        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Notas</h1>
        <p className="mt-1 text-slate-400">
          Lance avaliações e acompanhe a média dos alunos.
        </p>
      </header>

      <section className="p-6">
        <NewGradeForm students={(students as Student[]) ?? []} />

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-2xl font-bold">Histórico de notas</h2>

          <div className="mt-6 space-y-4">
            {(students as Student[] | null)?.map((student) => {
              const grades = student.grades ?? [];
              const average =
                grades.length > 0
                  ? grades.reduce((sum, grade) => sum + Number(grade.score), 0) /
                    grades.length
                  : 0;

              return (
                <div
                  key={student.id}
                  className="rounded-2xl border border-slate-800 bg-slate-950/40 p-5"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold">{student.name}</p>
                      <p className="text-sm text-slate-400">{student.class_name}</p>
                    </div>

                    <div className="rounded-xl bg-violet-500/10 px-4 py-2 text-violet-300">
                      Média: {average.toFixed(1)}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {grades.length === 0 ? (
                      <p className="text-sm text-slate-500">Nenhuma nota lançada.</p>
                    ) : (
                      grades.map((grade, index) => (
                        <div
                          key={index}
                          className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
                        >
                          <p className="font-medium">{grade.title}</p>
                          <p className="mt-1 text-2xl font-bold text-violet-300">
                            {grade.score}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {grade.date}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}