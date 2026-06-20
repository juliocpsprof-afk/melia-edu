create or replace function public.weighted_attendance_percentage(target_student_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public
as $$
  with active_course as (
    select p.course_id, p.started_at
    from public.student_course_progress p
    where p.student_id = target_student_id
      and p.status in ('active','paused')
      and p.ended_at is null
    order by p.started_at desc
    limit 1
  ),
  eligible_attendance as (
    select a.scheduled_minutes, a.attended_minutes
    from public.attendance a
    left join active_course ac on true
    where a.student_id = target_student_id
      and (
        ac.course_id is null
        or (a.course_id = ac.course_id and a.date >= ac.started_at)
      )
  )
  select case
    when coalesce(sum(scheduled_minutes),0) <= 0 then 0
    else round(
      greatest(0,least(100,
        sum(coalesce(attended_minutes,0))::numeric
        / sum(scheduled_minutes)::numeric * 100
      )),2
    )
  end
  from eligible_attendance;
$$;

update public.students s
set attendance=public.weighted_attendance_percentage(s.id);

notify pgrst,'reload schema';
