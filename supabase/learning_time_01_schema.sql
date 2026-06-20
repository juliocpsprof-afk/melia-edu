create extension if not exists pgcrypto;

alter table public.classes
  add column if not exists schedule_days smallint[] not null default '{}'::smallint[],
  add column if not exists weekly_workload_minutes integer not null default 0,
  add column if not exists default_session_minutes integer not null default 60;

alter table public.classes drop constraint if exists classes_weekly_workload_minutes_check;
alter table public.classes add constraint classes_weekly_workload_minutes_check check (weekly_workload_minutes >= 0);
alter table public.classes drop constraint if exists classes_default_session_minutes_check;
alter table public.classes add constraint classes_default_session_minutes_check check (default_session_minutes > 0);
alter table public.classes drop constraint if exists classes_schedule_days_check;
alter table public.classes add constraint classes_schedule_days_check check (
  schedule_days <@ array[1,2,3,4,5,6,7]::smallint[]
  and cardinality(schedule_days) <= 7
);

alter table public.courses
  add column if not exists total_workload_minutes integer not null default 0;
alter table public.courses drop constraint if exists courses_total_workload_minutes_check;
alter table public.courses add constraint courses_total_workload_minutes_check check (total_workload_minutes >= 0);

alter table public.attendance
  add column if not exists course_id uuid references public.courses(id) on delete set null,
  add column if not exists scheduled_minutes integer,
  add column if not exists attended_minutes integer;

alter table public.attendance drop constraint if exists attendance_scheduled_minutes_check;
alter table public.attendance add constraint attendance_scheduled_minutes_check check (scheduled_minutes is null or scheduled_minutes > 0);
alter table public.attendance drop constraint if exists attendance_attended_minutes_check;
alter table public.attendance add constraint attendance_attended_minutes_check check (attended_minutes is null or attended_minutes >= 0);

create table if not exists public.student_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete restrict,
  started_at date not null default current_date,
  ended_at date,
  status text not null default 'active',
  change_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_class_enrollments_status_check check (status in ('active','transferred','completed','cancelled')),
  constraint student_class_enrollments_dates_check check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists student_class_enrollments_one_active_idx
  on public.student_class_enrollments(student_id)
  where status = 'active' and ended_at is null;

create table if not exists public.student_course_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete restrict,
  started_at date not null default current_date,
  ended_at date,
  status text not null default 'active',
  base_workload_minutes_override integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_course_progress_status_check check (status in ('active','paused','completed','transferred','cancelled')),
  constraint student_course_progress_override_check check (base_workload_minutes_override is null or base_workload_minutes_override >= 0),
  constraint student_course_progress_dates_check check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists student_course_progress_one_active_course_idx
  on public.student_course_progress(student_id, course_id)
  where status in ('active','paused') and ended_at is null;

create table if not exists public.student_workload_adjustments (
  id uuid primary key default gen_random_uuid(),
  progress_id uuid not null references public.student_course_progress(id) on delete cascade,
  adjustment_kind text not null,
  minutes_delta integer not null,
  reason text not null,
  effective_date date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint student_workload_adjustments_kind_check check (adjustment_kind in ('required','completed')),
  constraint student_workload_adjustments_delta_check check (minutes_delta <> 0),
  constraint student_workload_adjustments_reason_check check (char_length(trim(reason)) >= 3)
);

create or replace function public.prepare_attendance_minutes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  class_session_minutes integer;
  current_course_id uuid;
begin
  select greatest(coalesce(c.default_session_minutes,60),1), s.course_id
  into class_session_minutes, current_course_id
  from public.students s
  left join public.classes c on c.id = new.class_id
  where s.id = new.student_id;

  new.scheduled_minutes := greatest(coalesce(new.scheduled_minutes,class_session_minutes,60),1);
  if new.course_id is null then new.course_id := current_course_id; end if;
  if new.attended_minutes is null then
    new.attended_minutes := case when new.status = 'Falta' then 0 else new.scheduled_minutes end;
  end if;
  new.attended_minutes := greatest(0,least(new.attended_minutes,new.scheduled_minutes));
  return new;
end;
$$;

drop trigger if exists attendance_prepare_minutes_trigger on public.attendance;
create trigger attendance_prepare_minutes_trigger
before insert or update of student_id,class_id,course_id,status,scheduled_minutes,attended_minutes
on public.attendance for each row execute function public.prepare_attendance_minutes();

update public.attendance a
set
  course_id = coalesce(a.course_id,(select s.course_id from public.students s where s.id = a.student_id)),
  scheduled_minutes = coalesce(a.scheduled_minutes,(select greatest(coalesce(c.default_session_minutes,60),1) from public.classes c where c.id = a.class_id),60),
  attended_minutes = coalesce(a.attended_minutes,case when a.status = 'Falta' then 0 else coalesce((select greatest(coalesce(c.default_session_minutes,60),1) from public.classes c where c.id = a.class_id),60) end);

create or replace function public.sync_student_learning_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.class_id is not null then
      insert into public.student_class_enrollments(student_id,class_id,started_at,status)
      values(new.id,new.class_id,current_date,'active') on conflict do nothing;
    end if;
    if new.course_id is not null then
      insert into public.student_course_progress(student_id,course_id,started_at,status)
      values(new.id,new.course_id,current_date,'active') on conflict do nothing;
    end if;
    return new;
  end if;

  if old.class_id is distinct from new.class_id then
    update public.student_class_enrollments
      set ended_at=current_date,status='transferred',updated_at=now()
      where student_id=new.id and status='active' and ended_at is null;
    if new.class_id is not null then
      insert into public.student_class_enrollments(student_id,class_id,started_at,status,change_reason)
      values(new.id,new.class_id,current_date,'active','Mudança de turma');
    end if;
  end if;

  if old.course_id is distinct from new.course_id then
    update public.student_course_progress
      set ended_at=current_date,status='transferred',updated_at=now()
      where student_id=new.id and status in ('active','paused') and ended_at is null;
    if new.course_id is not null then
      insert into public.student_course_progress(student_id,course_id,started_at,status)
      values(new.id,new.course_id,current_date,'active') on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists students_sync_learning_history_trigger on public.students;
create trigger students_sync_learning_history_trigger
after insert or update on public.students
for each row execute function public.sync_student_learning_history();

insert into public.student_class_enrollments(student_id,class_id,started_at,status,change_reason)
select s.id,s.class_id,coalesce(min(a.date),current_date),'active','Importação inicial'
from public.students s
left join public.attendance a on a.student_id=s.id and a.class_id=s.class_id
where s.class_id is not null
and not exists (
  select 1 from public.student_class_enrollments e
  where e.student_id=s.id and e.status='active' and e.ended_at is null
)
group by s.id,s.class_id;

insert into public.student_course_progress(student_id,course_id,started_at,status)
select s.id,s.course_id,coalesce(min(a.date),current_date),'active'
from public.students s
left join public.attendance a on a.student_id=s.id and a.course_id=s.course_id
where s.course_id is not null
and not exists (
  select 1 from public.student_course_progress p
  where p.student_id=s.id and p.course_id=s.course_id
    and p.status in ('active','paused') and p.ended_at is null
)
group by s.id,s.course_id;

notify pgrst,'reload schema';
