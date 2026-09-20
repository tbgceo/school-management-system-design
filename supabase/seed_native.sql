-- ============================================================================
-- TBG School OS — seed, generated server side.
--
-- THIS IS THE SEED THAT WAS APPLIED to the live project. It produces the same
-- figures as the app's fixture — nine classes, 314 students, 42 teaching staff,
-- 9,976 marks — but computes them in SQL instead of shipping 4 MB of literal
-- rows, so it pastes into the SQL editor in one go.
--
-- Verified against the live database: every class metric, the observation bands
-- and the parent channel rates match the running app exactly.
--
-- Re-runnable. Run after 0001–0005, then verify.sql.
-- ============================================================================

begin;

truncate table
  public.import_errors, public.import_batches, public.edit_log,
  public.task_attachments, public.task_assignees, public.tasks, public.action_items,
  public.parent_engagement, public.observation_scores, public.observations,
  public.behaviour_incidents, public.assessments,
  public.guardians, public.students, public.classrooms, public.teachers,
  public.policy_settings, public.behaviour_settings, public.metric_targets,
  public.checkpoints, public.terms, public.schools
restart identity cascade;

-- ---------------------------------------------------------------------------
-- School, term, checkpoints, tunables
-- ---------------------------------------------------------------------------
insert into public.schools (external_ref, name_th, name_en)
values ('sch-001', 'โรงเรียนสาธิต ทีบีจี', 'TBG Demonstration School');

insert into public.terms (school_id, code, year, term, label, starts_on, ends_on, term_weeks, is_current)
select id, '2569-1', 2569, 1, 'ภาคเรียนที่ 1 / 2569',
       date '2026-05-18', date '2026-05-18' + 125, 18, true
from public.schools where external_ref = 'sch-001';

-- A2: checkpoints close at the end of weeks 4, 8, 12 and 16.
insert into public.checkpoints (term_id, seq, week_no, closes_on)
select t.id, w.seq, w.wk, t.starts_on + (w.wk * 7 - 1)
from public.terms t
cross join (values (1,4),(2,8),(3,12),(4,16)) as w(seq, wk)
where t.code = '2569-1';

insert into public.metric_targets (term_id, metric, target)
select t.id, m.metric, m.target
from public.terms t
cross join (values
  ('assessment', 82), ('behaviour', 88), ('observation', 4.0),
  ('parent', 70), ('passing_score', 70), ('coaching', 3.5)
) as m(metric, target)
where t.code = '2569-1';

insert into public.behaviour_settings (term_id, start_index, recovery_per_quiet_week)
select id, 100, 1 from public.terms where code = '2569-1';

insert into public.policy_settings (term_id, edit_window_days, submission_grace_days)
select id, 7, 7 from public.terms where code = '2569-1';

-- ---------------------------------------------------------------------------
-- Staff — 1 director, 1 office, 42 teaching
-- ---------------------------------------------------------------------------
insert into public.teachers (school_id, external_ref, name_th, name_en, email, role)
select s.id, v.ref, v.th, v.en, v.email, v.role::public.staff_role
from public.schools s
cross join (values
  ('tch-director', 'ผอ. สุรชัย วัฒนกิจ', 'Surachai W.', 'director@tbg.ac.th', 'director'),
  ('tch-staff',    'คุณมาลี ธุรการ',      'Malee T.',    'office@tbg.ac.th',   'staff')
) as v(ref, th, en, email, role)
where s.external_ref = 'sch-001';

insert into public.teachers (school_id, external_ref, name_th, name_en, email, role, subject_id)
select s.id, v.ref, v.th, v.en, v.email, 'teacher', v.subj
from public.schools s
cross join (values
  ('tch-001', 'ครูกนกวรรณ สุขใจ',   'Kanokwan S.',  'teacher1@tbg.ac.th', 'thai'),
  ('tch-002', 'ครูพรทิพย์ รุ่งเรือง', 'Pornthip R.',  'teacher2@tbg.ac.th', 'math'),
  ('tch-003', 'ครูอนันต์ ทองดี',     'Anan T.',      'teacher3@tbg.ac.th', 'science'),
  ('tch-004', 'ครูศิริพร ใจงาม',     'Siriporn K.',  'teacher4@tbg.ac.th', 'social'),
  ('tch-005', 'ครูวีระชัย พัฒนากุล', 'Weerachai P.', 'teacher5@tbg.ac.th', 'health'),
  ('tch-006', 'ครูณภัทร ศรีสุข',     'Napat J.',     'teacher6@tbg.ac.th', 'art'),
  ('tch-007', 'ครูดวงใจ บุญมาก',     'Duangjai M.',  'teacher7@tbg.ac.th', 'career'),
  ('tch-008', 'ครูธนกร แสงทอง',      'Thanakorn L.', 'teacher8@tbg.ac.th', 'foreign'),
  ('tch-009', 'ครูปรีดา วงศ์ไทย',    'Preeda C.',    'teacher9@tbg.ac.th', 'thai')
) as v(ref, th, en, email, subj)
where s.external_ref = 'sch-001';

