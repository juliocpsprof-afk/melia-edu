import { supabase } from "../../../lib/supabase";
import { NewGradeForm } from "../../../components/NewGradeForm";
import { GradesHistory } from "../../../components/GradesHistory";

type Grade = {
  title: string;
  score: number;
  date: string;
};

type Student = {
  id: string;
  name: string;
  class_name: string;
  grades: Grade[];
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

  const safeStudents: Student[] =
    (students as Student[] | null)?.map((student) => ({
      id: String(student.id),
      name: String(student.name ?? "Aluno"),
      class_name: String(student.class_name ?? "Sem turma"),
      grades: student.grades ?? [],
    })) ?? [];

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Notas</h1>
        <p className="mt-1 text-slate-400">
          Lance avaliações e acompanhe a média dos alunos.
        </p>
      </header>

      <section className="p-6">
        <NewGradeForm students={safeStudents} />

        <GradesHistory students={safeStudents} />
      </section>
    </>
  );
}