-- ============================================================================
-- Row level security.
--
-- Section 02 of Spec v1 gives three roles and three visibility rules. Without
-- RLS a Supabase project hands every row to anyone holding the anon key, so
-- these policies are not optional hardening — they are the permission table
-- from the spec, enforced where it cannot be bypassed by a client.
--
--  ผู้อำนวยการ  every class, every teacher, every metric; closes action items;
--               assigns tasks; may not edit a teacher's marks.
--  ครู          only the class they are homeroom for, and only their own
--               observation scores.
--  ธุรการ       all master data and parent engagement, may fill in any form on
--               a teacher's behalf, may not assign tasks and may not read other
--               teachers' observations.
--
-- The service_role key bypasses RLS, so seeding and back-office jobs are
-- unaffected. Until sign-in is wired up, teachers.auth_user_id is null and
-- these policies deny everything to anon and authenticated — which is the safe
-- default. See supabase/optional/demo_open_read.sql if you want to click around
-- the app before auth exists.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Who is asking
-- ----------------------------------------------------------------------------
create or replace function public.current_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from public.teachers where auth_user_id = auth.uid() and is_active limit 1;
$$;

create or replace function public.current_staff_role()
returns public.staff_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.teachers where auth_user_id = auth.uid() and is_active limit 1;
$$;

-- Director and office staff both see the whole school; they differ on what they may write.
create or replace function public.is_back_office()
returns boolean
language sql
stable
as $$
  select public.current_staff_role() in ('director', 'staff');
$$;

create or replace function public.is_director()
returns boolean
language sql
stable
as $$
  select public.current_staff_role() = 'director';
$$;

create or replace function public.teaches_class(p_classroom_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.classrooms c
    where c.id = p_classroom_id
      and c.homeroom_teacher_id = public.current_teacher_id()
  );
$$;

-- R9: a teacher may correct their own entry inside the window; after that it
-- takes office staff, who must state a reason.
create or replace function public.within_edit_window(p_term_id uuid, p_recorded_at timestamptz)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select p_recorded_at > now() - make_interval(
    days => coalesce((select edit_window_days from public.policy_settings where term_id = p_term_id), 7)
  );
$$;

-- ----------------------------------------------------------------------------
-- Turn it on everywhere. A table with RLS enabled and no policy denies all.
-- ----------------------------------------------------------------------------
alter table public.schools             enable row level security;
alter table public.terms               enable row level security;
alter table public.checkpoints         enable row level security;
alter table public.subjects            enable row level security;
alter table public.incident_types      enable row level security;
alter table public.incident_levels     enable row level security;
alter table public.observation_topics  enable row level security;
alter table public.parent_channels     enable row level security;
alter table public.metric_targets      enable row level security;
alter table public.behaviour_settings  enable row level security;
alter table public.policy_settings     enable row level security;
alter table public.teachers            enable row level security;
alter table public.classrooms          enable row level security;
alter table public.students            enable row level security;
alter table public.guardians           enable row level security;
alter table public.assessments         enable row level security;
alter table public.behaviour_incidents enable row level security;
alter table public.observations        enable row level security;
alter table public.observation_scores  enable row level security;
alter table public.parent_engagement   enable row level security;
alter table public.action_items        enable row level security;
alter table public.tasks               enable row level security;
alter table public.task_assignees      enable row level security;
alter table public.task_attachments    enable row level security;
alter table public.edit_log            enable row level security;
alter table public.import_batches      enable row level security;
alter table public.import_errors       enable row level security;

-- ----------------------------------------------------------------------------
-- Reference and configuration: readable by anyone signed in, written by the
-- director. The app needs subject names and channel weights on every screen.
-- ----------------------------------------------------------------------------
do $$
declare tbl text;
begin
  foreach tbl in array array[
    'schools', 'terms', 'checkpoints', 'subjects', 'incident_types', 'incident_levels',
    'observation_topics', 'parent_channels', 'metric_targets', 'behaviour_settings', 'policy_settings'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.current_teacher_id() is not null)',
      tbl || '_read', tbl
    );
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_director()) with check (public.is_director())',
      tbl || '_admin_write', tbl
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- People
-- ----------------------------------------------------------------------------

