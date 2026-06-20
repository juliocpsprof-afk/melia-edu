"use client";

import { Camera, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import {
  StudentPhotoUploader,
  type StudentPhotoData,
} from "@/components/StudentPhotoUploader";
import { getSafeStudentAvatar } from "@/lib/studentAvatars";
import { supabase } from "@/lib/supabase";

type RawStudent = StudentPhotoData & {
  class_name?: string | null;
  archived?: boolean | null;
};

type PreparedStudent = RawStudent & {
  name: string;
  shortName: string;
  photoUrl: string | null;
  avatar: string;
};

type PhotoFilter = "all" | "with" | "without" | "pending" | "rejected";

function normalize(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getShortName(name: string) {
  const ignored = ["da", "de", "do", "das", "dos", "e"];
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((part) => !ignored.includes(part.toLowerCase()));

  return parts.length <= 3 ? parts.join(" ") : parts.slice(0, 3).join(" ");
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return "A";
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function getStudentIdFromHref(href: string | null) {
  return href?.match(/\/dashboard\/alunos\/([^/?#]+)/)?.[1] ?? "";
}

function photoMatches(student: PreparedStudent, filter: PhotoFilter) {
  if (filter === "with") return Boolean(student.photo_path);
  if (filter === "without") return !student.photo_path;
  if (filter === "rejected") return student.photo_status === "rejected";
  if (filter === "pending") {
    return Boolean(
      student.photo_path &&
        student.photo_status !== "approved" &&
        student.photo_status !== "rejected"
    );
  }
  return true;
}

function getBorder(student: PreparedStudent) {
  if (student.photo_status === "approved") {
    return "2px solid rgba(52, 211, 153, 0.8)";
  }
  if (student.photo_status === "rejected") {
    return "2px solid rgba(248, 113, 113, 0.8)";
  }
  if (student.photo_path) {
    return "2px solid rgba(250, 204, 21, 0.75)";
  }
  return "1px solid rgba(100, 116, 139, 0.8)";
}

export function StudentPhotoDashboardEnhancer() {
  const pathname = usePathname();
  const [students, setStudents] = useState<PreparedStudent[]>([]);
  const [zoomStudent, setZoomStudent] = useState<PreparedStudent | null>(null);
  const [editingStudent, setEditingStudent] =
    useState<PreparedStudent | null>(null);

  const byId = useMemo(
    () => new Map(students.map((student) => [student.id, student])),
    [students]
  );

  const byUniqueName = useMemo(() => {
    const candidates = new Map<string, PreparedStudent[]>();

    students.forEach((student) => {
      [student.name, student.shortName].forEach((name) => {
        const key = normalize(name);
        candidates.set(key, [...(candidates.get(key) ?? []), student]);
      });
    });

    const result = new Map<string, PreparedStudent>();
    candidates.forEach((items, name) => {
      if (items.length === 1) result.set(name, items[0]);
    });

    return result;
  }, [students]);

  useEffect(() => {
    let cancelled = false;

    async function loadStudents() {
      const { data, error } = await supabase
        .from("students")
        .select(
          "id, name, class_name, archived, photo_path, photo_status, photo_uploaded_by, photo_updated_at, photo_approved_at, photo_rejection_reason, identity_mode, avatar_key, photo_required"
        );

      if (error) {
        console.error("Erro ao carregar fotos dos alunos:", error.message);
        return;
      }

      const raw = (data as RawStudent[] | null) ?? [];
      const paths = Array.from(
        new Set(
          raw
            .map((student) => student.photo_path)
            .filter((path): path is string => Boolean(path))
        )
      );
      const urlByPath = new Map<string, string>();

      if (paths.length > 0) {
        const { data: signedData, error: signedError } =
          await supabase.storage
            .from("student-photos")
            .createSignedUrls(paths, 60 * 60);

        if (signedError) {
          console.error("Erro ao assinar fotos:", signedError.message);
        } else {
          signedData?.forEach((item, index) => {
            if (item.signedUrl) urlByPath.set(paths[index], item.signedUrl);
          });
        }
      }

      const prepared = raw.map((student) => {
        const name = String(student.name ?? "Aluno");

        return {
          ...student,
          id: String(student.id),
          name,
          shortName: getShortName(name),
          photoUrl: student.photo_path
            ? urlByPath.get(student.photo_path) ?? null
            : null,
          avatar: getSafeStudentAvatar(student.avatar_key),
        };
      });

      if (!cancelled) setStudents(prepared);
    }

    loadStudents();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    if (students.length === 0) return;

    let activeFilter: PhotoFilter = "all";
    let frame = 0;

    function fillHost(
      host: HTMLElement,
      student: PreparedStudent,
      size: number
    ) {
      if (host.dataset.studentPhotoHost === student.id) return;

      host.dataset.studentPhotoHost = student.id;
      host.innerHTML = "";
      Object.assign(host.style, {
        width: `${size}px`,
        height: `${size}px`,
        minWidth: `${size}px`,
        borderRadius: "9999px",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        border: getBorder(student),
        background: "rgba(30, 41, 59, 0.95)",
        color: "white",
        fontWeight: "800",
        fontSize: `${Math.max(15, Math.round(size * 0.28))}px`,
        cursor: student.photoUrl ? "zoom-in" : "default",
      });
      host.title = student.photoUrl
        ? `Ampliar foto de ${student.name}`
        : `${student.name} — sem foto`;

      if (student.photoUrl) {
        const image = document.createElement("img");
        image.src = student.photoUrl;
        image.alt = `Foto de ${student.name}`;
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";
        host.appendChild(image);
        host.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          setZoomStudent(student);
        };
      } else {
        host.textContent = getInitials(student.name);
        host.onclick = null;
      }
    }

    function findStudent(element: HTMLElement) {
      const text = normalize(element.textContent ?? "");
      const exact = byUniqueName.get(text);
      if (exact) return exact;

      const matches = students.filter((student) => {
        const full = normalize(student.name);
        const short = normalize(student.shortName);
        return (
          (text.endsWith(full) && text.length <= full.length + 10) ||
          (text.endsWith(short) && text.length <= short.length + 10)
        );
      });

      return matches.length === 1 ? matches[0] : undefined;
    }

    function findProminentHost(element: HTMLElement) {
      let current: HTMLElement | null = element;

      for (let level = 0; level < 6 && current; level += 1) {
        const candidate = current.querySelector<HTMLElement>(
          "div.h-24.w-24, div.h-20.w-20, div.h-16.w-16, div.h-14.w-14, div.h-12.w-12, div.h-11.w-11"
        );
        if (candidate) return candidate;
        current = current.parentElement;
      }

      return null;
    }

    function addInlinePhoto(element: HTMLElement, student: PreparedStudent) {
      if (element.dataset.studentPhotoEnhanced === "true") return;

      const photo = document.createElement("button");
      photo.type = "button";
      photo.dataset.studentPhotoInjected = "true";
      Object.assign(photo.style, {
        width: "32px",
        height: "32px",
        minWidth: "32px",
        marginRight: "8px",
        borderRadius: "9999px",
        overflow: "hidden",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: "0",
        border: getBorder(student),
        background: "rgba(15, 23, 42, 0.95)",
        color: "white",
        fontWeight: "800",
        cursor: student.photoUrl ? "zoom-in" : "default",
      });

      if (student.photoUrl) {
        const image = document.createElement("img");
        image.src = student.photoUrl;
        image.alt = `Foto de ${student.name}`;
        image.style.width = "100%";
        image.style.height = "100%";
        image.style.objectFit = "cover";
        photo.appendChild(image);
        photo.onclick = (event) => {
          event.preventDefault();
          event.stopPropagation();
          setZoomStudent(student);
        };
      } else {
        photo.textContent = getInitials(student.name);
      }

      element.dataset.studentPhotoEnhanced = "true";
      element.style.display =
        getComputedStyle(element).display === "inline" ? "inline-flex" : "flex";
      element.style.alignItems = "center";
      element.prepend(photo);
    }

    function createEditorButton(student: PreparedStudent) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.studentPhotoEditorButton = "true";
      button.className =
        "flex h-10 items-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/20";
      button.innerHTML = `<span aria-hidden="true">📷</span><span>${
        student.photo_path ? "Alterar foto" : "Incluir foto"
      }</span>`;
      button.onclick = (event) => {
        event.preventDefault();
        event.stopPropagation();
        setEditingStudent(student);
      };
      return button;
    }

    function enhanceStudentList() {
      if (pathname !== "/dashboard/alunos") return;

      document
        .querySelectorAll<HTMLAnchorElement>(
          'tbody a[href^="/dashboard/alunos/"]'
        )
        .forEach((link) => {
          const student = byId.get(getStudentIdFromHref(link.getAttribute("href")));
          const row = link.closest("tr") as HTMLTableRowElement | null;
          if (!student || !row) return;

          const host = row.querySelector<HTMLElement>("div.h-11.w-11");
          if (host) fillHost(host, student, 44);

          link.dataset.studentPhotoEnhanced = "true";

          const actions = row.lastElementChild?.querySelector<HTMLElement>(
            "div.flex"
          );
          if (
            actions &&
            !actions.querySelector("[data-student-photo-editor-button]")
          ) {
            actions.prepend(createEditorButton(student));
          }
        });
    }

    function enhanceProfile() {
      const match = pathname.match(/^\/dashboard\/alunos\/([^/]+)$/);
      if (!match) return;

      const student = byId.get(match[1]);
      const header = document.querySelector<HTMLElement>("header");
      if (!student || !header) return;

      const host = header.querySelector<HTMLElement>("div.h-24.w-24");
      if (host) fillHost(host, student, 96);

      if (header.querySelector("[data-student-profile-photo-editor]")) return;

      const resetButton = Array.from(
        header.querySelectorAll<HTMLButtonElement>("button")
      ).find((button) =>
        normalize(button.textContent ?? "").includes("Resetar PIN")
      );
      const actions = resetButton?.parentElement;
      if (!actions) return;

      const button = createEditorButton(student);
      button.dataset.studentProfilePhotoEditor = "true";
      button.className =
        "inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-500/20";
      actions.prepend(button);
    }

    function applyFilter() {
      if (pathname !== "/dashboard/alunos") return;

      let visible = 0;
      document
        .querySelectorAll<HTMLAnchorElement>(
          'tbody a[href^="/dashboard/alunos/"]'
        )
        .forEach((link) => {
          const student = byId.get(getStudentIdFromHref(link.getAttribute("href")));
          const row = link.closest("tr") as HTMLTableRowElement | null;
          if (!student || !row) return;

          const show = photoMatches(student, activeFilter);
          if (show) visible += 1;

          let current: HTMLTableRowElement | null = row;
          while (current) {
            current.style.display = show ? "" : "none";
            const next = current.nextElementSibling as HTMLTableRowElement | null;
            if (next?.querySelector('a[href^="/dashboard/alunos/"]')) break;
            current = next;
          }
        });

      Array.from(document.querySelectorAll<HTMLElement>("div, p, span"))
        .filter((element) =>
          /^\d+ aluno\(s\) encontrado\(s\)$/.test(
            normalize(element.textContent ?? "")
          )
        )
        .forEach((element) => {
          element.textContent = `${visible} aluno(s) encontrado(s)`;
        });
    }

    function ensureFilter() {
      if (pathname !== "/dashboard/alunos") return;
      if (document.querySelector("[data-student-photo-filter]")) {
        applyFilter();
        return;
      }

      const heading = Array.from(
        document.querySelectorAll<HTMLElement>("div, p, span, h2, h3")
      ).find(
        (element) => normalize(element.textContent ?? "") === "Filtros avançados"
      );
      const grid = heading
        ?.closest<HTMLElement>("div.rounded-3xl")
        ?.querySelector<HTMLElement>("div.grid");
      if (!grid) return;

      const select = document.createElement("select");
      select.dataset.studentPhotoFilter = "true";
      select.className =
        "rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-violet-400";
      select.innerHTML = `
        <option value="all">Todas as fotos</option>
        <option value="with">Com foto</option>
        <option value="without">Sem foto</option>
        <option value="pending">Aguardando aprovação</option>
        <option value="rejected">Foto rejeitada</option>
      `;
      select.onchange = () => {
        activeFilter = select.value as PhotoFilter;
        applyFilter();
      };
      grid.insertBefore(select, grid.lastElementChild);
      applyFilter();
    }

    function enhanceNames() {
      const elements = Array.from(
        document.querySelectorAll<HTMLElement>(
          "p, span, a, h1, h2, h3, h4, td, button, label"
        )
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

        const student = findStudent(element);
        if (!student) return;

        if (pathname === "/dashboard/alunos") return;

        if (/^\/dashboard\/alunos\/[^/]+$/.test(pathname)) {
          if (element.closest("#student-profile-content")) return;
        }

        const host = findProminentHost(element);
        if (host) {
          const size = host.classList.contains("h-24")
            ? 96
            : host.classList.contains("h-16")
            ? 64
            : host.classList.contains("h-14")
            ? 56
            : host.classList.contains("h-11")
            ? 44
            : 48;
          fillHost(host, student, size);
          element.dataset.studentPhotoEnhanced = "true";
          return;
        }

        if (
          pathname === "/dashboard/mensagens" ||
          pathname === "/dashboard/notas"
        ) {
          return;
        }

        addInlinePhoto(element, student);
      });
    }

    function enhance() {
      ensureFilter();
      enhanceStudentList();
      enhanceProfile();
      enhanceNames();
      applyFilter();
    }

    function schedule() {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(enhance);
    }

    enhance();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      document
        .querySelectorAll<HTMLElement>(
          "[data-student-photo-injected], [data-student-photo-editor-button], [data-student-profile-photo-editor], [data-student-photo-filter]"
        )
        .forEach((element) => element.remove());
    };
  }, [pathname, students, byId, byUniqueName]);

  async function handleUpdated(nextStudent: StudentPhotoData) {
    let signedUrl: string | null = null;

    if (nextStudent.photo_path) {
      const { data } = await supabase.storage
        .from("student-photos")
        .createSignedUrl(nextStudent.photo_path, 60 * 60);
      signedUrl = data?.signedUrl
        ? `${data.signedUrl}${data.signedUrl.includes("?") ? "&" : "?"}v=${Date.now()}`
        : null;
    }

    setStudents((current) =>
      current.map((student) =>
        student.id === nextStudent.id
          ? {
              ...student,
              ...nextStudent,
              name: String(nextStudent.name ?? student.name),
              shortName: getShortName(
                String(nextStudent.name ?? student.name)
              ),
              photoUrl: signedUrl,
              avatar: getSafeStudentAvatar(nextStudent.avatar_key),
            }
          : student
      )
    );
  }

  return (
    <>
      {zoomStudent?.photoUrl && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setZoomStudent(null);
          }}
        >
          <div
            data-no-student-photo="true"
            className="relative w-full max-w-md rounded-[32px] border border-white/10 bg-slate-950 p-5 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setZoomStudent(null)}
              className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/80 text-white"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
            <img
              src={zoomStudent.photoUrl}
              alt={`Foto ampliada de ${zoomStudent.name}`}
              className="aspect-square w-full rounded-[28px] object-cover"
            />
            <p className="mt-4 text-center text-xl font-black text-white">
              {zoomStudent.name}
            </p>
          </div>
        </div>
      )}

      {editingStudent && (
        <div
          className="fixed inset-0 z-[230] overflow-y-auto bg-slate-950/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setEditingStudent(null);
          }}
        >
          <div
            data-no-student-photo="true"
            className="mx-auto my-6 max-w-2xl"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-bold text-cyan-100">
                <Camera size={18} />
                {editingStudent.photo_path ? "Alterar foto" : "Incluir foto"}
              </div>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-white"
                aria-label="Fechar editor da foto"
              >
                <X size={20} />
              </button>
            </div>
            <StudentPhotoUploader
              student={editingStudent}
              viewer="teacher"
              onUpdated={handleUpdated}
            />
          </div>
        </div>
      )}
    </>
  );
}
