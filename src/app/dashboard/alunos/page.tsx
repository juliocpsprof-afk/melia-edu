import {
  Mail,
  Phone,
  Search,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import { supabase } from "../../../lib/supabase";
import { StudentRegistrationArea } from "../../../components/StudentRegistrationArea";
import { DeleteStudentButton } from "../../../components/DeleteStudentButton";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  email: string;
  class_name: string;
  course_name: string;
  phone: string;
  average: number;
  attendance: number;
  status: string;
};

type ClassItem = {
  id: string;
  name: string;
};

type CourseItem = {
  id: string;
  name: string;
};

export default async function AlunosPage() {
  const { data: students, error } = await supabase
    .from("students")
    .select("*")
    .order("name", { ascending: true });

  const { data: classes, error: classesError } = await supabase
    .from("classes")
    .select("id, name")
    .order("name", { ascending: true });

  const { data: courses, error: coursesError } = await supabase
    .from("courses")
    .select("id, name")
    .order("name", { ascending: true });

  if (error || classesError || coursesError) {
    return (
      <div className="p-6 text-white">
        <h1 className="text-3xl font-bold">Erro ao carregar dados</h1>

        <p className="mt-2 text-red-300">
          {error?.message ||
            classesError?.message ||
            coursesError?.message}
        </p>
      </div>
    );
  }

  const totalStudents = students?.length ?? 0;

  const attentionStudents =
    students?.filter((student) => student.status === "Atenção").length ?? 0;

  const totalClasses = classes?.length ?? 0;

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-950/40 px-6 py-5">
  <div>
    <h1 className="text-3xl font-bold">Alunos</h1>

    <p className="mt-1 text-slate-400">
      Cadastre alunos vinculados às turmas reais do sistema.
    </p>
  </div>
</header>

      <section className="p-6">
        <StudentRegistrationArea
  classes={(classes as ClassItem[]) ?? []}
  courses={(courses as CourseItem[]) ?? []}
/>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <SummaryCard
            title="Total de alunos"
            value={String(totalStudents)}
            icon={<Users />}
          />

          <SummaryCard
            title="Em atenção"
            value={String(attentionStudents)}
            icon={<TrendingUp />}
          />

          <SummaryCard
            title="Turmas vinculadas"
            value={String(totalClasses)}
            icon={<UserRound />}
          />
        </div>

        <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h2 className="text-2xl font-bold">Lista de alunos</h2>

            <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 px-4 md:w-80">
              <Search size={20} className="text-slate-400" />

              <input
                placeholder="Buscar aluno..."
                className="w-full bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-800">
            <table className="w-full border-collapse">
              <thead className="bg-slate-950/70 text-left text-sm text-slate-400">
                <tr>
                  <th className="p-4">Aluno</th>
                  <th className="p-4">Turma</th>
                  <th className="p-4">Curso</th>
                  <th className="p-4">Telefone</th>
                  <th className="p-4">Média</th>
                  <th className="p-4">Frequência</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>

              <tbody>
                {(students as Student[] | null)?.map((student) => (
                  <tr
                    key={student.id}
                    className="border-t border-slate-800 transition hover:bg-white/[0.03]"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-violet-500 font-bold">
                          {student.name.charAt(0)}
                        </div>

                        <div>
                          <Link
                            href={`/dashboard/alunos/${student.id}`}
                            className="font-semibold transition hover:text-violet-300"
                          >
                            {student.name}
                          </Link>

                          <p className="text-sm text-slate-400">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      {student.class_name || "Sem turma"}
                    </td>

                    <td className="p-4 text-slate-300">
                      {student.course_name || "Sem curso"}
                    </td>

                    <td className="p-4 text-slate-300">
                      {student.phone || "-"}
                    </td>

                    <td className="p-4 font-semibold">
                      {student.average}
                    </td>

                    <td className="p-4 font-semibold">
                      {student.attendance}%
                    </td>

                    <td className="p-4">
                      <StatusBadge status={student.status} />
                    </td>

                    <td className="p-4">
                      <div className="flex gap-2">
                        <button className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5">
                          <Mail size={18} />
                        </button>

                        <button className="rounded-xl border border-slate-700 p-2 text-slate-300 transition hover:bg-white/5">
                          <Phone size={18} />
                        </button>

                        <DeleteStudentButton studentId={student.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </>
  );
}

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-400">
        {icon}
      </div>

      <p className="text-slate-400">{title}</p>

      <h3 className="mt-3 text-4xl font-bold">{value}</h3>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Excelente"
      ? "bg-emerald-500/10 text-emerald-300"
      : status === "Atenção"
      ? "bg-amber-500/10 text-amber-300"
      : "bg-blue-500/10 text-blue-300";

  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${styles}`}>
      {status}
    </span>
  );
}