-- Names and roles are needed on nearly every screen (task assignees, homeroom
-- labels), so every signed-in user may read the staff list. Only the director
-- may change it.
create policy teachers_read on public.teachers
  for select to authenticated
  using (public.current_teacher_id() is not null);

create policy teachers_write on public.teachers
  for all to authenticated
  using (public.is_director()) with check (public.is_director());

create policy classrooms_read on public.classrooms
  for select to authenticated
  using (public.is_back_office() or homeroom_teacher_id = public.current_teacher_id());

create policy classrooms_write on public.classrooms
  for all to authenticated
  using (public.current_staff_role() = 'staff') with check (public.current_staff_role() = 'staff');

create policy students_read on public.students
  for select to authenticated
  using (public.is_back_office() or public.teaches_class(classroom_id));

create policy students_write on public.students
  for all to authenticated
  using (public.current_staff_role() = 'staff') with check (public.current_staff_role() = 'staff');

create policy guardians_read on public.guardians
  for select to authenticated
  using (
    public.is_back_office()
    or exists (select 1 from public.students s where s.id = public.guardians.student_id and public.teaches_class(s.classroom_id))
  );

create policy guardians_write on public.guardians
  for all to authenticated
  using (public.current_staff_role() = 'staff') with check (public.current_staff_role() = 'staff');

-- ----------------------------------------------------------------------------
-- Assessments (S4). A teacher writes for their own class inside the R9 window;
-- office staff may write for anyone, which is Q2's proxy entry.
-- ----------------------------------------------------------------------------
create policy assessments_read on public.assessments
  for select to authenticated
  using (public.is_back_office() or public.teaches_class(classroom_id));

create policy assessments_insert on public.assessments
  for insert to authenticated
  with check (
    public.current_staff_role() = 'staff'
    or (public.teaches_class(classroom_id) and recorded_by = public.current_teacher_id())
  );

create policy assessments_update on public.assessments
  for update to authenticated
  using (
    public.current_staff_role() = 'staff'
    or (public.teaches_class(classroom_id) and public.within_edit_window(term_id, recorded_at))
  )
  with check (
    public.current_staff_role() = 'staff'
    or public.teaches_class(classroom_id)
  );

-- The director explicitly may not rewrite a teacher's marks (section 02), so no
-- policy grants them update here.

-- ----------------------------------------------------------------------------
-- Behaviour (S5)
-- ----------------------------------------------------------------------------
create policy behaviour_read on public.behaviour_incidents
  for select to authenticated
  using (public.is_back_office() or public.teaches_class(classroom_id));

create policy behaviour_insert on public.behaviour_incidents
  for insert to authenticated
  with check (public.current_staff_role() = 'staff' or public.teaches_class(classroom_id));

create policy behaviour_update on public.behaviour_incidents
  for update to authenticated
  using (
    public.current_staff_role() = 'staff'
    or (public.teaches_class(classroom_id) and public.within_edit_window(term_id, recorded_at))
  )
  with check (public.current_staff_role() = 'staff' or public.teaches_class(classroom_id));

-- ----------------------------------------------------------------------------
-- Observations (S5). A teacher sees their own score and nobody else's; the
-- department head who ran the round sees that round; the director sees all.
-- Office staff are deliberately excluded.
-- ----------------------------------------------------------------------------
create policy observations_read on public.observations
  for select to authenticated
  using (
    public.is_director()
    or teacher_id  = public.current_teacher_id()
    or observer_id = public.current_teacher_id()
  );

create policy observations_insert on public.observations
  for insert to authenticated
  with check (
    observer_id = public.current_teacher_id()
    and exists (select 1 from public.teachers t where t.id = public.current_teacher_id() and t.is_department_head)
  );

create policy observation_scores_read on public.observation_scores
  for select to authenticated
  using (exists (select 1 from public.observations o where o.id = public.observation_scores.observation_id));

