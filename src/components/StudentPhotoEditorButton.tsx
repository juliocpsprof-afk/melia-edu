"use client";

import { Camera, ImagePlus, X } from "lucide-react";
import { useState } from "react";

import {
  StudentPhotoUploader,
  type StudentPhotoData,
} from "@/components/StudentPhotoUploader";

type StudentPhotoEditorButtonProps = {
  student: StudentPhotoData;
  label?: string;
  compact?: boolean;
  className?: string;
};

export function StudentPhotoEditorButton({
  student: initialStudent,
  label,
  compact = false,
  className = "",
}: StudentPhotoEditorButtonProps) {
  const [student, setStudent] = useState(initialStudent);
  const [open, setOpen] = useState(false);

  const buttonLabel =
    label || (student.photo_path ? "Alterar foto" : "Incluir foto");

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 font-semibold text-cyan-100 transition hover:bg-cyan-500/20 ${
          compact ? "h-10 px-3 text-xs" : "px-4 py-3 text-sm"
        } ${className}`}
      >
        {student.photo_path ? <Camera size={17} /> : <ImagePlus size={17} />}
        {buttonLabel}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[230] overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={`${buttonLabel} de ${student.name}`}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOpen(false);
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
                onClick={() => setOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-white transition hover:bg-slate-800"
                aria-label="Fechar editor da foto"
              >
                <X size={20} />
              </button>
            </div>

            <StudentPhotoUploader
              student={student}
              viewer="teacher"
              onUpdated={(nextStudent) => {
                setStudent(nextStudent);
                setTimeout(() => {
                  window.location.reload();
                }, 500);
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
