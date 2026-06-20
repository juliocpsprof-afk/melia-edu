"use client";

import { useEffect, useState } from "react";

import { StudentIdentity } from "@/components/StudentIdentity";
import type { StudentPhotoData } from "@/components/StudentPhotoUploader";
import { getStudentPhotoMetadata } from "@/lib/studentPhoto";

type StudentSession = {
  studentId: string;
  studentName: string;
};

export function StudentPortalIdentity({
  fallbackName,
}: {
  fallbackName: string;
}) {
  const [student, setStudent] = useState<StudentPhotoData | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stored = sessionStorage.getItem("melia_student_session");

      if (!stored) return;

      try {
        const session = JSON.parse(stored) as StudentSession;
        const payload = await getStudentPhotoMetadata({
          studentId: session.studentId,
          viewer: "student",
        });

        if (!cancelled) {
          setStudent(payload.student as StudentPhotoData);
        }
      } catch (error) {
        console.error("Erro ao carregar identidade do aluno:", error);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!student) {
    return (
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-lg font-black text-cyan-200">
        {fallbackName.trim().charAt(0).toUpperCase() || "A"}
      </div>
    );
  }

  return (
    <StudentIdentity
      studentId={student.id}
      name={student.name}
      photoPath={student.photo_path}
      photoStatus={student.photo_status}
      identityMode={student.identity_mode}
      avatarKey={student.avatar_key}
      viewer="student"
      size="sm"
      expandable
    />
  );
}
