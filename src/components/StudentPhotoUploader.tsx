"use client";

import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Upload,
  XCircle,
} from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { StudentIdentity } from "@/components/StudentIdentity";
import { studentAvatars } from "@/lib/studentAvatars";
import {
  reviewStudentPhoto,
  updateStudentIdentityPreference,
  uploadStudentPhoto,
} from "@/lib/studentPhoto";

export type StudentPhotoData = {
  id: string;
  name: string;
  photo_path?: string | null;
  photo_status?: "pending" | "approved" | "rejected" | string | null;
  photo_uploaded_by?: "student" | "teacher" | string | null;
  photo_updated_at?: string | null;
  photo_approved_at?: string | null;
  photo_rejection_reason?: string | null;
  identity_mode?: "photo" | "avatar" | string | null;
  avatar_key?: string | null;
  photo_required?: boolean | null;
};

type StudentPhotoUploaderProps = {
  student: StudentPhotoData;
  viewer: "teacher" | "student";
  compact?: boolean;
  onUpdated?: (student: StudentPhotoData) => void;
};

function getStatusLabel(student: StudentPhotoData) {
  if (!student.photo_path) return "Foto pendente";
  if (student.photo_status === "approved") return "Foto aprovada";
  if (student.photo_status === "rejected") return "Foto rejeitada";
  return "Aguardando aprovação";
}

function getStatusClasses(student: StudentPhotoData) {
  if (!student.photo_path) {
    return "border-slate-700 bg-slate-800/70 text-slate-300";
  }

  if (student.photo_status === "approved") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }

  if (student.photo_status === "rejected") {
    return "border-red-500/30 bg-red-500/10 text-red-200";
  }

  return "border-yellow-500/30 bg-yellow-500/10 text-yellow-100";
}

