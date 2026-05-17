import { CalendarDays, GraduationCap, Trash2 } from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { NewActivityForm } from "../../../components/NewActivityForm";

type ClassItem = {
  id: string;
  name: string;
};

type Activity = {
  id: string;
  title: string;
  description: string;
  due_date: string;
  classes: {
    name: string;
  } | null;
};

export default async function AtividadesPage() {
  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: activities, error: activitiesError } = await supabase
    .from("activities")
    .select(`
      id,
      title,
      description,
      due_date,
      classes (
        name
      )
    `)
    .order("due_date", { ascending: true });

  if (classesError || activitiesError) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar atividades</h1>
        <p className="mt-2 text-red-300">
          {classesError?.message || activitiesError?.message}
        </p>
      </div>
    );
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
        <h1 className="text-3xl font-bold">Atividades</h1>

        <p className="mt-1 text-slate-400">
          Crie atividades por turma e acompanhe os prazos.
        </p>
      </header>

      <section className="p-6">
        <NewActivityForm classes={(classes as ClassItem[]) ?? []} />

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(activities as Activity[] | null)?.length === 0 ? (
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
              Nenhuma atividade cadastrada.
            </div>
          ) : (
            (activities as Activity[] | null)?.map((activity) => (
              <div
                key={activity.id}
                className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-violet-500/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
                    <GraduationCap size={32} />
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300">
                    {activity.classes?.name || "Sem turma"}
                  </span>
                </div>

                <h2 className="mt-6 text-2xl font-bold">{activity.title}</h2>

                <p className="mt-3 line-clamp-3 text-slate-400">
                  {activity.description}
                </p>

                <div className="mt-6 flex items-center gap-3 text-slate-300">
                  <CalendarDays size={20} className="text-violet-400" />

                  <span>
                    Entrega:{" "}
                    {new Date(activity.due_date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </>
  );
}