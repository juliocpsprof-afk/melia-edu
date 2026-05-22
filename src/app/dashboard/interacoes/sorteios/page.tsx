import { InteractionDrawTool } from "../../../../components/InteractionDrawTool";
import { supabase } from "../../../../lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

type Activity = {
  id: string;
  title: string;
  class_id: string | null;
  due_date: string | null;
  archived: boolean | null;
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

  const { data: activities } = await supabase
    .from("activities")
    .select("id, title, class_id, due_date, archived")
    .order("due_date", { ascending: false });

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Sorteios</h1>

        <p className="mt-1 text-slate-400">
          Sorteie alunos ou monte equipes de forma automática, vinculando ou não
          a uma atividade.
        </p>
      </header>

      <section className="p-6">
        <InteractionDrawTool
          classes={(classes as ClassItem[]) ?? []}
          students={(students as Student[]) ?? []}
          activities={(activities as Activity[]) ?? []}
        />
      </section>
    </>
  );
}