-- A4: one department head per learning area; they run the observation rounds.
insert into public.teachers (school_id, external_ref, name_th, name_en, email, role, subject_id, is_department_head)
select s.id,
       'tch-head-' || sub.id,
       'ครู' || (array['สมชาย','สุดารัตน์','วราภรณ์','จิราพร','ณัฐพล','พิมพ์ชนก','ธีรศักดิ์','อารยา'])[sub.sort_order]
              || ' ' || (array['มีชัย','อินทร์แก้ว','ชูเกียรติ','พรหมมา','สินสมบูรณ์','เจริญสุข','ก้องเกียรติ','นาคเงิน'])[sub.sort_order],
       'Head ' || sub.name_en,
       'head.' || sub.id || '@tbg.ac.th',
       'teacher', sub.id, true
from public.schools s cross join public.subjects sub
where s.external_ref = 'sch-001';

insert into public.teachers (school_id, external_ref, name_th, name_en, email, role, subject_id)
select s.id,
       'tch-' || lpad((100 + g)::text, 3, '0'),
       'ครู' || (array['กิตติศักดิ์','เบญจมาศ','ภานุวัฒน์','รัตนา','สิทธิชัย','อรวรรณ','ชัยวัฒน์','มณีรัตน์','ปิยะ','สุภาพร','ทวีศักดิ์','นันทนา','เอกชัย','ลัดดาวัลย์','ประสิทธิ์','จันทร์เพ็ญ','วิชัย','ศศิธร','บุญมี','พัชรี','สมหมาย','กาญจนา','ยุทธนา','สายฝน','นิภาพร'])[g]
              || ' ' || (array['ดาวเรือง','ภูผา','ทะเลใส','สุขใจ','รุ่งเรือง','ทองดี','ใจงาม','พัฒนากุล','ศรีสุข','บุญมาก'])[1 + (g % 10)],
       'Teacher ' || lpad(g::text, 2, '0'),
       'teacher' || (100 + g) || '@tbg.ac.th',
       'teacher',
       (select id from public.subjects where sort_order = 1 + (g % 8))
from public.schools s, generate_series(1, 25) g
where s.external_ref = 'sch-001';

-- ---------------------------------------------------------------------------
-- Classes, students, guardians
-- ---------------------------------------------------------------------------
insert into public.classrooms (school_id, term_id, external_ref, name, level, grade, homeroom_teacher_id)
select s.id, t.id, v.ref, v.name, v.lvl::public.class_level, v.grade, ht.id
from public.schools s
join public.terms t on t.school_id = s.id and t.code = '2569-1'
cross join (values
  ('cls-1', 'ป.1/1', 'primary', 1, 'tch-001'), ('cls-2', 'ป.2/1', 'primary', 2, 'tch-002'),
  ('cls-3', 'ป.3/1', 'primary', 3, 'tch-003'), ('cls-4', 'ป.4/1', 'primary', 4, 'tch-004'),
  ('cls-5', 'ป.4/2', 'primary', 4, 'tch-005'), ('cls-6', 'ป.5/1', 'primary', 5, 'tch-006'),
  ('cls-7', 'ป.6/1', 'primary', 6, 'tch-007'), ('cls-8', 'ม.1/1', 'lower',   7, 'tch-008'),
  ('cls-9', 'ม.2/1', 'lower',   8, 'tch-009')
) as v(ref, name, lvl, grade, homeroom_ref)
join public.teachers ht on ht.external_ref = v.homeroom_ref and ht.school_id = s.id
where s.external_ref = 'sch-001';