export function StudentPhotoUploader({
  student: initialStudent,
  viewer,
  compact = false,
  onUpdated,
}: StudentPhotoUploaderProps) {
  const [student, setStudent] = useState(initialStudent);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [confirmedRequirements, setConfirmedRequirements] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferenceLoading, setPreferenceLoading] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  const identityMode =
    student.identity_mode === "photo" ? "photo" : "avatar";

  const avatarKey = student.avatar_key || studentAvatars[0];

  const instructions = useMemo(
    () => [
      "Rosto de frente e centralizado",
      "Ambiente bem iluminado",
      "Somente o aluno na imagem",
      "Sem filtros, óculos escuros ou foto distante",
    ],
    []
  );

  function applyStudentUpdate(nextStudent: StudentPhotoData) {
    setStudent(nextStudent);
    onUpdated?.(nextStudent);
  }

  function handleSelectedFile(file: File | null) {
    setMessage(null);

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: "Selecione uma imagem válida.",
      });
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setConfirmedRequirements(false);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile) {
      setMessage({
        type: "error",
        text: "Escolha ou tire uma foto antes de enviar.",
      });
      return;
    }

    if (!confirmedRequirements) {
      setMessage({
        type: "error",
        text: "Confirme que o rosto está de frente, visível e legível.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = await uploadStudentPhoto({
        studentId: student.id,
        file: selectedFile,
        viewer,
      });

      const nextStudent = payload.student as StudentPhotoData;

      applyStudentUpdate(nextStudent);
      setSelectedFile(null);
      setConfirmedRequirements(false);

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }

      setMessage({
        type: "success",
        text:
          viewer === "teacher"
            ? "Foto enviada e aprovada."
            : "Foto enviada. Ela ficará disponível para o professor e aguardará aprovação.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a foto.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function savePreference(
    nextMode: "photo" | "avatar",
    nextAvatar: string
  ) {
    setPreferenceLoading(true);
    setMessage(null);

    try {
      const payload = await updateStudentIdentityPreference({
        studentId: student.id,
        identityMode: nextMode,
        avatarKey: nextAvatar,
      });

      applyStudentUpdate(payload.student as StudentPhotoData);

      setMessage({
        type: "success",
        text: "Preferência visual salva.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar sua preferência.",
      });
    } finally {
      setPreferenceLoading(false);
    }
  }

  async function handleReview(status: "approved" | "rejected") {
    let reason = "";

    if (status === "rejected") {
      reason =
        window.prompt(
          "Informe o motivo da rejeição: rosto não visível, foto escura, pessoa distante, mais de uma pessoa etc."
        )?.trim() || "";

      if (!reason) {
        return;
      }
    }

    setReviewLoading(true);
    setMessage(null);

    try {
      const payload = await reviewStudentPhoto({
        studentId: student.id,
        status,
        reason,
      });

      applyStudentUpdate(payload.student as StudentPhotoData);

      setMessage({
        type: "success",
        text:
          status === "approved"
            ? "Foto aprovada."
            : "Foto rejeitada e motivo registrado.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível revisar a foto.",
      });
    } finally {
      setReviewLoading(false);
    }
  }

  return (
    <div
      data-no-student-photo="true"
      className={`rounded-3xl border border-slate-800 bg-slate-950/50 ${
        compact ? "p-4" : "p-5"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <StudentIdentity
          studentId={student.id}
          name={student.name}
          photoPath={student.photo_path}
          photoStatus={student.photo_status}
          identityMode={student.identity_mode}
          avatarKey={student.avatar_key}
          viewer={viewer}
          size={compact ? "lg" : "xl"}
          expandable
          showStatus
        />

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-black text-white">
            {student.name}
          </h3>

          <span
            className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusClasses(
              student
            )}`}
          >
            {getStatusLabel(student)}
          </span>

          {student.photo_rejection_reason && (
            <p className="mt-2 text-sm leading-6 text-red-200">
              Motivo: {student.photo_rejection_reason}
            </p>
          )}
        </div>
      </div>

      {!compact && (
        <div className="mt-5 rounded-2xl border border-cyan-500/20 bg-cyan-500/10 p-4">
          <p className="text-sm font-bold text-cyan-100">
            Requisitos da foto
          </p>

          <div className="mt-2 grid gap-2 text-xs text-cyan-50/80 sm:grid-cols-2">
            {instructions.map((instruction) => (
              <span key={instruction} className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-cyan-300" />
                {instruction}
              </span>
            ))}
          </div>
        </div>
      )}

      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) =>
          handleSelectedFile(event.target.files?.[0] ?? null)
        }
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(event) =>
          handleSelectedFile(event.target.files?.[0] ?? null)
        }
      />

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
        >
          <ImagePlus size={17} />
          Escolher foto
        </button>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center justify-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20"
        >
          <Camera size={17} />
          Tirar foto agora
        </button>
      </div>

      {previewUrl && (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="mb-3 text-sm font-bold text-white">
            Prévia antes da compressão
          </p>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <img
              src={previewUrl}
              alt="Prévia da foto escolhida"
              className="h-28 w-28 rounded-full object-cover ring-2 ring-cyan-400/40"
            />

            <div className="flex-1">
              <p className="text-sm leading-6 text-slate-300">
                Ao enviar, a foto será recortada em formato quadrado,
                convertida para WebP e reduzida para 640 × 640 pixels.
              </p>

              <label className="mt-3 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={confirmedRequirements}
                  onChange={(event) =>
                    setConfirmedRequirements(event.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-violet-500"
                />
                <span>
                  Confirmo que o aluno está sozinho, de frente, com o rosto
                  visível e a imagem legível.
                </span>
              </label>

              <button
                type="button"
                onClick={handleUpload}
                disabled={loading || !confirmedRequirements}
                className="mt-3 flex items-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <Upload size={17} />
                )}
                {loading ? "Comprimindo e enviando..." : "Confirmar foto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewer === "student" && (
        <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-violet-300" />
            <p className="font-bold text-white">Como eu quero me ver</p>
          </div>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            O professor sempre verá sua foto real. No seu painel você pode
            escolher a foto ou um avatar.
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => savePreference("photo", avatarKey)}
              disabled={!student.photo_path || preferenceLoading}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                identityMode === "photo"
                  ? "border-cyan-300 bg-cyan-500/20 text-cyan-100"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              Mostrar minha foto
            </button>

            <button
              type="button"
              onClick={() => savePreference("avatar", avatarKey)}
              disabled={preferenceLoading}
              className={`rounded-xl border px-4 py-3 text-sm font-bold transition ${
                identityMode === "avatar"
                  ? "border-violet-300 bg-violet-500/20 text-violet-100"
                  : "border-slate-700 bg-slate-950 text-slate-300"
              }`}
            >
              Mostrar avatar
            </button>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-2 sm:grid-cols-10">
            {studentAvatars.map((avatar) => (
              <button
                key={avatar}
                type="button"
                onClick={() => savePreference("avatar", avatar)}
                disabled={preferenceLoading}
                className={`aspect-square rounded-xl border text-xl transition hover:-translate-y-0.5 ${
                  avatarKey === avatar
                    ? "border-violet-300 bg-violet-500/25"
                    : "border-slate-700 bg-slate-950 hover:border-violet-500/40"
                }`}
                aria-label={`Escolher avatar ${avatar}`}
              >
                {avatar}
              </button>
            ))}
          </div>
        </div>
      )}

      {viewer === "teacher" && student.photo_path && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleReview("approved")}
            disabled={reviewLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-400 disabled:opacity-50"
          >
            <CheckCircle2 size={17} />
            Aprovar foto
          </button>

          <button
            type="button"
            onClick={() => handleReview("rejected")}
            disabled={reviewLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:opacity-50"
          >
            <XCircle size={17} />
            Rejeitar foto
          </button>
        </div>
      )}

      {message && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
              : "border-red-500/30 bg-red-500/10 text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          ) : (
            <XCircle size={17} className="mt-0.5 shrink-0" />
          )}
          {message.text}
        </div>
      )}

      {loading && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
          <RefreshCw size={14} className="animate-spin" />
          A foto original não será armazenada.
        </div>
      )}
    </div>
  );
}