create policy observation_scores_write on public.observation_scores
  for all to authenticated
  using (exists (select 1 from public.observations o where o.id = public.observation_scores.observation_id and o.observer_id = public.current_teacher_id()))
  with check (exists (select 1 from public.observations o where o.id = public.observation_scores.observation_id and o.observer_id = public.current_teacher_id()));

-- ----------------------------------------------------------------------------
-- Parent engagement (S5)
-- ----------------------------------------------------------------------------
create policy parent_engagement_read on public.parent_engagement
  for select to authenticated
  using (public.is_back_office() or public.teaches_class(classroom_id));

create policy parent_engagement_write on public.parent_engagement
  for all to authenticated
  using (public.current_staff_role() = 'staff' or public.teaches_class(classroom_id))
  with check (public.current_staff_role() = 'staff' or public.teaches_class(classroom_id));

-- ----------------------------------------------------------------------------
-- Action items (R7). Raised by the system; closed by the director alone.
-- ----------------------------------------------------------------------------
create policy action_items_read on public.action_items
  for select to authenticated
  using (
    public.is_back_office()
    or (classroom_id is not null and public.teaches_class(classroom_id))
    or teacher_id = public.current_teacher_id()
  );

create policy action_items_close on public.action_items
  for update to authenticated
  using (public.is_director()) with check (public.is_director());

-- ----------------------------------------------------------------------------
-- Tasks (S6). The director assigns; a teacher sees and completes their own.
-- ----------------------------------------------------------------------------
create policy tasks_read on public.tasks
  for select to authenticated
  using (
    public.is_back_office()
    or exists (select 1 from public.task_assignees ta
               where ta.task_id = public.tasks.id and ta.teacher_id = public.current_teacher_id())
  );

create policy tasks_insert on public.tasks
  for insert to authenticated
  with check (public.is_director() and created_by = public.current_teacher_id());

create policy tasks_update on public.tasks
  for update to authenticated
  using (
    public.is_director()
    or exists (select 1 from public.task_assignees ta
               where ta.task_id = public.tasks.id and ta.teacher_id = public.current_teacher_id())
  )
  with check (
    public.is_director()
    or exists (select 1 from public.task_assignees ta
               where ta.task_id = public.tasks.id and ta.teacher_id = public.current_teacher_id())
  );

create policy task_assignees_read on public.task_assignees
  for select to authenticated
  using (public.is_back_office() or teacher_id = public.current_teacher_id());

create policy task_assignees_write on public.task_assignees
  for all to authenticated
  using (public.is_director()) with check (public.is_director());

-- Every correlated reference below is table-qualified on purpose. `task_id`
-- exists on both task_attachments and task_assignees, so an unqualified
-- `ta.task_id = task_id` would bind to the inner table and be true for every
-- row — which would hand every attachment to every signed-in user.
create policy task_attachments_read on public.task_attachments
  for select to authenticated
  using (exists (select 1 from public.tasks t where t.id = public.task_attachments.task_id));

create policy task_attachments_write on public.task_attachments
  for all to authenticated
  using (
    exists (select 1 from public.task_assignees ta
            where ta.task_id = public.task_attachments.task_id
              and ta.teacher_id = public.current_teacher_id())
    or public.is_director()
  )
  with check (
    exists (select 1 from public.task_assignees ta
            where ta.task_id = public.task_attachments.task_id
              and ta.teacher_id = public.current_teacher_id())
    or public.is_director()
  );

-- ----------------------------------------------------------------------------
-- Audit and imports
-- ----------------------------------------------------------------------------
create policy edit_log_read on public.edit_log
  for select to authenticated
  using (public.is_back_office());

create policy edit_log_insert on public.edit_log
  for insert to authenticated
  with check (public.current_teacher_id() is not null);

create policy import_batches_read on public.import_batches
  for select to authenticated
  using (public.is_back_office());

create policy import_batches_write on public.import_batches
  for all to authenticated
  using (public.current_staff_role() = 'staff') with check (public.current_staff_role() = 'staff');

create policy import_errors_read on public.import_errors
  for select to authenticated
  using (public.is_back_office());

create policy import_errors_write on public.import_errors
  for all to authenticated
  using (public.current_staff_role() = 'staff') with check (public.current_staff_role() = 'staff');
