"use client";

import { Camera, Loader2, Settings, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

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

function getReminderKey(studentId: string) {
  return `melia_photo_reminder_dismissed:${studentId}`;
}

export function StudentPhotoPortalOverlay() {
  const pathname = usePathname();
  const [student, setStudent] = useState<StudentPhotoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [error, setError] = useState("");

  const photoMissing = useMemo(() => {
    return Boolean(
      student &&
        (!student.photo_path || student.photo_status === "rejected")
    );
  }, [student]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const stored = sessionStorage.getItem("melia_student_session");

      if (!stored) {
        setStudent(null);
        setSettingsOpen(false);
        setReminderOpen(false);
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

        if (cancelled) return;

        const nextStudent = payload.student as StudentPhotoData;
        const reminderDismissed =
          sessionStorage.getItem(getReminderKey(session.studentId)) === "true";

        setStudent(nextStudent);
        setError("");
        setReminderOpen(
          Boolean(
            (!nextStudent.photo_path ||
              nextStudent.photo_status === "rejected") &&
              !reminderDismissed
          )
        );
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

  function dismissReminder() {
    if (student) {
      sessionStorage.setItem(getReminderKey(student.id), "true");
    }

    setReminderOpen(false);
  }

  function openPhotoSettings() {
    setReminderOpen(false);
    setSettingsOpen(true);
  }

  function handleUpdated(nextStudent: StudentPhotoData) {
    setStudent(nextStudent);

    if (nextStudent.photo_path && nextStudent.photo_status !== "rejected") {
      sessionStorage.removeItem(getReminderKey(nextStudent.id));
      setReminderOpen(false);
    }
  }

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

  return (
    <>
      {reminderOpen && photoMissing && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Aviso para completar a foto do perfil"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              dismissReminder();
            }
          }}
        >
          <div
            data-no-student-photo="true"
            className="relative w-full max-w-xl rounded-[32px] border border-violet-400/30 bg-gradient-to-br from-slate-900 via-slate-950 to-violet-950/40 p-6 text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={dismissReminder}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-300 transition hover:bg-slate-800 hover:text-white"
              aria-label="Fechar aviso"
            >
              <X size={19} />
            </button>

            <div className="flex items-start gap-4 pr-10">
              <div className="rounded-2xl bg-violet-500/20 p-3 text-violet-200">
                <Camera size={28} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-wide text-violet-200">
                  Complete seu perfil
                </p>

                <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                  Inclua uma foto quando puder
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  A foto ajuda o professor a reconhecer você com mais rapidez.
                  Ela deve mostrar seu rosto de frente e com boa iluminação, mas
                  você pode continuar usando o portal e enviar a imagem depois.
                </p>

                {student.photo_status === "rejected" &&
                  student.photo_rejection_reason && (
                    <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      Motivo da solicitação de nova foto:{" "}
                      {student.photo_rejection_reason}
                    </div>
                  )}
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={dismissReminder}
                className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 font-semibold text-slate-300 transition hover:bg-slate-800"
              >
                Fazer depois
              </button>

              <button
                type="button"
                onClick={openPhotoSettings}
                className="rounded-2xl bg-violet-500 px-4 py-3 font-semibold text-white transition hover:bg-violet-400"
              >
                Enviar foto agora
              </button>
            </div>
          </div>
        </div>
      )}

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
          className="fixed inset-0 z-[160] overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setSettingsOpen(false);
            }
          }}
        >
          <div
            data-no-student-photo="true"
            className="mx-auto my-6 max-w-2xl"
          >
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
              onUpdated={handleUpdated}
            />
          </div>
        </div>
      )}
    </>
  );
}
