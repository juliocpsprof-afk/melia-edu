import { Suspense } from "react";
import StudentPinLogin from "@/components/aluno/StudentPinLogin";

export default function AlunoLoginPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <StudentPinLogin />
    </Suspense>
  );
}