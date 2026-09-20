-- ============================================================================
-- RLS test suite — does the database actually enforce section 02 of the spec?
--
-- Run it against any environment, any time. It writes nothing: everything sits
-- inside a transaction that ends in ROLLBACK.
--
--     psql "$SUPABASE_DB_URL" -f supabase/rls_test.sql
--
-- HOW IT IMPERSONATES
--
-- The policies ask private.current_teacher_id() and private.current_staff_role()
-- who is calling, and those read teachers.auth_user_id = auth.uid(). Rather than
-- create accounts and sign in, the suite replaces those two functions inside the
-- transaction so they answer from a chosen email, then switches to the
-- `authenticated` role. Every policy, trigger and view is then exercised exactly
-- as it would be for a real session. The ROLLBACK restores the originals.
--
-- This tests the policies, not the sign-in path. The auth.users -> teachers link
-- is a separate trigger (0006); check it with:
--     select email, auth_user_id is not null as linked from public.teachers
--     where email in ('director@tbg.ac.th','office@tbg.ac.th','teacher5@tbg.ac.th');
--
-- WHAT IT FOUND
--
-- The first run caught enforce_edit_window() failing on every assessment update
-- with "record old has no field occurred_at" — fixed in 0008. Two of the early
-- failures were the suite's own bugs, both worth remembering: a subquery inside
-- an INSERT is itself RLS-filtered, so an INSERT ... SELECT that finds no rows
-- looks like a successful write; and LIMIT after UNION ALL applies to the whole
-- union, not the last branch.
-- ============================================================================

begin;

create temp table probe(who text, test text, expected text, got text) on commit drop;
create temp table fx(k text primary key, v uuid) on commit drop;
-- The suite writes its results while wearing each role, so both API roles need
-- to reach the scratch table. anon is included for the "nobody at all" section.
grant all on probe to authenticated, anon;

-- Fixtures are captured before the impersonation starts, so the rows are found
-- as the owner rather than through whatever RLS would allow.
insert into fx values ('dir',   (select id from public.teachers where email = 'director@tbg.ac.th'));
insert into fx values ('staff', (select id from public.teachers where email = 'office@tbg.ac.th'));
insert into fx values ('t5',    (select id from public.teachers where email = 'teacher5@tbg.ac.th'));
insert into fx values ('own',   (select id from public.classrooms where name = 'ป.4/2'));
insert into fx values ('other', (select id from public.classrooms where name = 'ป.6/1'));
insert into fx values ('sch',   (select school_id from public.terms where code = '2569-1'));
insert into fx values ('trm',   (select id from public.terms where code = '2569-1'));
insert into fx values ('other_stu',  (select id from public.students   where classroom_id = (select v from fx where k = 'other') limit 1));
insert into fx values ('fresh_mark', (select id from public.assessments where classroom_id = (select v from fx where k = 'own') order by recorded_at desc limit 1));
insert into fx values ('stale_mark', (select id from public.assessments where classroom_id = (select v from fx where k = 'own') order by recorded_at asc  limit 1));
insert into fx values ('item',  (select id from public.action_items where closed_at is null limit 1));

-- One mark made recent, so the window's allow path is covered as well as its
-- deny path. Done before the stub, or the trigger would treat it as a teacher edit.
update public.assessments set recorded_at = now() where id = (select v from fx where k = 'fresh_mark');

create or replace function private.current_teacher_id()
returns uuid language sql stable security definer set search_path = public, private
as $fn$ select id from public.teachers where email = current_setting('probe.email', true) $fn$;

create or replace function private.current_staff_role()
returns public.staff_role language sql stable security definer set search_path = public, private
as $fn$ select role from public.teachers where email = current_setting('probe.email', true) $fn$;

do $suite$
declare
  f jsonb;
  n int;
