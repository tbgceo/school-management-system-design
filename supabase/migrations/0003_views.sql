-- ============================================================================
-- Rules R1–R8 as views and functions.
--
-- These mirror app/src/lib/rules.js one for one. The app can keep computing
-- client side and use these to cross-check, or read them directly and drop its
-- own arithmetic — either way there is a single definition of each rule, and it
-- reads its thresholds from metric_targets rather than from a constant.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- R6 — status bands, shared by every metric.
-- `scale` lifts a metric onto the common 0–100 axis (observation is 1–5, so 20).
-- `digits` is the precision the screen shows: the band is applied to the value
-- the reader sees, so a class at 76.97 displaying as 77 against an 82 target is
-- Watch, not At risk.
-- ----------------------------------------------------------------------------
create or replace function public.status_band(
  value          numeric,
  target         numeric,
  scale          numeric default 1,
  digits         integer default 0,
  declined_twice boolean default false
)
returns public.status_band
language sql
immutable
as $$
  select case
    when value is null then 'watch'::public.status_band
    when round(value, digits) * scale < target * scale - 5 or declined_twice then 'risk'::public.status_band
    when round(value, digits) * scale < target * scale then 'watch'::public.status_band
    else 'ok'::public.status_band
  end;
$$;

-- ----------------------------------------------------------------------------
-- R1 — assessment against target, per class per checkpoint.
-- Share of marks at or above the pass score, never the mean, so a few strong
-- students cannot mask the rest.
-- ----------------------------------------------------------------------------
create or replace view public.v_assessment_by_checkpoint with (security_invoker = true) as
select
  a.term_id,
  a.classroom_id,
  a.checkpoint,
  (count(*) filter (where a.score >= mt.target))::numeric * 100 / count(*) as pct,
  count(*)                        as marks_recorded,
  count(distinct a.student_id)    as students_scored
from public.assessments a
join public.metric_targets mt
  on mt.term_id = a.term_id and mt.metric = 'passing_score'
group by a.term_id, a.classroom_id, a.checkpoint;

comment on view public.v_assessment_by_checkpoint is 'R1, per checkpoint. This is the series the sparklines read.';

-- Latest checkpoint that actually has marks, plus the two-checkpoint slide R6 treats as At risk.
create or replace view public.v_class_assessment with (security_invoker = true) as
with series as (
  select
    term_id, classroom_id, checkpoint, pct,
    row_number() over (partition by term_id, classroom_id order by checkpoint desc) as rn,
    lag(pct, 1)  over (partition by term_id, classroom_id order by checkpoint)      as prev_1,
    lag(pct, 2)  over (partition by term_id, classroom_id order by checkpoint)      as prev_2
  from public.v_assessment_by_checkpoint
)
select
  term_id,
  classroom_id,
  checkpoint as latest_checkpoint,
  pct        as assessment_pct,
  (prev_1 is not null and prev_2 is not null and pct < prev_1 and prev_1 < prev_2) as declined_twice
from series
where rn = 1;

-- ----------------------------------------------------------------------------
-- R2 — behaviour index.
-- Opens at 100, loses the level penalty per incident, recovers one point for
-- every elapsed week that carried no incident.
-- ----------------------------------------------------------------------------
create or replace view public.v_class_behaviour with (security_invoker = true) as
select
  c.term_id,
  c.id as classroom_id,
  greatest(0, least(100,
      bs.start_index
    - coalesce(p.penalty_total, 0)
    + greatest(0, w.weeks_elapsed - coalesce(p.weeks_with_incident, 0)) * bs.recovery_per_quiet_week
  ))::numeric as behaviour_index,
  coalesce(p.incident_count, 0) as incident_count
from public.classrooms c
join public.terms t                on t.id = c.term_id
join public.behaviour_settings bs  on bs.term_id = c.term_id
cross join lateral (
  select greatest(0, least(
    t.term_weeks,
    ceil(extract(epoch from (least(now(), (t.ends_on + 1)::timestamptz) - t.starts_on::timestamptz)) / 604800.0)
  ))::integer as weeks_elapsed
) w
left join lateral (
  select
    sum(il.penalty)      as penalty_total,
    count(*)             as incident_count,
    count(distinct floor(extract(epoch from (bi.occurred_at - t.starts_on::timestamptz)) / 604800.0)) as weeks_with_incident
  from public.behaviour_incidents bi
  join public.incident_levels il on il.level = bi.level
  where bi.classroom_id = c.id
    and bi.occurred_at <= now()
) p on true;

