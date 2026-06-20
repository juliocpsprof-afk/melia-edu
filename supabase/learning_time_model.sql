-- Modelo de carga horária, trajetória do aluno e frequência ponderada
-- Execute este arquivo uma vez no SQL Editor do Supabase.

create extension if not exists pgcrypto;

-- A turma é permanente. Ela define apenas a rotina atual de aulas.
alter table public.classes
  add column if not exists schedule_days smallint[] not null default '{}'::smallint[],
  add column if not exists weekly_workload_minutes integer not null default 0,
  add column if not exists default_session_minutes integer not null default 60;

alter table public.classes
  drop constraint if exists classes_weekly_workload_minutes_check;
alter table public.classes
  add constraint classes_weekly_workload_minutes_check
  check (weekly_workload_minutes >= 0);

alter table public.classes
  drop constraint if exists classes_default_session_minutes_check;
alter table public.classes
  add constraint classes_default_session_minutes_check
  check (default_session_minutes > 0);

alter table public.classes
  drop constraint if exists classes_schedule_days_check;
alter table public.classes
  add constraint classes_schedule_days_check
  check (
    schedule_days <@ array[1,2,3,4,5,6,7]::smallint[]
    and cardinality(schedule_days) <= 7
  );

-- O curso possui a carga horária base. A turma não tem data de término.
alter table public.courses
  add column if not exists total_workload_minutes integer not null default 0;

alter table public.courses
  drop constraint if exists courses_total_workload_minutes_check;
alter table public.courses
  add constraint courses_total_workload_minutes_check
  check (total_workload_minutes >= 0);

-- Cada presença passa a carregar minutos previstos e minutos efetivamente cumpridos.
alter table public.attendance
  add column if not exists course_id uuid references public.courses(id) on delete set null,
  add column if not exists scheduled_minutes integer,
  add column if not exists attended_minutes integer;

alter table public.attendance
  drop constraint if exists attendance_scheduled_minutes_check;
alter table public.attendance
  add constraint attendance_scheduled_minutes_check
  check (scheduled_minutes is null or scheduled_minutes > 0);

alter table public.attendance
  drop constraint if exists attendance_attended_minutes_check;
alter table public.attendance
  add constraint attendance_attended_minutes_check
  check (
    attended_minutes is null
    or attended_minutes >= 0
  );

-- Histórico de passagem do aluno pelas turmas.
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
  constraint student_class_enrollments_status_check
    check (status in ('active', 'transferred', 'completed', 'cancelled')),
  constraint student_class_enrollments_dates_check
    check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists student_class_enrollments_one_active_idx
  on public.student_class_enrollments(student_id)
  where status = 'active' and ended_at is null;

create index if not exists student_class_enrollments_student_idx
  on public.student_class_enrollments(student_id, started_at desc);

-- Trajetória do aluno no curso. Mudar de turma não reinicia este registro.
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
  constraint student_course_progress_status_check
    check (status in ('active', 'paused', 'completed', 'transferred', 'cancelled')),
  constraint student_course_progress_override_check
    check (base_workload_minutes_override is null or base_workload_minutes_override >= 0),
  constraint student_course_progress_dates_check
    check (ended_at is null or ended_at >= started_at)
);

create unique index if not exists student_course_progress_one_active_course_idx
  on public.student_course_progress(student_id, course_id)
  where status in ('active', 'paused') and ended_at is null;

create index if not exists student_course_progress_student_idx
  on public.student_course_progress(student_id, started_at desc);

-- Ajustes individuais: mudam a carga obrigatória ou creditam/corrigem horas cumpridas.
create table if not exists public.student_workload_adjustments (
  id uuid primary key default gen_random_uuid(),
  progress_id uuid not null references public.student_course_progress(id) on delete cascade,
  adjustment_kind text not null,
  minutes_delta integer not null,
  reason text not null,
  effective_date date not null default current_date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint student_workload_adjustments_kind_check
    check (adjustment_kind in ('required', 'completed')),
  constraint student_workload_adjustments_delta_check
    check (minutes_delta <> 0),
  constraint student_workload_adjustments_reason_check
    check (char_length(trim(reason)) >= 3)
);

create index if not exists student_workload_adjustments_progress_idx
  on public.student_workload_adjustments(progress_id, effective_date desc);

