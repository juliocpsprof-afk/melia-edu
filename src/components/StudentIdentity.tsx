"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSafeStudentAvatar } from "@/lib/studentAvatars";
import { getStudentPhotoMetadata } from "@/lib/studentPhoto";

type StudentIdentityProps = {
  studentId: string;
  name: string;
  photoPath?: string | null;
  photoStatus?: string | null;
  identityMode?: "photo" | "avatar" | string | null;
  avatarKey?: string | null;
  viewer: "teacher" | "student";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  expandable?: boolean;
  className?: string;
  showStatus?: boolean;
};

const sizeClasses = {
  xs: "h-7 w-7 text-sm",
  sm: "h-9 w-9 text-base",
  md: "h-12 w-12 text-xl",
  lg: "h-16 w-16 text-2xl",
  xl: "h-24 w-24 text-4xl",
};

const imageCache = new Map<string, string>();

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function StudentIdentity({
  studentId,
  name,
  photoPath = null,
  photoStatus = null,
  identityMode = "avatar",
  avatarKey = null,
  viewer,
  size = "md",
  expandable = true,
  className = "",
  showStatus = false,
}: StudentIdentityProps) {
  const [signedUrl, setSignedUrl] = useState<string | null>(() => {
    if (!photoPath) return null;
    return imageCache.get(`${studentId}:${photoPath}`) ?? null;
  });
  const [imageFailed, setImageFailed] = useState(false);
  const [open, setOpen] = useState(false);

  const shouldUsePhoto =
    viewer === "teacher" || identityMode === "photo";

  useEffect(() => {
    let cancelled = false;

    async function loadPhoto() {
      if (!photoPath || !shouldUsePhoto) {
        setSignedUrl(null);
        return;
      }

      const cacheKey = `${studentId}:${photoPath}`;
      const cached = imageCache.get(cacheKey);

      if (cached) {
        setSignedUrl(cached);
        return;
      }

      try {
        const payload = await getStudentPhotoMetadata({
          studentId,
          viewer,
        });

        const url =
          typeof payload.signedUrl === "string" ? payload.signedUrl : null;

        if (!cancelled && url) {
          imageCache.set(cacheKey, url);
          setSignedUrl(url);
          setImageFailed(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar foto do aluno:", error);
          setSignedUrl(null);
        }
      }
    }

    loadPhoto();

    return () => {
      cancelled = true;
    };
  }, [studentId, photoPath, viewer, shouldUsePhoto]);

  const displayPhoto = Boolean(
    shouldUsePhoto && signedUrl && !imageFailed
  );

  const statusClass = useMemo(() => {
    if (photoStatus === "approved") {
      return "ring-2 ring-emerald-400/70";
    }

    if (photoStatus === "rejected") {
      return "ring-2 ring-red-400/70";
    }

    if (photoPath) {
      return "ring-2 ring-yellow-400/70";
    }

    return "ring-1 ring-slate-700";
  }, [photoPath, photoStatus]);

  const avatar = getSafeStudentAvatar(avatarKey);

  return (
    <>
      <button
        type="button"
        data-student-identity="true"
        title={
          displayPhoto && expandable
            ? `Ampliar foto de ${name}`
            : name
        }
        onClick={(event) => {
          event.stopPropagation();

          if (displayPhoto && expandable) {
            setOpen(true);
          }
        }}
        className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-violet-500/30 via-cyan-500/20 to-slate-900 font-black text-white shadow-lg ${sizeClasses[size]} ${statusClass} ${className}`}
      >
        {displayPhoto ? (
          <img
            src={signedUrl ?? ""}
            alt={`Foto de ${name}`}
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : viewer === "student" || avatarKey ? (
          <span aria-hidden="true">{avatar}</span>
        ) : (
          <span>{getInitials(name)}</span>
        )}

        {showStatus && photoStatus !== "approved" && (
          <span
            className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-950 ${
              photoStatus === "rejected"
                ? "bg-red-400"
                : photoPath
                ? "bg-yellow-300"
                : "bg-slate-500"
            }`}
          />
        )}
      </button>

      {open && signedUrl && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${name}`}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) {
              setOpen(false);
            }
          }}
        >
          <div
            data-no-student-photo="true"
            className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950 p-5 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/80 text-white shadow-lg transition hover:bg-slate-800"
              aria-label="Fechar foto ampliada"
            >
              <X size={20} />
            </button>

            <img
              src={signedUrl}
              alt={`Foto ampliada de ${name}`}
              className="aspect-square w-full rounded-[28px] object-cover"
            />

            <p className="mt-4 text-center text-xl font-black text-white">
              {name}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