comment on view public.v_class_behaviour is 'R2. The recovery term counts elapsed weeks with no incident, capped at the term length.';

-- ----------------------------------------------------------------------------
-- R3 — observation score.
-- Mean of every topic score across both rounds held so far.
--
-- This departs from the written spec, which takes the latest round only. Five
-- integer topics from one round can land only on a 0.2 step, which put the
-- approved design's 4.3 out of reach; ten scores across two rounds move in 0.1
-- steps. The school still has to confirm it — it changes who crosses 3.5.
-- ----------------------------------------------------------------------------
create or replace view public.v_teacher_observation with (security_invoker = true) as
select
  o.term_id,
  o.teacher_id,
  avg(os.score)::numeric(4,2) as observation_score,
  count(distinct o.round)     as rounds_held
from public.observations o
join public.observation_scores os on os.observation_id = o.id
where o.recorded_at <= now()
group by o.term_id, o.teacher_id;

-- The right-hand panel on S2.
create or replace view public.v_observation_bands with (security_invoker = true) as
select
  vo.term_id,
  count(*) filter (where vo.observation_score >= 4.5)                                   as band_4_5_to_5_0,
  count(*) filter (where vo.observation_score >= 4.0 and vo.observation_score < 4.5)    as band_4_0_to_4_4,
  count(*) filter (where vo.observation_score >= 3.5 and vo.observation_score < 4.0)    as band_3_5_to_3_9,
  count(*) filter (where vo.observation_score < 3.5)                                    as band_below_3_5,
  count(*)                                                                              as teachers_scored
from public.v_teacher_observation vo
join public.teachers t on t.id = vo.teacher_id
where t.role = 'teacher' and t.is_active
group by vo.term_id;

-- ----------------------------------------------------------------------------
-- R4 — parent engagement index, weighted across the six channels.
-- ----------------------------------------------------------------------------
create or replace view public.v_parent_channel_rates with (security_invoker = true) as
select
  pe.term_id,
  pe.classroom_id,
  pe.channel_id,
  pc.name_th,
  pc.weight,
  count(*) filter (where pe.done)                          as done_count,
  count(*)                                                 as guardian_count,
  (count(*) filter (where pe.done))::numeric * 100 / count(*) as rate_pct
from public.parent_engagement pe
join public.parent_channels pc on pc.id = pe.channel_id
group by pe.term_id, pe.classroom_id, pe.channel_id, pc.name_th, pc.weight;

create or replace view public.v_class_parent with (security_invoker = true) as
select
  term_id,
  classroom_id,
  sum(weight * rate_pct / 100)::numeric(6,2) as parent_index
from public.v_parent_channel_rates
group by term_id, classroom_id;

-- ----------------------------------------------------------------------------
-- R5 + R6 — the row behind every line of the dashboard table.
-- ----------------------------------------------------------------------------
create or replace view public.v_class_metrics with (security_invoker = true) as
select
  c.id                as classroom_id,
  c.term_id,
  c.school_id,
  c.name              as classroom_name,
  c.level,
  c.grade,
  c.homeroom_teacher_id,
  ht.name_th          as homeroom_name_th,
  ht.name_en          as homeroom_name_en,
  sc.student_count,
  a.assessment_pct,
  b.behaviour_index,
  o.observation_score,
  p.parent_index,
  ix.class_index,
  public.status_band(a.assessment_pct,   tg.t_assessment,  1,  0, coalesce(a.declined_twice, false)) as assessment_status,
  public.status_band(b.behaviour_index,  tg.t_behaviour,   1,  0, false)                             as behaviour_status,
  public.status_band(o.observation_score, tg.t_observation, 20, 1, false)                            as observation_status,
  public.status_band(p.parent_index,     tg.t_parent,      1,  0, false)                             as parent_status,
  -- The dashboard's Status column follows the headline metric, the way the
  -- approved design reads it; per-metric colour keeps its own band.
  public.status_band(a.assessment_pct,   tg.t_assessment,  1,  0, coalesce(a.declined_twice, false)) as class_status