-- Preenche curso e duração automaticamente em chamadas novas.
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
  select
    greatest(coalesce(c.default_session_minutes, 60), 1),
    s.course_id
  into class_session_minutes, current_course_id
  from public.students s
  left join public.classes c on c.id = new.class_id
  where s.id = new.student_id;

  new.scheduled_minutes := greatest(
    coalesce(new.scheduled_minutes, class_session_minutes, 60),
    1
  );

  if new.course_id is null then
    new.course_id := current_course_id;
  end if;

  if new.attended_minutes is null then
    if new.status = 'Falta' then
      new.attended_minutes := 0;
    else
      new.attended_minutes := new.scheduled_minutes;
    end if;
  end if;

  new.attended_minutes := greatest(
    0,
    least(new.attended_minutes, new.scheduled_minutes)
  );

  return new;
end;
$$;

drop trigger if exists attendance_prepare_minutes_trigger on public.attendance;
create trigger attendance_prepare_minutes_trigger
before insert or update of student_id, class_id, course_id, status, scheduled_minutes, attended_minutes
on public.attendance
for each row
execute function public.prepare_attendance_minutes();

-- Backfill das chamadas já existentes usando a duração padrão da turma.
update public.attendance a
set
  course_id = coalesce(a.course_id, s.course_id),
  scheduled_minutes = coalesce(
    a.scheduled_minutes,
    greatest(coalesce(c.default_session_minutes, 60), 1)
  ),
  attended_minutes = coalesce(
    a.attended_minutes,
    case
      when a.status = 'Falta' then 0
      else greatest(coalesce(c.default_session_minutes, 60), 1)
    end
  )
from public.students s
left join public.classes c on c.id = a.class_id
where s.id = a.student_id;