insert into public.students (school_id, term_id, classroom_id, external_ref, code, name_th)
select c.school_id, c.term_id, c.id,
       'stu-' || right(c.external_ref, 1) || '-' || lpad(g::text, 2, '0'),
       '69' || lpad(right(c.external_ref, 1), 2, '0') || lpad(g::text, 3, '0'),
       (array['ภูมิ','ข้าวหอม','ปุณณ์','นภัส','อิงฟ้า','ธาดา','พลอย','กันต์','ใบเตย','ปรินทร์','มีนา','ชนน','อารดา','ภูริ','ณิชา','วรินทร','สิรวิชญ์','พิชญา','ธนวัฒน์','กมลชนก','รวิพล','ปาณิสรา','จิรายุ','ศุภกร','อภิชญา','ณฐกร','สุพิชฌาย์','พชร','ไอลดา','ธัญชนก'])[1 + ((g - 1) % 30)]
       || ' ' ||
       (array['สุขใจ','รุ่งเรือง','ทองดี','ใจงาม','พัฒนากุล','ศรีสุข','บุญมาก','แสงทอง','วงศ์ไทย','มีชัย','อินทร์แก้ว','ชูเกียรติ','พรหมมา','สินสมบูรณ์','เจริญสุข','ก้องเกียรติ','นาคเงิน','ดาวเรือง','ภูผา','ทะเลใส'])[1 + ((g * 7) % 20)]
from public.classrooms c
join (values
  ('cls-1', 34), ('cls-2', 36), ('cls-3', 33), ('cls-4', 35), ('cls-5', 35),
  ('cls-6', 32), ('cls-7', 34), ('cls-8', 38), ('cls-9', 37)
) as r(ref, n) on r.ref = c.external_ref
cross join lateral generate_series(1, r.n) g;

insert into public.guardians (school_id, student_id, name_th)
select s.school_id, s.id, 'ผู้ปกครองของ ' || split_part(s.name_th, ' ', 1)
from public.students s;

-- ---------------------------------------------------------------------------
-- S4 assessments (R1)
--
-- Passing marks are allocated by student rank, not sprayed at random: the quota
-- for a class and checkpoint is handed out whole-roster-first, so the weakest
-- students genuinely fail across the board and S3's watch list fills up.
-- Scores come from hashtext(), which is stable, so re-running is identical.
-- ---------------------------------------------------------------------------
with cls as (
  select c.id, c.external_ref, c.school_id, c.term_id, c.homeroom_teacher_id,
         (select count(*) from public.students s where s.classroom_id = c.id)::int as roster
  from public.classrooms c
),
target as (
  select * from (values
    ('cls-1', 79, 82, 85, 88), ('cls-2', 76, 79, 82, 85), ('cls-3', 70, 73, 76, 79),
    ('cls-4', 74, 77, 80, 83), ('cls-5', 65, 68, 71, 74), ('cls-6', 72, 75, 78, 81),
    ('cls-7', 81, 84, 87, 90), ('cls-8', 68, 71, 74, 77), ('cls-9', 63, 66, 69, 72)
  ) as v(ref, p1, p2, p3, p4)
),
-- Two subjects never submitted at checkpoint 4, so R7 has real late work to find.
late as (
  select * from (values ('cls-5', 'math'), ('cls-9', 'science')) as v(ref, subject_id)
),
grid as (
  select cls.*, cp.seq as checkpoint, cp.closes_on,
         case cp.seq when 1 then t.p1 when 2 then t.p2 when 3 then t.p3 else t.p4 end as pct
  from cls join target t on t.ref = cls.external_ref
  cross join public.checkpoints cp
),
cell as (
  select g.id as classroom_id, g.external_ref, g.school_id, g.term_id, g.homeroom_teacher_id,
         g.checkpoint, g.closes_on, g.pct, g.roster, sub.id as subject_id,
         row_number() over (partition by g.id, g.checkpoint order by sub.sort_order)::int as subject_rank,
         count(*)  over (partition by g.id, g.checkpoint)::int                            as subject_n
  from grid g
  join public.subjects sub
    on not (g.checkpoint = 4
            and exists (select 1 from late l where l.ref = g.external_ref and l.subject_id = sub.id))
),
ranked as (
  select s.id as student_id, s.classroom_id,
         row_number() over (partition by s.classroom_id order by s.code)::int as student_rank
  from public.students s
)
insert into public.assessments
  (school_id, term_id, classroom_id, student_id, subject_id, checkpoint, score, teacher_id, recorded_by, recorded_at)
