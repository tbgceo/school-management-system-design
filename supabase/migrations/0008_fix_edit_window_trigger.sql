-- ============================================================================
-- Fix: enforce_edit_window() raised "record old has no field occurred_at" on
-- every update to assessments, which has recorded_at but no occurred_at.
--
-- PL/pgSQL resolves a record field before coalesce can pick between them, so
-- `coalesce(old.recorded_at, old.occurred_at)` fails on whichever table lacks
-- one of the two columns. The effect was worse than the rule it implements: no
-- teacher could correct a mark at all, and the error named a missing column
-- rather than the seven-day window.
--
-- to_jsonb(old) carries only the fields the row actually has, and ->> on a
-- missing key is null, so one trigger now serves both tables.
--
-- Found by supabase/rls_test.sql, which is why that file exists.
-- ============================================================================

create or replace function public.enforce_edit_window()
returns trigger
language plpgsql
security definer
set search_path = public, private
as $fn$
declare
  v_days smallint;
  v_role public.staff_role;
  v_when timestamptz;
  v_age  numeric;
  v_old  jsonb := to_jsonb(old);
begin
  v_role := private.current_staff_role();

  -- Not signed in (service_role, migrations, scheduled jobs) and the office may
  -- both correct the record at any age; R9 gives the office the amendment, and
  -- the reason is captured where the edit is made.
  if v_role is null or v_role = 'staff' then
    return new;
  end if;

  v_when := coalesce(
    (v_old ->> 'recorded_at')::timestamptz,
    (v_old ->> 'occurred_at')::timestamptz
  );

  -- No timestamp to measure from: let it through rather than block on a guess.
  if v_when is null then
    return new;
  end if;

  select edit_window_days into v_days
  from public.policy_settings where term_id = old.term_id;

  v_age := extract(epoch from (now() - v_when)) / 86400.0;

  if v_age > coalesce(v_days, 7) then
    raise exception
      'R9: รายการนี้บันทึกไว้ % วันแล้ว ครูแก้ไขเองได้ภายใน % วัน · ให้ธุรการแก้และระบุเหตุผล',
      floor(v_age), coalesce(v_days, 7)
      using errcode = 'check_violation';
  end if;

  return new;
end;
$fn$;
