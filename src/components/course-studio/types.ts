export type CourseAxis = {
  id: string;
  name: string;
  workload_hours: number;
  axis_order: number;
};

export type CurriculumLesson = {
  id: string;
  title: string;
  content: string;
  notes: string;
  lesson_order: number | null;
  axis_id: string | null;
  subject: string | null;
  lesson_type: string | null;
  duration_minutes: number | null;
};

export type CourseStudioCourse = {
  id: string;
  name: string;
  description: string | null;
  status: string | null;
  total_workload_minutes: number;
  curriculum_status: string | null;
  course_axes: CourseAxis[];
  curriculum_lessons: CurriculumLesson[];
};

export type AxisDraft = {
  key: string;
  name: string;
  hours: string;
};

export type LessonDraft = {
  key: string;
  order: number;
  axis: string;
  subject: string;
  type: string;
  content: string;
};

export type CourseFeedback = {
  type: "success" | "error" | "info";
  text: string;
} | null;
