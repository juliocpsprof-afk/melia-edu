import StudentList from "@/components/aluno/StudentList";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AlunoTurmaPage({ params }: PageProps) {
  const { id } = await params;

  return <StudentList classId={id} />;
}