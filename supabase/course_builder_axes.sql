alter table public.courses
  add column if not exists curriculum_status text not null default 'in_progress';

alter table public.courses
  drop constraint if exists courses_curriculum_status_check;

alter table public.courses
  add constraint courses_curriculum_status_check
  check (curriculum_status in ('in_progress', 'ready'));

create table if not exists public.course_axes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  workload_hours integer not null,
  axis_order integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint course_axes_name_check check (char_length(trim(name)) >= 2),
  constraint course_axes_workload_check check (workload_hours > 0),
  constraint course_axes_order_check check (axis_order > 0),
  constraint course_axes_unique_name unique (course_id, name)
);

create index if not exists course_axes_course_order_idx
  on public.course_axes(course_id, axis_order);

alter table public.curriculum_lessons
  add column if not exists axis_id uuid references public.course_axes(id) on delete set null,
  add column if not exists subject text,
  add column if not exists lesson_type text not null default 'Aula',
  add column if not exists duration_minutes integer not null default 60;

alter table public.curriculum_lessons
  drop constraint if exists curriculum_lessons_duration_check;

alter table public.curriculum_lessons
  add constraint curriculum_lessons_duration_check
  check (duration_minutes = 60);

alter table public.course_axes enable row level security;

drop policy if exists "Teachers manage course axes" on public.course_axes;
create policy "Teachers manage course axes"
on public.course_axes
for all
to authenticated
using (true)
with check (true);

grant select, insert, update, delete on public.course_axes to authenticated;

notify pgrst, 'reload schema';
