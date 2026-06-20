"use client";

import { Camera, Loader2, Settings, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import {
  StudentPhotoUploader,
  type StudentPhotoData,
} from "@/components/StudentPhotoUploader";
import { getStudentPhotoMetadata } from "@/lib/studentPhoto";

type StudentSession = {
  studentId: string;
  classId: string;
  studentName: string;
};

export function StudentPhotoPortalOverlay() {
  const pathname = usePathname();
  const [student, setStudent] = useState<StudentPhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stored = sessionStorage.getItem("melia_student_session");

      if (!stored) {
        setStudent(null);
        setSettingsOpen(false);
        setError("");
        setLoading(false);
        return;
      }

      try {
        const session = JSON.parse(stored) as StudentSession;
        const payload = await getStudentPhotoMetadata({
          studentId: session.studentId,
          viewer: "student",
        });

        if (!cancelled) {
          setStudent(payload.student as StudentPhotoData);
          setError("");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Não foi possível carregar sua identificação."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  if (loading) {
    return (
      <div className="fixed bottom-4 right-4 z-[90] flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-slate-950/90 px-4 py-3 text-sm text-cyan-100 shadow-2xl">
        <Loader2 size={17} className="animate-spin" />
        Verificando foto...
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-[90] max-w-sm rounded-2xl border border-red-500/30 bg-slate-950/95 px-4 py-3 text-sm text-red-200 shadow-2xl">
        {error}
      </div>
    );
  }

  if (!student) {
    return null;
  }

  const photoIsRequired =
    student.photo_required !== false &&
    (!student.photo_path || student.photo_status === "rejected");

  if (photoIsRequired) {
    return (
      <div className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/95 p-4 backdrop-blur-sm sm:p-6">
        <div className="mx-auto max-w-2xl py-6">
          <div className="mb-5 rounded-[32px] border border-violet-400/30 bg-gradient-to-br from-violet-500/20 via-cyan-500/10 to-slate-950 p-6 text-white shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-2xl bg-violet-500/20 p-3 text-violet-200">
                <Camera size={28} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-violet-200">
                  Identificação obrigatória
                </p>
                <h1 className="mt-2 text-3xl font-black">
                  Envie sua foto para continuar
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-300">
                  A foto deve mostrar seu rosto de frente e com boa iluminação.
                  Ela será usada internamente pelo professor para reconhecer os
                  alunos. Você poderá usar um avatar no seu próprio painel.
                </p>
              </div>
            </div>
          </div>

          <StudentPhotoUploader
            student={student}
            viewer="student"
            onUpdated={(nextStudent) => {
              setStudent(nextStudent);
              setSettingsOpen(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className="fixed bottom-20 right-4 z-[80] flex h-12 items-center gap-2 rounded-2xl border border-violet-400/30 bg-slate-950/90 px-4 text-sm font-bold text-violet-100 shadow-2xl backdrop-blur transition hover:bg-violet-500/20 lg:bottom-6"
      >
        <Settings size={18} />
        Minha foto
      </button>

      {settingsOpen && (
        <div
          className="fixed inset-0 z-[150] overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSettingsOpen(false);
            }
          }}
        >
          <div className="mx-auto my-6 max-w-2xl">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-white"
                aria-label="Fechar configurações da foto"
              >
                <X size={20} />
              </button>
            </div>

            <StudentPhotoUploader
              student={student}
              viewer="student"
              onUpdated={setStudent}
            />
          </div>
        </div>
      )}
    </>
  );
}
