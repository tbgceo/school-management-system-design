-- ============================================================================
-- Reference data.
--
-- These rows are part of the schema, not the seed: the app's enums in
-- app/src/data/constants.js read exactly this list, and a deploy without them
-- would fail on the first foreign key. Re-runnable.
-- ============================================================================

-- S4: the 8 learning areas of the Thai core curriculum.
insert into public.subjects (id, name_th, name_en, sort_order) values
  ('thai',    'ภาษาไทย',                     'Thai',                 1),
  ('math',    'คณิตศาสตร์',                   'Mathematics',          2),
  ('science', 'วิทยาศาสตร์และเทคโนโลยี',       'Science & Technology', 3),
  ('social',  'สังคมศึกษา ศาสนา และวัฒนธรรม', 'Social Studies',       4),
  ('health',  'สุขศึกษาและพลศึกษา',           'Health & PE',          5),
  ('art',     'ศิลปะ',                        'Arts',                 6),
  ('career',  'การงานอาชีพ',                  'Occupations',          7),
  ('foreign', 'ภาษาต่างประเทศ',               'Foreign Languages',    8)
on conflict (id) do update
  set name_th = excluded.name_th,
      name_en = excluded.name_en,
      sort_order = excluded.sort_order;

-- S5: behaviour incident categories.
insert into public.incident_types (id, name_th, name_en, sort_order) values
  ('late',    'มาสาย',       'Late',     1),
  ('absent',  'ขาดเรียน',    'Absent',   2),
  ('uniform', 'แต่งกาย',     'Uniform',  3),
  ('fight',   'ทะเลาะวิวาท', 'Fighting', 4),
  ('other',   'อื่น ๆ',       'Other',    5)
on conflict (id) do update
  set name_th = excluded.name_th,
      name_en = excluded.name_en,
      sort_order = excluded.sort_order;

-- R2: the deduction per level. A3 flags the whole model as provisional.
insert into public.incident_levels (level, name_th, name_en, penalty) values
  (1, 'เตือน',         'Verbal warning',    2),
  (2, 'บันทึก',        'Logged',            5),
  (3, 'เชิญผู้ปกครอง', 'Parent called in', 10)
on conflict (level) do update
  set name_th = excluded.name_th,
      name_en = excluded.name_en,
      penalty = excluded.penalty;

-- A4: five observation topics, scored 1–5.
insert into public.observation_topics (id, name_th, name_en, sort_order) values
  ('plan',       'แผนการสอน',              'Lesson plan',           1),
  ('media',      'สื่อการสอน',              'Teaching media',        2),
  ('classroom',  'การจัดการชั้นเรียน',      'Classroom management',  3),
  ('assessment', 'การวัดผล',                'Assessment',            4),
  ('engagement', 'การมีส่วนร่วมของผู้เรียน', 'Learner engagement',    5)
on conflict (id) do update
  set name_th = excluded.name_th,
      name_en = excluded.name_en,
      sort_order = excluded.sort_order;

-- R4 / Q3: six channels, weights totalling 100.
insert into public.parent_channels (id, name_th, name_en, weight, sort_order) values
  ('line_oa',    'รับข่าวผ่าน Line OA',      'Line OA opt-in',         20, 1),
  ('conference', 'มาประชุมผู้ปกครอง',        'Conference attendance',  25, 2),
  ('homework',   'เซ็นรับทราบการบ้าน',      'Homework sign-off',      20, 3),
  ('fee',        'ชำระค่าธรรมเนียมตรงเวลา', 'Fees paid on time',      15, 4),
  ('volunteer',  'อาสาสมัครกิจกรรม',        'Activity volunteer',     10, 5),
  ('survey',     'ตอบแบบสอบถาม',            'Survey response',        10, 6)
on conflict (id) do update
  set name_th = excluded.name_th,
      name_en = excluded.name_en,
      weight = excluded.weight,
      sort_order = excluded.sort_order;

-- R4 only holds together while the weights total 100; fail loudly if an edit breaks that.
do $$
declare total smallint;
begin
  select sum(weight) into total from public.parent_channels;
  if total <> 100 then
    raise exception 'parent_channels weights must total 100, got %', total;
  end if;
end;
$$;