select
  c.school_id, c.term_id, c.classroom_id, r.student_id, c.subject_id, c.checkpoint,
  case when c.subject_rank <= q.passing_subjects then 70 + (h.hash % 27) else 42 + (h.hash % 28) end,
  c.homeroom_teacher_id,
  -- Q2: office staff typed ม.2/1's checkpoint 3 on the teacher's behalf.
  case when c.external_ref = 'cls-9' and c.checkpoint = 3
       then (select id from public.teachers where external_ref = 'tch-staff')
       else c.homeroom_teacher_id end,
  (c.closes_on + 2)::timestamptz
from cell c
join ranked r on r.classroom_id = c.classroom_id
cross join lateral (
  select greatest(0, least(
    c.subject_n,
    round(c.roster * c.subject_n * c.pct / 100.0)::int - (r.student_rank - 1) * c.subject_n
  ))::int as passing_subjects
) q
cross join lateral (
  select abs(hashtext(r.student_id::text || c.subject_id || c.checkpoint::text)) as hash
) h;

-- ---------------------------------------------------------------------------
-- S5 behaviour incidents (R2)
--
-- behaviour = 100 - (2*l1 + 5*l2 + 10*l3) + (term_weeks - incident_weeks), so
-- the mix below is solved backwards from each class's blueprint index. One
-- incident per week at most, which is what makes the recovery term well defined.
-- Level 1s first and 3s last, so the serious ones land inside R7's 30-day window.
-- ---------------------------------------------------------------------------
with plan as (
  select * from (values
    ('cls-1',  5, 0, 1), ('cls-2',  2, 0, 2), ('cls-3', 7, 0, 1),
    ('cls-4', 10, 0, 0), ('cls-5', 12, 0, 1), ('cls-6', 4, 0, 2),
    ('cls-7',  1, 0, 2), ('cls-8',  7, 0, 2), ('cls-9', 13, 0, 1)
  ) as v(ref, l1, l2, l3)
),
expanded as (
  select p.ref, x.level,
         row_number() over (partition by p.ref order by x.level, x.i)::int as k,
         (p.l1 + p.l2 + p.l3)::int as total
  from plan p
  cross join lateral (
    select 1 as level, i from generate_series(1, p.l1) i
    union all select 2, i from generate_series(1, p.l2) i
    union all select 3, i from generate_series(1, p.l3) i
  ) x
)
insert into public.behaviour_incidents
  (school_id, term_id, classroom_id, student_id, incident_type_id, level, occurred_at, note, recorded_by)
select
  c.school_id, c.term_id, c.id, st.student_id,
  case when e.level = 3 then 'fight'
       else (select it.id from public.incident_types it where it.sort_order = 1 + (e.k % 3)) end,
  e.level,
  (t.starts_on + (floor((e.k - 1) * 18.0 / e.total)::int * 7) + 2)::timestamptz,
  case when e.level = 3 then 'เชิญผู้ปกครองพบครูประจำชั้น' else null end,
  c.homeroom_teacher_id
from expanded e
join public.classrooms c on c.external_ref = e.ref
join public.terms t on t.id = c.term_id
cross join lateral (
  select s.id as student_id from public.students s
  where s.classroom_id = c.id order by s.code offset ((e.k * 5) % 30) limit 1
) st;

