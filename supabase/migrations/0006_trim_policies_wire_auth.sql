-- ============================================================================
-- Keep in RLS only what RLS answers well: who is asking, and whose row is this.
--
-- 1. Drop 15 write policies. Reference data (subjects, weights, targets) changes
--    through migrations, and master data (staff, classes, students, guardians)
--    arrives through the S1 import. Neither should be writable over the REST
--    API by a signed-in user. service_role still does both.
--
-- 2. Take R9's seven-day edit window out of RLS. A policy can express the time
--    test but cannot require office staff to state a reason, and when it does
--    bite the row simply vanishes with no explanation. A trigger says why.
--
-- 3. Link auth.users to teachers on sign-up, which is what finally makes every
--    remaining policy evaluate to something other than "deny".
--
-- 57 policies before, 42 after.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Reference and master data are not API-writable
-- ---------------------------------------------------------------------------
do $blk$
declare tbl text;
begin
  foreach tbl in array array[
    'schools', 'terms', 'checkpoints', 'subjects', 'incident_types', 'incident_levels',
    'observation_topics', 'parent_channels', 'metric_targets', 'behaviour_settings', 'policy_settings'
  ] loop
    execute format('drop policy if exists %I on public.%I', tbl || '_admin_write', tbl);
  end loop;
end;
$blk$;

drop policy if exists teachers_write   on public.teachers;
drop policy if exists classrooms_write on public.classrooms;
drop policy if exists students_write   on public.students;
drop policy if exists guardians_write  on public.guardians;

comment on table public.teachers is
  'Roster is loaded by the S1 import running as service_role. No API write policy on purpose.';

-- ---------------------------------------------------------------------------
-- 2. R9 moves from a policy to a trigger
-- ---------------------------------------------------------------------------
drop policy if exists assessments_update on public.assessments;
create policy assessments_update on public.assessments
  for update to authenticated
  using      (private.current_staff_role() = 'staff' or private.teaches_class(classroom_id))
  with check (private.current_staff_role() = 'staff' or private.teaches_class(classroom_id));

drop policy if exists behaviour_update on public.behaviour_incidents;
create policy behaviour_update on public.behaviour_incidents
  for update to authenticated
  using      (private.current_staff_role() = 'staff' or private.teaches_class(classroom_id))
  with check (private.current_staff_role() = 'staff' or private.teaches_class(classroom_id));

-- The window itself, enforced where it can explain itself. service_role and the
-- office bypass it; a teacher correcting their own old entry gets a message
-- naming the rule instead of a silent no-op.
create or replace function public.enforce_edit_window()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $fn$
declare
  v_days smallint;
  v_role public.staff_role;
  v_age  numeric;
begin
  v_role := private.current_staff_role();

  if v_role is null or v_role = 'staff' then
    return new;
  end if;

  select edit_window_days into v_days
  from public.policy_settings where term_id = old.term_id;

  v_age := extract(epoch from (now() - coalesce(old.recorded_at, old.occurred_at))) / 86400.0;

  if v_age > coalesce(v_days, 7) then
    raise exception
      'R9: this entry is % days old; a teacher may correct their own for % days. Ask the office to amend it with a reason.',
      floor(v_age), coalesce(v_days, 7)
      using errcode = 'check_violation';
  end if;

  return new;
end;
$fn$;

create trigger assessments_edit_window
  before update on public.assessments
  for each row execute function public.enforce_edit_window();

create trigger behaviour_edit_window
  before update on public.behaviour_incidents
  for each row execute function public.enforce_edit_window();

-- ---------------------------------------------------------------------------
-- 3. Auth wiring
-- ---------------------------------------------------------------------------
create or replace function private.link_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $fn$
begin
  update public.teachers
     set auth_user_id = new.id
   where lower(email) = lower(new.email)
     and auth_user_id is null;
  return new;
end;
$fn$;

comment on function private.link_auth_user() is
  'Matches a new auth user to their staff row by email. A sign-up with no matching row links to nothing, and RLS then shows that user nothing — which is the safe outcome.';

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.link_auth_user();

-- Covers accounts created before this migration.
update public.teachers t
   set auth_user_id = u.id
  from auth.users u
 where lower(u.email) = lower(t.email)
   and t.auth_user_id is null;
