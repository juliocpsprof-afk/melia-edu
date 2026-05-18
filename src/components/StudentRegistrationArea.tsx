"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { NewStudentForm } from "./NewStudentForm";
import { BulkStudentImport } from "./BulkStudentImport";

type ClassItem = {
  id: string;
  name: string;
};

type CourseItem = {
  id: string;
  name: string;
};

type Props = {
  classes: ClassItem[];
  courses: CourseItem[];
};

export function StudentRegistrationArea({ classes, courses }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-8">
      <div className="flex justify-end">
        <button
          onClick={() => setOpen((current) => !current)}
          className="flex items-center gap-3 rounded-2xl bg-violet-500 px-5 py-3 font-semibold transition hover:bg-violet-400"
        >
          {open ? <X size={22} /> : <Plus size={22} />}
          {open ? "Fechar cadastro" : "Novo aluno"}
        </button>
      </div>

      {open && (
        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <NewStudentForm classes={classes} courses={courses} />
          <BulkStudentImport classes={classes} courses={courses} />
        </div>
      )}
    </div>
  );
}