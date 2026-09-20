-- ============================================================================
-- Run after the migrations and the seed. Every figure below should match what
-- the running app shows, because both are computed from the same rows.
--
-- Expected (semester 1 / 2569):
--
--   Row counts        44 staff · 9 classes · 314 students · 314 guardians
--                     9,976 marks · 73 incidents · 84 observation rounds
--                     420 topic scores · 1,884 parent rows · 7 tasks
--
--   Class table       ป.1/1  88 / 92 / 4.3 / 71  on track
--                     ป.2/1  85 / 90 / 4.1 / 68  on track
--                     ป.3/1  79 / 86 / 3.8 / 53  watch
--                     ป.4/1  83 / 88 / 4.0 / 62  on track
--                     ป.4/2  74 / 71 / 3.2 / 41  risk
--                     ป.5/1  81 / 84 / 3.9 / 58  watch
--                     ป.6/1  90 / 93 / 4.5 / 75  on track
--                     ม.1/1  77 / 75 / 3.5 / 47  watch
--                     ม.2/1  72 / 68 / 3.1 / 38  risk
--
--   Observation bands 9 / 16 / 11 / 6   (6 teachers under the 3.5 threshold)
--   Parent channels   Line OA 58% · conference 71% · homework 46%
-- ============================================================================

\echo '--- row counts ---'
select 'teachers' as table_name, count(*) from public.teachers
union all select 'classrooms',         count(*) from public.classrooms
union all select 'students',           count(*) from public.students
union all select 'guardians',          count(*) from public.guardians
union all select 'assessments',        count(*) from public.assessments
union all select 'behaviour',          count(*) from public.behaviour_incidents
union all select 'observations',       count(*) from public.observations
union all select 'observation_scores', count(*) from public.observation_scores
union all select 'parent_engagement',  count(*) from public.parent_engagement
union all select 'tasks',              count(*) from public.tasks
union all select 'action_items(open)', count(*) from public.action_items where closed_at is null
order by 1;

\echo '--- R1-R6 per class (should match the dashboard table) ---'
select
  classroom_name,
  homeroom_name_en,
  student_count,
  round(assessment_pct)              as assess,
  round(behaviour_index)             as behaviour,
  round(observation_score, 1)        as observation,
  round(parent_index)                as parent,
  class_index,
  class_status
from public.v_class_metrics
order by classroom_name;

\echo '--- school KPI cards ---'
select
  round(assessment_pct)       as assessment,
  round(behaviour_index)      as behaviour,
  round(observation_score, 1) as observation,
  round(parent_index)         as parent,
  classroom_count,
  student_count
from public.v_school_metrics;

\echo '--- observation bands (expect 9 / 16 / 11 / 6) ---'
select * from public.v_observation_bands;

\echo '--- parent channels, school wide ---'
select
  pc.name_th,
  pc.weight,
  round(sum(r.done_count)::numeric * 100 / sum(r.guardian_count)) as rate_pct
from public.v_parent_channel_rates r
join public.parent_channels pc on pc.id = r.channel_id
group by pc.name_th, pc.weight, pc.sort_order
order by pc.sort_order;

\echo '--- R1 series per checkpoint (feeds the sparklines) ---'
select c.name as classroom, a.checkpoint, round(a.pct) as pct
from public.v_assessment_by_checkpoint a
join public.classrooms c on c.id = a.classroom_id
order by c.name, a.checkpoint;

\echo '--- R7 action items raised ---'
select trigger_type, tone, count(*)
from public.action_items
where closed_at is null
group by trigger_type, tone
order by 1;

\echo '--- R8 task status ---'
select status, count(*) from public.v_tasks group by status order by 1;

\echo '--- S3 students below the pass mark, worst class first ---'
select c.name as classroom, count(*) as students_below
from public.v_struggling_students s
join public.classrooms c on c.id = s.classroom_id
group by c.name
order by students_below desc, c.name;

\echo '--- integrity: nothing orphaned, weights still total 100 ---'
select
  (select count(*) from public.parent_channels)                                as channels,
  (select sum(weight) from public.parent_channels)                             as weight_total,
  (select count(*) from public.assessments a
     where not exists (select 1 from public.students s where s.id = a.student_id)) as orphan_marks,
  (select count(*) from public.classrooms c
     where not exists (select 1 from public.teachers t where t.id = c.homeroom_teacher_id)) as orphan_classes;
