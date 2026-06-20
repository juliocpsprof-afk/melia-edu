import type { ReactNode } from "react";

import { StudentPhotoPortalOverlay } from "@/components/aluno/StudentPhotoPortalOverlay";

export default function AlunoLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <StudentPhotoPortalOverlay />
    </>
  );
}
