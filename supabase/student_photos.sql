-- Fotos de identificação dos alunos
-- Execute este arquivo no SQL Editor do Supabase.

alter table public.students
  add column if not exists photo_path text,
  add column if not exists photo_status text not null default 'pending',
  add column if not exists photo_uploaded_by text,
  add column if not exists photo_updated_at timestamptz,
  add column if not exists photo_approved_at timestamptz,
  add column if not exists photo_rejection_reason text,
  add column if not exists identity_mode text not null default 'avatar',
  add column if not exists avatar_key text not null default '🚀',
  add column if not exists photo_required boolean not null default false;

alter table public.students
  alter column photo_required set default false;

update public.students
set photo_required = false
where photo_required is distinct from false;

alter table public.students
  drop constraint if exists students_photo_status_check;

alter table public.students
  add constraint students_photo_status_check
  check (photo_status in ('pending', 'approved', 'rejected'));

alter table public.students
  drop constraint if exists students_photo_uploaded_by_check;

alter table public.students
  add constraint students_photo_uploaded_by_check
  check (photo_uploaded_by is null or photo_uploaded_by in ('student', 'teacher'));

alter table public.students
  drop constraint if exists students_identity_mode_check;

alter table public.students
  add constraint students_identity_mode_check
  check (identity_mode in ('photo', 'avatar'));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'student-photos',
  'student-photos',
  false,
  524288,
  array['image/webp', 'image/jpeg', 'image/png']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Teachers read student photos" on storage.objects;
create policy "Teachers read student photos"
on storage.objects for select
to authenticated
using (bucket_id = 'student-photos');

drop policy if exists "Teachers upload student photos" on storage.objects;
create policy "Teachers upload student photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'student-photos');

drop policy if exists "Teachers update student photos" on storage.objects;
create policy "Teachers update student photos"
on storage.objects for update
to authenticated
using (bucket_id = 'student-photos')
with check (bucket_id = 'student-photos');

drop policy if exists "Teachers delete student photos" on storage.objects;
create policy "Teachers delete student photos"
on storage.objects for delete
to authenticated
using (bucket_id = 'student-photos');

create table if not exists public.student_portal_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  student_id uuid not null references public.students(id) on delete cascade,
  class_id uuid references public.classes(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz not null default now()
);

create index if not exists student_portal_sessions_student_id_idx
  on public.student_portal_sessions(student_id);

create index if not exists student_portal_sessions_expires_at_idx
  on public.student_portal_sessions(expires_at);

alter table public.student_portal_sessions enable row level security;

notify pgrst, 'reload schema';
