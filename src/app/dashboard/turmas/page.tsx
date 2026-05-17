import { BookOpen, GraduationCap, Users } from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { NewClassForm } from "../../../components/NewClassForm";

type ClassItem = {
  id: string;
  name: string;
  description: string;

  students: {
    id: string;
  }[];
};

export default async function TurmasPage() {
  const { data: classes, error } = await supabase
    .from("classes")
    .select(`
      id,
      name,
      description,
      students (
        id
      )
    `)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">
          Erro ao carregar turmas
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
          Turmas
        </h1>

        <p className="mt-1 text-slate-400">
          Gerencie suas turmas reais.
        </p>
      </header>

      <section className="p-6">
        <NewClassForm />

        <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {(classes as ClassItem[] | null)?.map(
            (classItem) => (
              <TurmaCard
                key={classItem.id}
                name={classItem.name}
                description={classItem.description}
                totalStudents={
                  classItem.students?.length ?? 0
                }
              />
            )
          )}
        </div>
      </section>
    </>
  );
}

function TurmaCard({
  name,
  description,
  totalStudents,
}: {
  name: string;
  description: string;
  totalStudents: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 transition hover:border-violet-500/40">
      <div className="flex items-start justify-between">
        <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
          <GraduationCap size={32} />
        </div>
      </div>

      <h2 className="mt-6 text-2xl font-bold">
        {name}
      </h2>

      <p className="mt-3 text-slate-400">
        {description}
      </p>

      <div className="mt-6 space-y-4">
        <InfoRow
          icon={<Users size={20} />}
          text={`${totalStudents} alunos`}
        />

        <InfoRow
          icon={<BookOpen size={20} />}
          text="Turma ativa"
        />
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3 text-slate-300">
      <div className="text-violet-400">
        {icon}
      </div>

      <span>{text}</span>
    </div>
  );
}