-- ---------------------------------------------------------------------------
-- S5 observation rounds (R3)
--
-- R3 averages all ten scores across the two rounds, so the mean moves in 0.1
-- steps. Each teacher gets a target pair of round totals, spread across the five
-- topics with a rotating remainder so the rounds do not look identical.
-- ---------------------------------------------------------------------------
with homeroom as (
  select c.homeroom_teacher_id as teacher_id, v.s1, v.s2
  from public.classrooms c
  join (values
    ('cls-1', 21, 22), ('cls-2', 20, 21), ('cls-3', 18, 20),
    ('cls-4', 19, 21), ('cls-5', 15, 17), ('cls-6', 19, 20),
    ('cls-7', 22, 23), ('cls-8', 17, 18), ('cls-9', 15, 16)
  ) as v(ref, s1, s2) on v.ref = c.external_ref
),
-- Everyone else, spread so the four bands come out 9 / 16 / 11 / 6.
others as (
  select t.id as teacher_id,
         row_number() over (order by (not t.is_department_head), t.external_ref)::int as k
  from public.teachers t
  where t.role = 'teacher'
    and not exists (select 1 from public.classrooms c where c.homeroom_teacher_id = t.id)
),
targets as (
  select teacher_id, s1, s2 from homeroom
  union all
  select teacher_id,
         case when k <= 8 then 22 when k <= 21 then 20 when k <= 29 then 18 else 15 end,
         case when k <= 8 then 24 when k <= 21 then 22 when k <= 29 then 19 else 17 end
  from others
),
numbered as (select tg.*, row_number() over (order by tg.teacher_id)::int as idx from targets tg),
rounds as (
  select n.teacher_id, n.idx, r.round, case r.round when 1 then n.s1 else n.s2 end as total
  from numbered n cross join (values (1), (2)) as r(round)
),
inserted as (
  insert into public.observations (school_id, term_id, teacher_id, observer_id, round, recorded_at)
  select t.school_id, term.id, r.teacher_id, obs.id, r.round,
         (term.starts_on + case r.round when 1 then 45 else 100 end)::timestamptz
  from rounds r
  join public.teachers t on t.id = r.teacher_id
  join public.terms term on term.code = '2569-1'
  cross join lateral (
    select h.id from public.teachers h
    where h.is_department_head and h.id <> r.teacher_id
    order by h.external_ref offset ((r.idx + r.round) % 7) limit 1
  ) obs
  returning id, round, teacher_id
)
insert into public.observation_scores (observation_id, topic_id, score)
select i.id, tp.id,
       (r.total / 5) + case when ((tp.sort_order - 1 + i.round) % 5) < (r.total % 5) then 1 else 0 end
from inserted i
join rounds r on r.teacher_id = i.teacher_id and r.round = i.round
cross join public.observation_topics tp;

-- ---------------------------------------------------------------------------
-- S5 parent engagement (R4)
--
-- Scale the school-wide channel profile so each class's weighted index lands on
-- its blueprint figure. The profile is the shape the design shows.
-- ---------------------------------------------------------------------------
with profile as (
  select * from (values
    ('line_oa', 0.58), ('conference', 0.71), ('homework', 0.46),
    ('fee', 0.78), ('volunteer', 0.23), ('survey', 0.40)
  ) as v(channel_id, base)
),
profile_index as (
  select sum(pc.weight * p.base) as idx
  from profile p join public.parent_channels pc on pc.id = p.channel_id
),
class_target as (
  select c.id as classroom_id, c.school_id, c.term_id, v.target,
         (select count(*) from public.students s where s.classroom_id = c.id)::int as roster
  from public.classrooms c
  join (values
    ('cls-1', 71), ('cls-2', 68), ('cls-3', 54), ('cls-4', 62), ('cls-5', 41),
    ('cls-6', 58), ('cls-7', 76), ('cls-8', 47), ('cls-9', 38)
  ) as v(ref, target) on v.ref = c.external_ref
),
rate as (
  select ct.*, p.channel_id, least(1.0, p.base * ct.target / pi.idx) as rate
  from class_target ct cross join profile p cross join profile_index pi
),
ranked as (
  select g.id as guardian_id, s.classroom_id,
         row_number() over (partition by s.classroom_id order by s.code)::int as rn
  from public.guardians g join public.students s on s.id = g.student_id
)
insert into public.parent_engagement
  (school_id, term_id, classroom_id, guardian_id, channel_id, done, recorded_at, recorded_by)
select r.school_id, r.term_id, r.classroom_id, g.guardian_id, r.channel_id,
       g.rn <= round(r.roster * r.rate),
       (t.starts_on + 90)::timestamptz,
       (select id from public.teachers where external_ref = 'tch-staff')
from rate r
join ranked g on g.classroom_id = r.classroom_id
join public.terms t on t.id = r.term_id;

