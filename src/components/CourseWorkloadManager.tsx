"use client";

import { CourseBuilderWizard } from "@/components/course-studio/CourseBasicsStep";

type CourseWorkload = {
  id: string;
  name: string;
  status: string | null;
  total_workload_minutes: number;
};

export function CourseWorkloadManager({ courses }: { courses: CourseWorkload[] }) {
  void courses;
  return <CourseBuilderWizard />;
}