from public.classrooms c
join public.teachers ht on ht.id = c.homeroom_teacher_id
join lateral (
  select
    max(target) filter (where metric = 'assessment')  as t_assessment,
    max(target) filter (where metric = 'behaviour')   as t_behaviour,
    max(target) filter (where metric = 'observation') as t_observation,
    max(target) filter (where metric = 'parent')      as t_parent
  from public.metric_targets mt
  where mt.term_id = c.term_id
) tg on true
cross join lateral (
  select count(*)::integer as student_count from public.students s where s.classroom_id = c.id
) sc
left join public.v_class_assessment   a on a.classroom_id = c.id and a.term_id = c.term_id
left join public.v_class_behaviour    b on b.classroom_id = c.id and b.term_id = c.term_id
left join public.v_class_parent       p on p.classroom_id = c.id and p.term_id = c.term_id
left join public.v_teacher_observation o on o.teacher_id = c.homeroom_teacher_id and o.term_id = c.term_id
cross join lateral (
  -- R5 averages only the metrics that exist, then rounds.
  select round(avg(v))::integer as class_index
  from unnest(array_remove(
    array[a.assessment_pct, b.behaviour_index, o.observation_score * 20, p.parent_index],
    null
  )) as v
) ix;

comment on view public.v_class_metrics is
  'One row per classroom: R1–R5 plus the R6 band for each metric. This is what S2 renders.';

-- School-wide KPI cards: the mean across the classes in view.
create or replace view public.v_school_metrics with (security_invoker = true) as
select
  term_id,
  avg(assessment_pct)::numeric(6,2)   as assessment_pct,
  avg(behaviour_index)::numeric(6,2)  as behaviour_index,
  avg(observation_score)::numeric(4,2) as observation_score,
  avg(parent_index)::numeric(6,2)     as parent_index,
  count(*)                            as classroom_count,
  sum(student_count)                  as student_count
from public.v_class_metrics
group by term_id;

-- ----------------------------------------------------------------------------
-- S3 — students below the pass mark at the latest checkpoint they have marks for.
-- ----------------------------------------------------------------------------
create or replace view public.v_struggling_students with (security_invoker = true) as
with per_checkpoint as (
  select a.term_id, a.classroom_id, a.student_id, a.checkpoint, avg(a.score) as cp_avg
  from public.assessments a
  group by 1, 2, 3, 4
),
latest as (
  select distinct on (term_id, student_id)
    term_id, classroom_id, student_id, checkpoint, cp_avg
  from per_checkpoint
  order by term_id, student_id, checkpoint desc
)
select
  l.term_id,
  l.classroom_id,
  l.student_id,
  s.code,
  s.name_th,
  round(l.cp_avg, 1) as latest_avg,
  (select count(*) from per_checkpoint pc
     where pc.student_id = l.student_id and pc.cp_avg < mt.target) as failed_checkpoints
from latest l
join public.students s        on s.id = l.student_id
join public.metric_targets mt on mt.term_id = l.term_id and mt.metric = 'passing_score'
where l.cp_avg < mt.target;

-- ----------------------------------------------------------------------------
-- R7 input — checkpoint submissions past the grace period.
-- ----------------------------------------------------------------------------
create or replace view public.v_late_submissions with (security_invoker = true) as
select
  c.term_id,
  c.id                              as classroom_id,
  cp.seq                            as checkpoint,
  s.id                              as subject_id,
  s.name_th                         as subject_name_th,
  (current_date - cp.closes_on)     as days_late
from public.classrooms c
join public.checkpoints cp     on cp.term_id = c.term_id
join public.policy_settings ps on ps.term_id = c.term_id
cross join public.subjects s
where cp.closes_on < current_date
  and (current_date - cp.closes_on) > ps.submission_grace_days
  and not exists (
    select 1 from public.assessments a
    where a.classroom_id = c.id
      and a.checkpoint   = cp.seq
      and a.subject_id   = s.id
  );