begin
  select jsonb_object_agg(k, v) into f from fx;

  -- ==================================================================
  -- READ — how much of the school does each role see
  -- ==================================================================
  perform set_config('probe.email', 'director@tbg.ac.th', true);
  set local role authenticated;
  select count(*) into n from public.classrooms;
  insert into probe values ('ผอ.', 'เห็นห้องเรียน', '9', n::text);
  select count(*) into n from public.observations;
  insert into probe values ('ผอ.', 'เห็นผลนิเทศ', '84', n::text);
  reset role;

  perform set_config('probe.email', 'office@tbg.ac.th', true);
  set local role authenticated;
  select count(*) into n from public.classrooms;
  insert into probe values ('ธุรการ', 'เห็นห้องเรียน', '9', n::text);
  select count(*) into n from public.observations;
  insert into probe values ('ธุรการ', 'เห็นผลนิเทศ (ต้องไม่เห็น)', '0', n::text);
  reset role;

  perform set_config('probe.email', 'teacher5@tbg.ac.th', true);
  set local role authenticated;
  select count(*) into n from public.classrooms;
  insert into probe values ('ครู ป.4/2', 'เห็นห้องเรียน', '1', n::text);
  select count(*) into n from public.observations;
  insert into probe values ('ครู ป.4/2', 'เห็นผลนิเทศ (ของตัวเอง)', '2', n::text);
  select count(*) into n from public.import_batches;
  insert into probe values ('ครู ป.4/2', 'เห็นประวัตินำเข้า', '0', n::text);
  reset role;

  -- ==================================================================
  -- WRITE — teacher
  -- ==================================================================
  perform set_config('probe.email', 'teacher5@tbg.ac.th', true);
  set local role authenticated;

  begin
    insert into public.assessments (school_id, term_id, classroom_id, student_id, subject_id, checkpoint, score, teacher_id, recorded_by)
    values ((f->>'sch')::uuid, (f->>'trm')::uuid, (f->>'other')::uuid, (f->>'other_stu')::uuid, 'thai', 1, 99, (f->>'t5')::uuid, (f->>'t5')::uuid);
    insert into probe values ('ครู', 'กรอกคะแนนห้องอื่น', 'ถูกปฏิเสธ', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ครู', 'กรอกคะแนนห้องอื่น', 'ถูกปฏิเสธ', 'ถูกปฏิเสธ (' || sqlstate || ')');
  end;

  begin
    update public.assessments set score = 88 where id = (f->>'fresh_mark')::uuid;
    if not found then raise exception 'ไม่พบแถว'; end if;
    insert into probe values ('ครู', 'แก้คะแนนที่เพิ่งบันทึก', 'ทำได้', 'ทำได้');
  exception when others then
    insert into probe values ('ครู', 'แก้คะแนนที่เพิ่งบันทึก', 'ทำได้', 'ถูกปฏิเสธ — ผิด! ' || left(sqlerrm, 60));
  end;

  begin
    update public.assessments set score = 100 where id = (f->>'stale_mark')::uuid;
    if not found then raise exception 'ไม่พบแถว — RLS กรองทิ้ง'; end if;
    insert into probe values ('ครู', 'แก้คะแนนเก่า (R9)', 'ถูกปฏิเสธพร้อมเหตุผล', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ครู', 'แก้คะแนนเก่า (R9)', 'ถูกปฏิเสธพร้อมเหตุผล', left(sqlerrm, 100));
  end;

  begin
    perform public.close_action_item((f->>'item')::uuid, (f->>'t5')::uuid);
    insert into probe values ('ครู', 'ปิดรายการ R7', 'ถูกปฏิเสธ', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ครู', 'ปิดรายการ R7', 'ถูกปฏิเสธ', left(sqlerrm, 55));
  end;

  begin
    insert into public.import_batches (school_id, term_id, file_name, mode, uploaded_by)
    values ((f->>'sch')::uuid, (f->>'trm')::uuid, 'teacher.xlsx', 'append', (f->>'t5')::uuid);
    insert into probe values ('ครู', 'นำเข้าข้อมูลหลัก', 'ถูกปฏิเสธ', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ครู', 'นำเข้าข้อมูลหลัก', 'ถูกปฏิเสธ', 'ถูกปฏิเสธ (' || sqlstate || ')');
  end;
  reset role;

  -- ==================================================================
  -- WRITE — office staff
  -- ==================================================================
  perform set_config('probe.email', 'office@tbg.ac.th', true);
  set local role authenticated;

  begin
    update public.assessments set score = 77 where id = (f->>'stale_mark')::uuid;
    if not found then raise exception 'ไม่พบแถว'; end if;
    insert into probe values ('ธุรการ', 'แก้คะแนนเก่าแทนครู (Q2)', 'ทำได้', 'ทำได้');
  exception when others then
    insert into probe values ('ธุรการ', 'แก้คะแนนเก่าแทนครู (Q2)', 'ทำได้', 'ถูกปฏิเสธ — ผิด! ' || left(sqlerrm, 60));
  end;

  begin
    insert into public.import_batches (school_id, term_id, file_name, mode, uploaded_by)
    values ((f->>'sch')::uuid, (f->>'trm')::uuid, 'staff.xlsx', 'append', (f->>'staff')::uuid);
    insert into probe values ('ธุรการ', 'นำเข้าข้อมูลหลัก', 'ทำได้', 'ทำได้');
  exception when others then
    insert into probe values ('ธุรการ', 'นำเข้าข้อมูลหลัก', 'ทำได้', 'ถูกปฏิเสธ — ผิด! (' || sqlstate || ')');
  end;

  begin
    perform public.close_action_item((f->>'item')::uuid, (f->>'staff')::uuid);
    insert into probe values ('ธุรการ', 'ปิดรายการ R7', 'ถูกปฏิเสธ', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ธุรการ', 'ปิดรายการ R7', 'ถูกปฏิเสธ', left(sqlerrm, 50));
  end;
  reset role;

  -- ==================================================================
  -- WRITE — director
  -- ==================================================================
  perform set_config('probe.email', 'director@tbg.ac.th', true);
  set local role authenticated;

  begin
    insert into public.tasks (school_id, term_id, title, due_date, created_by)
    values ((f->>'sch')::uuid, (f->>'trm')::uuid, 'ผอ. มอบหมายงาน', current_date + 5, (f->>'dir')::uuid);
    insert into probe values ('ผอ.', 'มอบหมายงาน', 'ทำได้', 'ทำได้');
  exception when others then
    insert into probe values ('ผอ.', 'มอบหมายงาน', 'ทำได้', 'ถูกปฏิเสธ — ผิด! (' || sqlstate || ')');
  end;

  begin
    perform public.close_action_item((f->>'item')::uuid, (f->>'dir')::uuid);
    insert into probe values ('ผอ.', 'ปิดรายการ R7', 'ทำได้', 'ทำได้');
  exception when others then
    insert into probe values ('ผอ.', 'ปิดรายการ R7', 'ทำได้', 'ถูกปฏิเสธ — ผิด! ' || left(sqlerrm, 50));
  end;

  -- Section 02 is explicit: the director may not rewrite a teacher's marks.
  -- There is no UPDATE policy for them, so the row is simply not visible to
  -- the update and `found` stays false.
  begin
    update public.assessments set score = 55 where id = (f->>'stale_mark')::uuid;
    if not found then raise exception 'ไม่พบแถวให้แก้ (ไม่มี policy UPDATE ให้ ผอ.)'; end if;
    insert into probe values ('ผอ.', 'แก้คะแนนแทนครู', 'ถูกปฏิเสธ', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ผอ.', 'แก้คะแนนแทนครู', 'ถูกปฏิเสธ', left(sqlerrm, 60));
  end;

  begin
    insert into public.import_batches (school_id, term_id, file_name, mode, uploaded_by)
    values ((f->>'sch')::uuid, (f->>'trm')::uuid, 'director.xlsx', 'append', (f->>'dir')::uuid);
    insert into probe values ('ผอ.', 'นำเข้าข้อมูลหลัก', 'ถูกปฏิเสธ', 'ผ่านได้ — ช่องโหว่!');
  exception when others then
    insert into probe values ('ผอ.', 'นำเข้าข้อมูลหลัก', 'ถูกปฏิเสธ', 'ถูกปฏิเสธ (' || sqlstate || ')');
  end;
  reset role;

  -- ==================================================================
  -- Nobody at all
  -- ==================================================================
  set local role anon;
  select count(*) into n from public.students;
  insert into probe values ('anon', 'เห็นนักเรียน', '0', n::text);
  select count(*) into n from public.assessments;
  insert into probe values ('anon', 'เห็นคะแนน', '0', n::text);
  reset role;
end;
$suite$;

select who, test, expected, got,
       case when got like 'ผ่านได้%' or got like 'ถูกปฏิเสธ — ผิด!%'
                 or (expected ~ '^[0-9]+$' and expected is distinct from got)
            then 'FAIL' else 'ok' end as verdict
from probe;

rollback;
