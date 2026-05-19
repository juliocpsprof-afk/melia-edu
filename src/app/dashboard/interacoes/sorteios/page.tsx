import { InteractionDrawTool } from "../../../../components/InteractionDrawTool";
import { supabase } from "../../../../lib/supabase";

type ClassItem = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  class_id: string | null;
  class_name: string | null;
};

export default async function SorteiosPage() {
  const { data: classes } = await supabase
    .from("classes")
    .select("id, name")
    .neq("status", "Arquivada")
    .order("name", { ascending: true });

  const { data: students } = await supabase
    .from("students")
    .select("id, name, class_id, class_name")
    .order("name", { ascending: true });

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Sorteios</h1>

        <p className="mt-1 text-slate-400">
          Sorteie alunos ou monte equipes de forma automática e aleatória.
        </p>
      </header>

      <section className="p-6">
        <InteractionDrawTool
          classes={(classes as ClassItem[]) ?? []}
          students={(students as Student[]) ?? []}
        />
      </section>
    </>
  );
}