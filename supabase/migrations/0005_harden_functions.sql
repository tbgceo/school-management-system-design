-- ============================================================================
-- Hardening pass, from the Supabase security advisor.
--
-- 1. The RLS helpers were SECURITY DEFINER functions sitting in `public`, which
--    PostgREST exposes as /rest/v1/rpc/... endpoints callable by anon. They are
--    plumbing for the policies, not API. Moving them to a schema PostgREST does
--    not expose keeps the policies working — a policy stores the function's OID,
--    so it follows the move — while taking them off the public API surface.
--
-- 2. Every function now pins search_path, so a caller cannot shadow `public`
--    with their own schema and change what the function resolves to.
--
-- After this migration the advisor reports zero findings.
-- ============================================================================

create schema if not exists private;

-- Policies evaluate these as the calling user, so the roles still need to reach
-- them by name — they just cannot be reached over HTTP any more.
grant usage on schema private to authenticated, anon, service_role;

alter function public.current_teacher_id()                  set schema private;
alter function public.current_staff_role()                  set schema private;
alter function public.teaches_class(uuid)                   set schema private;
alter function public.within_edit_window(uuid, timestamptz) set schema private;
alter function public.is_back_office()                      set schema private;
alter function public.is_director()                         set schema private;

-- Their bodies still call the old public.* names; replace in place so the OIDs,
-- and therefore every policy that references them, survive.
create or replace function private.current_teacher_id()
returns uuid language sql stable security definer set search_path = public, private
as $fn$
  select id from public.teachers where auth_user_id = auth.uid() and is_active limit 1;
$fn$;

create or replace function private.current_staff_role()
returns public.staff_role language sql stable security definer set search_path = public, private
as $fn$
  select role from public.teachers where auth_user_id = auth.uid() and is_active limit 1;
$fn$;

create or replace function private.is_back_office()
returns boolean language sql stable set search_path = public, private
as $fn$ select private.current_staff_role() in ('director', 'staff'); $fn$;

create or replace function private.is_director()
returns boolean language sql stable set search_path = public, private
as $fn$ select private.current_staff_role() = 'director'; $fn$;

create or replace function private.teaches_class(p_classroom_id uuid)
returns boolean language sql stable security definer set search_path = public, private
as $fn$
  select exists (
    select 1 from public.classrooms c
    where c.id = p_classroom_id
      and c.homeroom_teacher_id = private.current_teacher_id()
  );
$fn$;

create or replace function private.within_edit_window(p_term_id uuid, p_recorded_at timestamptz)
returns boolean language sql stable security definer set search_path = public, private
as $fn$
  select p_recorded_at > now() - make_interval(
    days => coalesce((select edit_window_days from public.policy_settings where term_id = p_term_id), 7)
  );
$fn$;

-- The rest stay in public — they are either called by the app or by triggers —
-- but none of them should resolve names through a caller-controlled search_path.
alter function public.status_band(numeric, numeric, numeric, integer, boolean) set search_path = public;
alter function public.close_action_item(uuid, uuid)                            set search_path = public;
alter function public.enforce_attachment_limit()                               set search_path = public;
alter function public.log_assessment_edit()                                    set search_path = public;
alter function public.log_behaviour_edit()                                     set search_path = public;
