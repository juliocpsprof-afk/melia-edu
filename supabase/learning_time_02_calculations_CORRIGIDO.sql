create or replace function public.weighted_attendance_percentage(target_student_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  select case
    when coalesce(sum(a.scheduled_minutes),0) <= 0 then 0
    else round(
      greatest(0,least(100,
        sum(coalesce(a.attended_minutes,0))::numeric
        / sum(a.scheduled_minutes)::numeric * 100
      )),2
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
for each row execute function public.keep_student_attendance_weighted();

create or replace function public.refresh_weighted_attendance_after_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_student_id uuid;
begin
  affected_student_id := case when tg_op='DELETE' then old.student_id else new.student_id end;

  update public.students
  set attendance = public.weighted_attendance_percentage(affected_student_id)
  where id = affected_student_id;

  if tg_op='UPDATE' and old.student_id is distinct from new.student_id then
    update public.students
    set attendance = public.weighted_attendance_percentage(old.student_id)
    where id = old.student_id;
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists attendance_refresh_weighted_trigger on public.attendance;
create trigger attendance_refresh_weighted_trigger
after insert or update or delete on public.attendance
for each row execute function public.refresh_weighted_attendance_after_change();

drop function if exists public.estimate_learning_completion_date(
  smallint[],
  integer,
  integer
);

create or replace function public.estimate_learning_completion_date(
  p_schedule_days smallint[],
  p_weekly_minutes integer,
  p_remaining_minutes bigint
)
returns date
language plpgsql
stable
set search_path = public
as $$
declare
  cursor_date date := current_date;
  remaining numeric := greatest(coalesce(p_remaining_minutes,0),0);
  daily_minutes numeric;
  safety_counter integer := 0;
begin
  if remaining <= 0 then return current_date; end if;
  if coalesce(p_weekly_minutes,0) <= 0 or coalesce(cardinality(p_schedule_days),0)=0 then return null; end if;

  daily_minutes := p_weekly_minutes::numeric / cardinality(p_schedule_days);

  while remaining > 0 and safety_counter < 3650 loop
    cursor_date := cursor_date + 1;
    safety_counter := safety_counter + 1;
    if extract(isodow from cursor_date)::smallint = any(p_schedule_days) then
      remaining := remaining - daily_minutes;
    end if;
  end loop;

  if remaining > 0 then return null; end if;
  return cursor_date;
end;
$$;

drop view if exists public.student_learning_progress;
create view public.student_learning_progress
with (security_invoker = true)
as
with adjustment_totals as (
  select
    progress_id,
    coalesce(sum(minutes_delta) filter(where adjustment_kind='required'),0) as required_adjustment_minutes,
    coalesce(sum(minutes_delta) filter(where adjustment_kind='completed'),0) as completed_adjustment_minutes
  from public.student_workload_adjustments
  group by progress_id
),
attendance_totals as (
  select
    p.id as progress_id,
    coalesce(sum(a.scheduled_minutes),0) as scheduled_minutes,
    coalesce(sum(a.attended_minutes),0) as attended_minutes,
    count(a.id) as attendance_records
  from public.student_course_progress p
  left join public.attendance a
    on a.student_id=p.student_id
   and a.course_id=p.course_id
   and a.date>=p.started_at
   and (p.ended_at is null or a.date<=p.ended_at)
  group by p.id
),
base as (
  select
    p.id as progress_id,
    p.student_id,
    s.name as student_name,
    s.photo_path,
    s.photo_status,
    s.identity_mode,
    s.avatar_key,
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
    coalesce(p.base_workload_minutes_override,c.total_workload_minutes,0) as base_workload_minutes,
    coalesce(adj.required_adjustment_minutes,0) as required_adjustment_minutes,
    coalesce(adj.completed_adjustment_minutes,0) as completed_adjustment_minutes,
    coalesce(att.scheduled_minutes,0) as scheduled_minutes,
    coalesce(att.attended_minutes,0) as attended_minutes,
    coalesce(att.attendance_records,0) as attendance_records
  from public.student_course_progress p
  join public.students s on s.id=p.student_id
  join public.courses c on c.id=p.course_id
  left join public.classes cl on cl.id=s.class_id
  left join adjustment_totals adj on adj.progress_id=p.id
  left join attendance_totals att on att.progress_id=p.id
)
select
  base.*,
  greatest(0,base.base_workload_minutes+base.required_adjustment_minutes) as required_minutes,
  greatest(0,base.attended_minutes+base.completed_adjustment_minutes) as completed_minutes,
  greatest(
    0,
    greatest(0,base.base_workload_minutes+base.required_adjustment_minutes)
    - greatest(0,base.attended_minutes+base.completed_adjustment_minutes)
  ) as remaining_minutes,
  case
    when greatest(0,base.base_workload_minutes+base.required_adjustment_minutes)<=0 then 0
    else round(
      least(
        100,
        greatest(0,base.attended_minutes+base.completed_adjustment_minutes)::numeric
        / greatest(1,base.base_workload_minutes+base.required_adjustment_minutes)::numeric * 100
      ),2
    )
  end as progress_percentage,
  case
    when base.scheduled_minutes<=0 then 0
    else round(
      least(100,greatest(0,base.attended_minutes)::numeric/base.scheduled_minutes::numeric*100),2
    )
  end as attendance_percentage,
  case
    when coalesce(base.weekly_workload_minutes,0)<=0 then null
    else round(
      greatest(
        0,
        greatest(0,base.base_workload_minutes+base.required_adjustment_minutes)
        - greatest(0,base.attended_minutes+base.completed_adjustment_minutes)
      )::numeric/base.weekly_workload_minutes::numeric,
      1
    )
  end as estimated_weeks_remaining,
  public.estimate_learning_completion_date(
    base.schedule_days,
    base.weekly_workload_minutes,
    greatest(
      0,
      greatest(0,base.base_workload_minutes+base.required_adjustment_minutes)
      - greatest(0,base.attended_minutes+base.completed_adjustment_minutes)
    )
  ) as estimated_completion_date,
  case
    when base.attended_minutes<600 or base.attendance_records<3 then 'initial'
    when base.attended_minutes<2400 or base.attendance_records<8 then 'moderate'
    else 'consolidated'
  end as evidence_level
from base;

alter table public.student_class_enrollments enable row level security;
alter table public.student_course_progress enable row level security;
alter table public.student_workload_adjustments enable row level security;

drop policy if exists "Teachers manage class enrollment history" on public.student_class_enrollments;
create policy "Teachers manage class enrollment history"
on public.student_class_enrollments for all to authenticated using(true) with check(true);

drop policy if exists "Teachers manage course progress" on public.student_course_progress;
create policy "Teachers manage course progress"
on public.student_course_progress for all to authenticated using(true) with check(true);

drop policy if exists "Teachers manage workload adjustments" on public.student_workload_adjustments;
create policy "Teachers manage workload adjustments"
on public.student_workload_adjustments for all to authenticated using(true) with check(true);

grant select on public.student_learning_progress to authenticated;
grant execute on function public.weighted_attendance_percentage(uuid) to authenticated;
grant execute on function public.estimate_learning_completion_date(smallint[],integer,bigint) to authenticated;

update public.students s
set attendance=public.weighted_attendance_percentage(s.id);

notify pgrst,'reload schema';
