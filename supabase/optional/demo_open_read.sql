-- ============================================================================
-- DEMO ONLY — read access without sign-in.
--
-- NOT part of the migrations. Nothing runs this for you.
--
-- The policies in 0004_rls.sql key off teachers.auth_user_id. Until Supabase
-- auth is wired up that column is null for everybody, so an anon or
-- authenticated client sees nothing at all. That is the correct default.
--
-- Run this only if you want to click through the app against real rows before
-- auth exists, and only on a project that holds no real student data. It grants
-- every signed-in user read access to the whole school — the exact thing the
-- spec's permission table exists to prevent. Writes stay closed.
--
-- Undo it with the DROP block at the bottom the moment sign-in works.
-- ============================================================================

do $$
declare tbl text;
begin
  foreach tbl in array array[
    'schools', 'terms', 'checkpoints', 'teachers', 'classrooms', 'students', 'guardians',
    'assessments', 'behaviour_incidents', 'observations', 'observation_scores',
    'parent_engagement', 'action_items', 'tasks', 'task_assignees', 'task_attachments',
    'import_batches', 'import_errors'
  ] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      'demo_open_read_' || tbl, tbl
    );
  end loop;
end;
$$;

-- ----------------------------------------------------------------------------
-- Undo
-- ----------------------------------------------------------------------------
-- do $$
-- declare tbl text;
-- begin
--   foreach tbl in array array[
--     'schools', 'terms', 'checkpoints', 'teachers', 'classrooms', 'students', 'guardians',
--     'assessments', 'behaviour_incidents', 'observations', 'observation_scores',
--     'parent_engagement', 'action_items', 'tasks', 'task_assignees', 'task_attachments',
--     'import_batches', 'import_errors'
--   ] loop
--     execute format('drop policy if exists %I on public.%I', 'demo_open_read_' || tbl, tbl);
--   end loop;
-- end;
-- $$;
