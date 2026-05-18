import { BookOpen, CalendarDays, GraduationCap } from "lucide-react";
import type { ReactNode } from "react";

export type LessonDiary = {
  id: string;
  lesson_date: string;
  content: string;
  notes: string | null;
  classes: {
    name: string;
  } | null;
};

type DiaryLessonCardsProps = {
  lessons: LessonDiary[];
};

export function DiaryLessonCards({ lessons }: DiaryLessonCardsProps) {
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-2">
      {lessons.length === 0 ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-slate-400">
          Nenhuma aula registrada no diário.
        </div>
      ) : (
        lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6"
          >
            <div className="flex flex-wrap items-center gap-3">
              <Badge
                icon={<GraduationCap size={16} />}
                text={lesson.classes?.name ?? "Sem turma"}
              />

              <Badge
                icon={<CalendarDays size={16} />}
                text={new Date(lesson.lesson_date).toLocaleDateString("pt-BR")}
              />
            </div>

            <div className="mt-6 flex items-start gap-4">
              <div className="rounded-2xl bg-violet-500/15 p-4 text-violet-400">
                <BookOpen size={28} />
              </div>

              <div>
                <h2 className="text-xl font-bold">{lesson.content}</h2>

                {lesson.notes && (
                  <p className="mt-3 leading-7 text-slate-400">
                    {lesson.notes}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function Badge({
  icon,
  text,
}: {
  icon: ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/40 px-3 py-1 text-sm text-slate-300">
      <span className="text-violet-400">{icon}</span>
      {text}
    </div>
  );
}