-- ---------------------------------------------------------------------------
-- S6 tasks. Due dates are relative to today, so R8 keeps producing a live mix of
-- pending, overdue and done however long this seed sits in the database.
-- ---------------------------------------------------------------------------
with spec as (
  select * from (values
    ('ส่งแผนยกระดับผลสัมฤทธิ์คณิตศาสตร์ ม.2/1',     'cls-9', -4,  null::int, 'action_item'),
    ('เข้ารอบโค้ชชิ่งกับหัวหน้ากลุ่มสาระ',           'cls-5',  6,  null,      'action_item'),
    ('ทบทวนบันทึกพฤติกรรมคาบ 6 และเสนอมาตรการ',     'cls-8',  2,  null,      'action_item'),
    ('จัดกิจกรรม SCL ไทย-จีน หน่วยที่ 3 และ 4',      'cls-3', 11,  null,      'manual'),
    ('ส่งผลประเมินจุดตรวจที่ 4 กลุ่มสาระคณิตศาสตร์', null,    -2,  null,      'action_item'),
    ('รวบรวมแบบสอบถามผู้ปกครอง ภาคเรียนที่ 1',       null,    -8,  -9,        'manual'),
    ('อัปเดตแผนการสอนหลังนิเทศรอบ 1',                'cls-6', -15, -16,       'manual')
  ) as v(title, class_ref, due_offset, done_offset, source)
),
assign as (
  select * from (values
    ('ส่งแผนยกระดับผลสัมฤทธิ์คณิตศาสตร์ ม.2/1',     'tch-009'),
    ('เข้ารอบโค้ชชิ่งกับหัวหน้ากลุ่มสาระ',           'tch-005'),
    ('ทบทวนบันทึกพฤติกรรมคาบ 6 และเสนอมาตรการ',     'tch-008'),
    ('จัดกิจกรรม SCL ไทย-จีน หน่วยที่ 3 และ 4',      'tch-003'),
    ('ส่งผลประเมินจุดตรวจที่ 4 กลุ่มสาระคณิตศาสตร์', 'tch-005'),
    ('ส่งผลประเมินจุดตรวจที่ 4 กลุ่มสาระคณิตศาสตร์', 'tch-009'),
    ('รวบรวมแบบสอบถามผู้ปกครอง ภาคเรียนที่ 1',       'tch-001'),
    ('รวบรวมแบบสอบถามผู้ปกครอง ภาคเรียนที่ 1',       'tch-002'),
    ('รวบรวมแบบสอบถามผู้ปกครอง ภาคเรียนที่ 1',       'tch-004'),
    ('อัปเดตแผนการสอนหลังนิเทศรอบ 1',                'tch-006')
  ) as v(title, teacher_ref)
),
new_tasks as (
  insert into public.tasks
    (school_id, term_id, title, classroom_id, due_date, source, completed_at, completed_by, created_by, created_at)
  select t.school_id, t.id, sp.title, c.id,
         current_date + sp.due_offset,
         sp.source::public.task_source,
         case when sp.done_offset is null then null else (current_date + sp.done_offset)::timestamptz end,
         case when sp.done_offset is null then null
              else (select tc.id from public.teachers tc
                    join assign a2 on a2.teacher_ref = tc.external_ref
                    where a2.title = sp.title order by tc.external_ref limit 1) end,
         dir.id,
         (current_date - 20)::timestamptz
  from spec sp
  join public.terms t on t.code = '2569-1'
  left join public.classrooms c on c.external_ref = sp.class_ref
  cross join lateral (select id from public.teachers where external_ref = 'tch-director') dir
  returning id, title
)
insert into public.task_assignees (task_id, teacher_id)
select nt.id, tc.id
from new_tasks nt
join assign a on a.title = nt.title
join public.teachers tc on tc.external_ref = a.teacher_ref;

-- ---------------------------------------------------------------------------
-- S1 import history
-- ---------------------------------------------------------------------------
with batches as (
  insert into public.import_batches
    (school_id, term_id, file_name, mode, rows_ok, rows_failed, state, uploaded_by, uploaded_at)
  select t.school_id, t.id, v.fname, v.mode::public.import_mode, v.ok, v.failed,
         'confirmed', st.id, (t.starts_on + v.day_offset)::timestamptz
  from public.terms t
  cross join (values
    ('master-data-2569-s1.xlsx',   'replace', 365, 0, -6),
    ('students-transfer-aug.xlsx', 'append',    4, 2, 82)
  ) as v(fname, mode, ok, failed, day_offset)
  cross join lateral (select id from public.teachers where external_ref = 'tch-staff') st
  where t.code = '2569-1'
  returning id, file_name
)
insert into public.import_errors (batch_id, sheet, row_no, reason)
select b.id, v.sheet, v.row_no, v.reason
from batches b
join (values
  ('students-transfer-aug.xlsx', 'students', 5, 'รหัสนักเรียนซ้ำกับที่มีอยู่แล้ว (6903021)'),
  ('students-transfer-aug.xlsx', 'students', 7, 'ไม่พบห้องเรียน "ป.7/1" ในทะเบียนภาคเรียนนี้')
) as v(fname, sheet, row_no, reason) on v.fname = b.file_name;

commit;

-- R7 — let the rules raise the action items. Expect 16 open.
select public.refresh_action_items(id) as open_action_items
from public.terms where code = '2569-1';