-- ----------------------------------------------------------------------------
-- R8 — task status, derived from the due date, never stored.
-- ----------------------------------------------------------------------------
create or replace view public.v_tasks with (security_invoker = true) as
select
  t.*,
  case
    when t.completed_at is not null then 'done'
    when t.due_date < current_date  then 'overdue'
    else 'pending'
  end as status,
  coalesce(
    (select array_agg(ta.teacher_id order by ta.teacher_id)
       from public.task_assignees ta where ta.task_id = t.id),
    '{}'::uuid[]
  ) as assignee_ids
from public.tasks t;

-- ============================================================================
-- R7 — raise the action items.
--
-- The system creates these; nobody adds one by hand. Run it on a schedule or
-- after a write. Re-running is safe: rows are upserted on their identity, and
-- anything already closed keeps its closure.
-- ============================================================================
-- security definer: action_items has no INSERT policy on purpose — R7 says the
-- system raises these and nobody adds one by hand, so the only way in is through
-- this function. Execute is revoked from the API roles below; run it from a
-- scheduled job or with the service key.
create or replace function public.refresh_action_items(p_term_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_school_id uuid;
  v_coaching  numeric;
  v_target    numeric;
  v_count     integer;
begin
  select school_id into v_school_id from public.terms where id = p_term_id;
  if v_school_id is null then
    raise exception 'Unknown term %', p_term_id;
  end if;

  select target into v_coaching from public.metric_targets where term_id = p_term_id and metric = 'coaching';
  select target into v_target   from public.metric_targets where term_id = p_term_id and metric = 'assessment';

  -- Trigger 1: a class sitting in the At risk band.
  insert into public.action_items
    (school_id, term_id, trigger_type, classroom_id, teacher_id, ref, title, title_th, detail, owner_name, action_label, tone)
  select
    v_school_id, p_term_id, 'class_at_risk', m.classroom_id, m.homeroom_teacher_id, '',
    format('Assessment %s points under target', round(v_target - m.assessment_pct)),
    format('ผลประเมินต่ำกว่าเป้าหมาย %s จุด', round(v_target - m.assessment_pct)),
    format('%s อยู่ที่ %s%% เทียบเป้าหมาย %s%% ของภาคเรียน', m.classroom_name, round(m.assessment_pct), round(v_target)),
    m.homeroom_name_th, 'เปิดแผน', 'danger'
  from public.v_class_metrics m
  where m.term_id = p_term_id and m.class_status = 'risk'
  on conflict (term_id, trigger_type, classroom_id, teacher_id, ref) do update
    set title = excluded.title, title_th = excluded.title_th, detail = excluded.detail,
        owner_name = excluded.owner_name, tone = excluded.tone;

  -- Trigger 2: observation below the coaching threshold.
  insert into public.action_items
    (school_id, term_id, trigger_type, classroom_id, teacher_id, ref, title, title_th, detail, owner_name, action_label, tone)
  select
    v_school_id, p_term_id, 'observation_low',
    (select c.id from public.classrooms c where c.homeroom_teacher_id = vo.teacher_id and c.term_id = p_term_id limit 1),
    vo.teacher_id, '',
    format('Observation score fell to %s', to_char(vo.observation_score, 'FM9.0')),
    format('คะแนนนิเทศลดลงเหลือ %s', to_char(vo.observation_score, 'FM9.0')),
    format('ต่ำกว่าเกณฑ์โค้ชชิ่ง %s ยังไม่ได้กำหนดรอบโค้ชในภาคเรียนนี้', to_char(v_coaching, 'FM9.0')),
    t.name_th, 'จัดรอบโค้ช', 'danger'
  from public.v_teacher_observation vo
  join public.teachers t on t.id = vo.teacher_id
  where vo.term_id = p_term_id and t.role = 'teacher' and vo.observation_score < v_coaching
  on conflict (term_id, trigger_type, classroom_id, teacher_id, ref) do update
    set title = excluded.title, title_th = excluded.title_th, detail = excluded.detail,
        owner_name = excluded.owner_name, tone = excluded.tone;

  -- Trigger 3: level 3 incidents in the last 30 days.
  insert into public.action_items
    (school_id, term_id, trigger_type, classroom_id, teacher_id, ref, title, title_th, detail, owner_name, action_label, tone)
  select
    v_school_id, p_term_id, 'behaviour_level3', bi.classroom_id, c.homeroom_teacher_id, '',
    format('%s level 3 discipline escalation(s)', count(*)),
    format('เหตุพฤติกรรมระดับ 3 จำนวน %s ครั้ง', count(*)),
    'ต้องเชิญผู้ปกครองและบันทึกผลการพูดคุยภายในสัปดาห์นี้',
    t.name_th, 'ดูบันทึก', 'warning'
  from public.behaviour_incidents bi
  join public.classrooms c on c.id = bi.classroom_id
  join public.teachers t   on t.id = c.homeroom_teacher_id
  where bi.term_id = p_term_id
    and bi.level = 3
    and bi.occurred_at >= now() - interval '30 days'
  group by bi.classroom_id, c.homeroom_teacher_id, t.name_th
  on conflict (term_id, trigger_type, classroom_id, teacher_id, ref) do update
    set title = excluded.title, title_th = excluded.title_th, tone = excluded.tone;

  -- Trigger 4: a checkpoint submission past the grace period.
  insert into public.action_items
    (school_id, term_id, trigger_type, classroom_id, teacher_id, ref, title, title_th, detail, owner_name, action_label, tone)
  select
    v_school_id, p_term_id, 'submission_late', ls.classroom_id, c.homeroom_teacher_id,
    format('cp%s:%s', ls.checkpoint, ls.subject_id),
    format('Checkpoint %s not submitted', ls.checkpoint),
    format('ยังไม่ส่งผลประเมินจุดตรวจที่ %s', ls.checkpoint),
    format('%s · เลยกำหนดมาแล้ว %s วัน', ls.subject_name_th, ls.days_late),
    t.name_th, 'เตือนครู', 'info'
  from public.v_late_submissions ls
  join public.classrooms c on c.id = ls.classroom_id
  join public.teachers t   on t.id = c.homeroom_teacher_id
  where ls.term_id = p_term_id
  on conflict (term_id, trigger_type, classroom_id, teacher_id, ref) do update
    set detail = excluded.detail;

  select count(*) into v_count
  from public.action_items
  where term_id = p_term_id and closed_at is null;

  return v_count;
end;
$$;

comment on function public.refresh_action_items(uuid) is
  'R7. Idempotent: re-running updates the wording and leaves closures alone.';

-- Closing one. R7 restricts this to the director; the RLS policy in 0004
-- enforces it for API callers, and this check covers direct SQL as well.
create or replace function public.close_action_item(p_item_id uuid, p_teacher_id uuid)
returns void
language plpgsql
security invoker
as $$
begin
  if (select role from public.teachers where id = p_teacher_id) <> 'director' then
    raise exception 'R7: only the director may close an action item';
  end if;

  update public.action_items
     set closed_at = now(), closed_by = p_teacher_id
   where id = p_item_id and closed_at is null;
end;
$$;

-- ----------------------------------------------------------------------------
-- Grants.
--
-- The views carry security_invoker, so reading one applies the caller's RLS on
-- the tables underneath — a teacher querying v_class_metrics sees their own
-- class and nothing else. Without that flag a view runs as its owner and would
-- have handed the whole school to anyone with the anon key.
-- ----------------------------------------------------------------------------
grant select on
  public.v_assessment_by_checkpoint, public.v_class_assessment, public.v_class_behaviour,
  public.v_teacher_observation, public.v_observation_bands, public.v_parent_channel_rates,
  public.v_class_parent, public.v_class_metrics, public.v_school_metrics,
  public.v_struggling_students, public.v_late_submissions, public.v_tasks
to authenticated;

revoke execute on function public.refresh_action_items(uuid) from public, anon, authenticated;
grant  execute on function public.refresh_action_items(uuid) to service_role;

grant execute on function public.close_action_item(uuid, uuid) to authenticated;
grant execute on function public.status_band(numeric, numeric, numeric, integer, boolean) to authenticated;
