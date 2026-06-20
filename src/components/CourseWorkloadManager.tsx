"use client";

import { useEffect } from "react";
import { CourseBuilderWizard } from "@/components/course-studio/CourseBasicsStep";

type CourseWorkload = {
  id: string;
  name: string;
  status: string | null;
  total_workload_minutes: number;
};

export function CourseWorkloadManager({ courses }: { courses: CourseWorkload[] }) {
  void courses;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const heading = Array.from(document.querySelectorAll("h2")).find(
        (item) => item.textContent?.trim() === "Novo curso"
      );
      heading?.closest("section")?.classList.add("hidden");
    }, 50);

    return () => window.clearTimeout(timer);
  }, []);

  return <CourseBuilderWizard />;
}