-- Mantém o campo legado students.attendance com cálculo ponderado por minutos.
create or replace function public.weighted_attendance_percentage(target_student_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce(sum(a.scheduled_minutes), 0) <= 0 then 0
    else round(
      greatest(0, least(100,
        (sum(coalesce(a.attended_minutes, 0))::numeric /
         sum(a.scheduled_minutes)::numeric) * 100
      )),
      2
    )
  end
  from public.attendance a
  where a.student_id = target_student_id;
$$;

create or replace function public.keep_student_attendance_weighted()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.attendance := public.weighted_attendance_percentage(new.id);
  return new;
end;
$$;

drop trigger if exists students_keep_weighted_attendance_trigger on public.students;
create trigger students_keep_weighted_attendance_trigger
before update of attendance on public.students
for each row
execute function public.keep_student_attendance_weighted();

create or replace function public.refresh_weighted_attendance_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_student_id uuid;
begin
  affected_student_id := coalesce(new.student_id, old.student_id);

  update public.students
  set attendance = public.weighted_attendance_percentage(affected_student_id)
  where id = affected_student_id;

  if tg_op = 'UPDATE' and old.student_id is distinct from new.student_id then
    update public.students
    set attendance = public.weighted_attendance_percentage(old.student_id)
    where id = old.student_id;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists attendance_refresh_weighted_trigger on public.attendance;
create trigger attendance_refresh_weighted_trigger
after insert or update or delete on public.attendance
for each row
execute function public.refresh_weighted_attendance_after_change();

-- Registra automaticamente mudanças de turma e curso no histórico do aluno.
create or replace function public.sync_student_learning_history()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  enrollment_start date;
begin
  enrollment_start := current_date;

  if tg_op = 'INSERT' then
    if new.class_id is not null then
      insert into public.student_class_enrollments (
        student_id, class_id, started_at, status
      ) values (
        new.id, new.class_id, enrollment_start, 'active'
      ) on conflict do nothing;
    end if;

    if new.course_id is not null then
      insert into public.student_course_progress (
        student_id, course_id, started_at, status
      ) values (
        new.id, new.course_id, enrollment_start, 'active'
      ) on conflict do nothing;
    end if;

    return new;
  end if;

  if old.class_id is distinct from new.class_id then
    update public.student_class_enrollments
    set
      ended_at = current_date,
      status = 'transferred',
      updated_at = now()
    where student_id = new.id
      and status = 'active'
      and ended_at is null;

    if new.class_id is not null then
      insert into public.student_class_enrollments (
        student_id, class_id, started_at, status, change_reason
      ) values (
        new.id, new.class_id, current_date, 'active', 'Mudança de turma'
      );
    end if;
  end if;

  if old.course_id is distinct from new.course_id then
    update public.student_course_progress
    set
      ended_at = current_date,
      status = 'transferred',
      updated_at = now()
    where student_id = new.id
      and status in ('active', 'paused')
      and ended_at is null;

    if new.course_id is not null then
      insert into public.student_course_progress (
        student_id, course_id, started_at, status
      ) values (
        new.id, new.course_id, current_date, 'active'
      ) on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists students_sync_learning_history_trigger on public.students;
create trigger students_sync_learning_history_trigger
after insert or update of class_id, course_id on public.students
for each row
execute function public.sync_student_learning_history();

-- Backfill: usa a primeira chamada registrada como melhor aproximação da entrada.
insert into public.student_class_enrollments (
  student_id,
  class_id,
  started_at,
  status,
  change_reason
)
select
  s.id,
  s.class_id,
  coalesce(min(a.date), current_date),
  'active',
  'Importação inicial do histórico atual'
from public.students s
left join public.attendance a
  on a.student_id = s.id
 and a.class_id = s.class_id
where s.class_id is not null
  and not exists (
    select 1
    from public.student_class_enrollments e
    where e.student_id = s.id
      and e.status = 'active'
      and e.ended_at is null
  )
group by s.id, s.class_id;

insert into public.student_course_progress (
  student_id,
  course_id,
  started_at,
  status
)
select
  s.id,
  s.course_id,
  coalesce(min(a.date), current_date),
  'active'
from public.students s
left join public.attendance a
  on a.student_id = s.id
 and a.course_id = s.course_id
where s.course_id is not null
  and not exists (
    select 1
    from public.student_course_progress p
    where p.student_id = s.id
      and p.course_id = s.course_id
      and p.status in ('active', 'paused')
      and p.ended_at is null
  )
group by s.id, s.course_id;

-- Estima a data de conclusão usando os dias da semana da turma atual.
create or replace function public.estimate_learning_completion_date(
  p_schedule_days smallint[],
  p_weekly_minutes integer,
  p_remaining_minutes integer
)
returns date
language plpgsql
stable
set search_path = public
as $$
declare
  cursor_date date := current_date;
  remaining numeric := greatest(coalesce(p_remaining_minutes, 0), 0);
  daily_minutes numeric;
  safety_counter integer := 0;
begin
  if remaining <= 0 then
    return current_date;
  end if;

  if coalesce(p_weekly_minutes, 0) <= 0
     or coalesce(cardinality(p_schedule_days), 0) = 0 then
    return null;
  end if;

  daily_minutes := p_weekly_minutes::numeric / cardinality(p_schedule_days);

  while remaining > 0 and safety_counter < 3650 loop
    cursor_date := cursor_date + 1;
    safety_counter := safety_counter + 1;

    if extract(isodow from cursor_date)::smallint = any(p_schedule_days) then
      remaining := remaining - daily_minutes;
    end if;
  end loop;

  if remaining > 0 then
    return null;
  end if;

  return cursor_date;
end;
$$;

create or replace view public.student_learning_progress
with (security_invoker = true)
as
with adjustment_totals as (
  select
    progress_id,
    coalesce(sum(minutes_delta) filter (where adjustment_kind = 'required'), 0) as required_adjustment_minutes,
    coalesce(sum(minutes_delta) filter (where adjustment_kind = 'completed'), 0) as completed_adjustment_minutes
  from public.student_workload_adjustments
  group by progress_id
),
attendance_totals as (
  select
    p.id as progress_id,
    coalesce(sum(a.scheduled_minutes), 0) as scheduled_minutes,
    coalesce(sum(a.attended_minutes), 0) as attended_minutes,
    count(a.id) as attendance_records
  from public.student_course_progress p
  left join public.attendance a
    on a.student_id = p.student_id
   and a.course_id = p.course_id
   and a.date >= p.started_at
   and (p.ended_at is null or a.date <= p.ended_at)
  group by p.id
),
base as (
  select
    p.id as progress_id,
    p.student_id,
    s.name as student_name,
    p.course_id,
    c.name as course_name,
    p.started_at,
    p.ended_at,
    p.status,
    s.class_id as current_class_id,
    cl.name as current_class_name,
    cl.schedule_days,
    cl.weekly_workload_minutes,
    cl.default_session_minutes,
    coalesce(p.base_workload_minutes_override, c.total_workload_minutes, 0) as base_workload_minutes,
    coalesce(adj.required_adjustment_minutes, 0) as required_adjustment_minutes,
    coalesce(adj.completed_adjustment_minutes, 0) as completed_adjustment_minutes,
    coalesce(att.scheduled_minutes, 0) as scheduled_minutes,
    coalesce(att.attended_minutes, 0) as attended_minutes,
    coalesce(att.attendance_records, 0) as attendance_records
  from public.student_course_progress p
  join public.students s on s.id = p.student_id
  join public.courses c on c.id = p.course_id
  left join public.classes cl on cl.id = s.class_id
  left join adjustment_totals adj on adj.progress_id = p.id
  left join attendance_totals att on att.progress_id = p.id
)
select
  base.*,
  greatest(0, base.base_workload_minutes + base.required_adjustment_minutes) as required_minutes,
  greatest(0, base.attended_minutes + base.completed_adjustment_minutes) as completed_minutes,
  greatest(
    0,
    greatest(0, base.base_workload_minutes + base.required_adjustment_minutes)
    - greatest(0, base.attended_minutes + base.completed_adjustment_minutes)
  ) as remaining_minutes,
  case
    when greatest(0, base.base_workload_minutes + base.required_adjustment_minutes) <= 0 then 0
    else round(
      least(
        100,
        greatest(0, base.attended_minutes + base.completed_adjustment_minutes)::numeric
        / greatest(1, base.base_workload_minutes + base.required_adjustment_minutes)::numeric
        * 100
      ),
      2
    )
  end as progress_percentage,
  case
    when base.scheduled_minutes <= 0 then 0
    else round(
      least(100, greatest(0, base.attended_minutes)::numeric / base.scheduled_minutes::numeric * 100),
      2
    )
  end as attendance_percentage,
  case
    when coalesce(base.weekly_workload_minutes, 0) <= 0 then null
    else round(
      greatest(
        0,
        greatest(0, base.base_workload_minutes + base.required_adjustment_minutes)
        - greatest(0, base.attended_minutes + base.completed_adjustment_minutes)
      )::numeric / base.weekly_workload_minutes::numeric,
      1
    )
  end as estimated_weeks_remaining,
  public.estimate_learning_completion_date(
    base.schedule_days,
    base.weekly_workload_minutes,
    greatest(
      0,
      greatest(0, base.base_workload_minutes + base.required_adjustment_minutes)
      - greatest(0, base.attended_minutes + base.completed_adjustment_minutes)
    )
  ) as estimated_completion_date,
  case
    when base.attended_minutes < 600 or base.attendance_records < 3 then 'initial'
    when base.attended_minutes < 2400 or base.attendance_records < 8 then 'moderate'
    else 'consolidated'
  end as evidence_level
from base;

alter table public.student_class_enrollments enable row level security;
alter table public.student_course_progress enable row level security;
alter table public.student_workload_adjustments enable row level security;

drop policy if exists "Teachers manage class enrollment history" on public.student_class_enrollments;
create policy "Teachers manage class enrollment history"
on public.student_class_enrollments
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Teachers manage course progress" on public.student_course_progress;
create policy "Teachers manage course progress"
on public.student_course_progress
for all
to authenticated
using (true)
with check (true);

drop policy if exists "Teachers manage workload adjustments" on public.student_workload_adjustments;
create policy "Teachers manage workload adjustments"
on public.student_workload_adjustments
for all
to authenticated
using (true)
with check (true);

grant select on public.student_learning_progress to authenticated;
grant execute on function public.weighted_attendance_percentage(uuid) to authenticated;
grant execute on function public.estimate_learning_completion_date(smallint[], integer, integer) to authenticated;

-- Atualiza o percentual legado de todos os alunos após o backfill.
update public.students s
set attendance = public.weighted_attendance_percentage(s.id);

notify pgrst, 'reload schema';
