"use client";

import { useEffect } from "react";

const ignoredParts = new Set(["da", "de", "do", "das", "dos", "e"]);

function shortenStudentName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (parts.length <= 2) return parts.join(" ");

  const secondName =
    parts.slice(1).find((part) => !ignoredParts.has(part.toLowerCase())) ||
    parts[1];

  return `${parts[0]} ${secondName}`;
}

export function RadarStudentNameEnhancer() {
  useEffect(() => {
    function updateNames() {
      const headings = Array.from(document.querySelectorAll("h2"));
      const radarHeading = headings.find(
        (heading) => heading.textContent?.trim() === "Radar pedagógico"
      );
      const radarSection = radarHeading?.closest("section");

      radarSection
        ?.querySelectorAll<HTMLAnchorElement>('a[href^="/dashboard/alunos/"]')
        .forEach((card) => {
          const name = card.querySelector<HTMLElement>("p.font-black.text-white");
          if (!name) return;

          const fullName = name.dataset.fullName || name.textContent?.trim() || "";
          if (!fullName) return;

          name.dataset.fullName = fullName;
          name.textContent = shortenStudentName(fullName);
          name.title = fullName;
          name.classList.add("truncate", "text-sm", "sm:text-base", "leading-tight");
          name.style.maxWidth = "100%";
          name.style.overflow = "hidden";
          name.style.textOverflow = "ellipsis";
          name.style.whiteSpace = "nowrap";
        });
    }

    updateNames();
    const firstUpdate = window.setTimeout(updateNames, 250);
    const secondUpdate = window.setTimeout(updateNames, 1000);

    return () => {
      window.clearTimeout(firstUpdate);
      window.clearTimeout(secondUpdate);
    };
  }, []);

  return null;
}
