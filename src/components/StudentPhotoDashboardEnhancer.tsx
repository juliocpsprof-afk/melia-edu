"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSafeStudentAvatar } from "@/lib/studentAvatars";
import { supabase } from "@/lib/supabase";

type StudentPhotoIndexItem = {
  id: string;
  name: string | null;
  photo_path: string | null;
  photo_status: string | null;
  avatar_key: string | null;
};

type PreparedStudent = {
  id: string;
  name: string;
  shortName: string;
  photoUrl: string | null;
  photoStatus: string | null;
  avatar: string;
};

function getShortStudentName(name: string) {
  const ignoredParticles = ["da", "de", "do", "das", "dos", "e"];

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !ignoredParticles.includes(part.toLowerCase()));

  if (parts.length <= 3) {
    return parts.join(" ");
  }

  return parts.slice(0, 3).join(" ");
}

function normalizeName(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function StudentPhotoDashboardEnhancer() {
  const [students, setStudents] = useState<PreparedStudent[]>([]);
  const [selected, setSelected] = useState<PreparedStudent | null>(null);

  const studentByVisibleName = useMemo(() => {
    const candidates = new Map<string, PreparedStudent[]>();

    students.forEach((student) => {
      const names = new Set([
        normalizeName(student.name),
        normalizeName(student.shortName),
      ]);

      names.forEach((visibleName) => {
        if (!visibleName) return;

        candidates.set(visibleName, [
          ...(candidates.get(visibleName) ?? []),
          student,
        ]);
      });
    });

    const uniqueNames = new Map<string, PreparedStudent>();

    candidates.forEach((items, visibleName) => {
      if (items.length === 1) {
        uniqueNames.set(visibleName, items[0]);
      }
    });

    return uniqueNames;
  }, [students]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const { data, error } = await supabase
        .from("students")
        .select("id, name, photo_path, photo_status, avatar_key")
        .eq("archived", false);

      if (error) {
        console.error("Erro ao carregar fotos dos alunos:", error.message);
        return;
      }

      const rawStudents =
        (data as StudentPhotoIndexItem[] | null) ?? [];

      const photoPaths = rawStudents
        .map((student) => student.photo_path)
        .filter((path): path is string => Boolean(path));

      const signedUrlByPath = new Map<string, string>();

      if (photoPaths.length > 0) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("student-photos")
            .createSignedUrls(photoPaths, 60 * 60);

        if (signedError) {
          console.error(
            "Erro ao assinar fotos dos alunos:",
            signedError.message
          );
        } else {
          signedData?.forEach((item, index) => {
            const path = photoPaths[index];

            if (path && item.signedUrl) {
              signedUrlByPath.set(path, item.signedUrl);
            }
          });
        }
      }

      const prepared = rawStudents.map((student) => {
        const name = String(student.name ?? "Aluno");

        return {
          id: String(student.id),
          name,
          shortName: getShortStudentName(name),
          photoUrl: student.photo_path
            ? signedUrlByPath.get(student.photo_path) ?? null
            : null,
          photoStatus: student.photo_status,
          avatar: getSafeStudentAvatar(student.avatar_key),
        };
      });

      if (!cancelled) {
        setStudents(prepared);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (studentByVisibleName.size === 0) return;

    const selector = [
      "p",
      "span",
      "a",
      "h1",
      "h2",
      "h3",
      "h4",
      "td",
      "button",
      "label",
    ].join(",");

    function enhance() {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(selector)
      );

      elements.forEach((element) => {
        if (
          element.dataset.studentPhotoEnhanced === "true" ||
          element.closest(
            "[data-student-identity], select, option, input, textarea, [data-no-student-photo]"
          )
        ) {
          return;
        }

        if (element.children.length > 1) {
          return;
        }

        const visibleText = normalizeName(element.textContent ?? "");
        let student: PreparedStudent | undefined =
          studentByVisibleName.get(visibleText);

        if (!student && visibleText.length <= 80) {
          const matches = students.filter((candidate) => {
            const fullName = normalizeName(candidate.name);
            const shortName = normalizeName(candidate.shortName);

            return (
              (visibleText.endsWith(fullName) &&
                visibleText.length <= fullName.length + 8) ||
              (visibleText.endsWith(shortName) &&
                visibleText.length <= shortName.length + 8)
            );
          });

          student = matches.length === 1 ? matches[0] : undefined;
        }

        if (!student) return;

        const button = document.createElement("button");
        button.type = "button";
        button.dataset.studentPhotoInjected = "true";
        button.title = student.photoUrl
          ? `Ampliar foto de ${student.name}`
          : `${student.name} — foto pendente`;
        button.style.width = "30px";
        button.style.height = "30px";
        button.style.minWidth = "30px";
        button.style.borderRadius = "9999px";
        button.style.overflow = "hidden";
        button.style.display = "inline-flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.marginRight = "8px";
        button.style.verticalAlign = "middle";
        button.style.border =
          student.photoStatus === "approved"
            ? "2px solid rgba(52, 211, 153, 0.8)"
            : student.photoStatus === "rejected"
            ? "2px solid rgba(248, 113, 113, 0.8)"
            : "2px solid rgba(250, 204, 21, 0.7)";
        button.style.background = "rgba(15, 23, 42, 0.95)";
        button.style.cursor = student.photoUrl ? "zoom-in" : "default";
        button.style.fontSize = "16px";
        button.style.flexShrink = "0";

        if (student.photoUrl) {
          const image = document.createElement("img");
          image.src = student.photoUrl;
          image.alt = `Foto de ${student.name}`;
          image.style.width = "100%";
          image.style.height = "100%";
          image.style.objectFit = "cover";
          button.appendChild(image);

          button.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            setSelected(student);
          });
        } else {
          button.textContent = student.avatar;
        }

        element.dataset.studentPhotoEnhanced = "true";
        element.dataset.studentPhotoOriginalDisplay = element.style.display;
        element.dataset.studentPhotoOriginalAlignItems =
          element.style.alignItems;
        element.style.display =
          getComputedStyle(element).display === "inline"
            ? "inline-flex"
            : "flex";
        element.style.alignItems = "center";
        element.prepend(button);
      });
    }

    enhance();

    const observer = new MutationObserver(() => {
      window.requestAnimationFrame(enhance);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();

      document
        .querySelectorAll<HTMLElement>("[data-student-photo-enhanced='true']")
        .forEach((element) => {
          element
            .querySelectorAll("[data-student-photo-injected='true']")
            .forEach((injected) => injected.remove());

          element.style.display =
            element.dataset.studentPhotoOriginalDisplay ?? "";
          element.style.alignItems =
            element.dataset.studentPhotoOriginalAlignItems ?? "";
          delete element.dataset.studentPhotoEnhanced;
          delete element.dataset.studentPhotoOriginalDisplay;
          delete element.dataset.studentPhotoOriginalAlignItems;
        });
    };
  }, [studentByVisibleName, students]);

  if (!selected?.photoUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onMouseDown={(event) => {
        if (event.currentTarget === event.target) {
          setSelected(null);
        }
      }}
    >
      <div
        data-no-student-photo="true"
        className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950 p-5 shadow-2xl"
      >
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/80 text-white"
          aria-label="Fechar"
        >
          <X size={20} />
        </button>

        <img
          src={selected.photoUrl}
          alt={`Foto ampliada de ${selected.name}`}
          className="aspect-square w-full rounded-[28px] object-cover"
        />

        <p className="mt-4 text-center text-xl font-black text-white">
          {selected.name}
        </p>
      </div>
    </div>
  );
}
