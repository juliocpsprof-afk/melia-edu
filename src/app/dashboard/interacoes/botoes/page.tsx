import { StudentButtonsManager } from "../../../../components/StudentButtonsManager";
import { supabase } from "../../../../lib/supabase";

type Student = {
  id: string;
  name: string;
  class_name: string | null;
};

export default async function BotoesAlunoPage() {
  const { data: students } = await supabase
    .from("students")
    .select("id, name, class_name")
    .order("name", { ascending: true });

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Botões do aluno</h1>

        <p className="mt-1 text-slate-400">
          Configure atalhos personalizados para aparecerem no portal dos alunos.
        </p>
      </header>

      <section className="p-6">
        <StudentButtonsManager students={(students as Student[]) ?? []} />
      </section>
    </>
  );
}