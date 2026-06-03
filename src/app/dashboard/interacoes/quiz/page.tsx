import { QuizManager } from "../../../../components/QuizManager";
import { supabase } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ClassItem = {
  id: string;
  name: string;
};

export default async function QuizPage() {
  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name")
    .neq("status", "Arquivada")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar Quiz</h1>

        <p className="mt-2 text-red-300">{error.message}</p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Quiz</h1>

        <p className="mt-1 text-slate-400">
          Crie quizzes gamificados, embaralhe alternativas, acompanhe respostas
          e gere notas automáticas para os alunos.
        </p>
      </header>

      <section className="p-6">
        <QuizManager classes={(classes as ClassItem[]) ?? []} />
      </section>
    </>
  );
}