-- ============================================================================
-- The checkpoint-by-checkpoint series behind the sparklines.
--
-- v_class_metrics answers "where is this class now". The dashboard also draws
-- where it has been, which means evaluating R1–R4 as of each checkpoint rather
-- than as of today. Same formulas, different cut-off — kept here so the rules
-- still have exactly one definition.
-- ============================================================================

-- The seed stamped every parent-engagement row with the same date, which would
-- leave three of the four points on that sparkline empty. Spread them across the
-- second half of the term. Totals are unaffected: R4 counts every row whatever
-- its date, so the current index does not move.
update public.parent_engagement pe
   set recorded_at = (t.starts_on + 60 + (r.rn % 55)::int)::timestamptz
  from public.terms t,
       (select id, row_number() over (partition by classroom_id order by guardian_id, channel_id) as rn
          from public.parent_engagement) r
 where r.id = pe.id and t.id = pe.term_id;

create or replace function public.class_metric_series(p_term_id uuid)
returns table (
  classroom_id uuid,
  checkpoint   smallint,
  assessment   numeric,
  behaviour    numeric,
  observation  numeric,
  parent       numeric
)
language sql
stable
security invoker
set search_path = public
as $fn$
  with term as (
    select id, starts_on, ends_on, term_weeks from public.terms where id = p_term_id
  ),
  cut as (
    select c.id as classroom_id, c.homeroom_teacher_id, cp.seq,
           (cp.closes_on + 1)::timestamptz as at
    from public.classrooms c
    cross join public.checkpoints cp
    where c.term_id = p_term_id and cp.term_id = p_term_id
  )
  select
    k.classroom_id,
    k.seq,
    a.pct,
    case when coalesce(b.seen, 0) = 0 and w.weeks_elapsed = 0 then null else
      greatest(0, least(100,
          bs.start_index
        - coalesce(b.penalty, 0)
        + greatest(0, w.weeks_elapsed - coalesce(b.weeks_with_incident, 0)) * bs.recovery_per_quiet_week
      ))::numeric
    end,
    o.score,
    p.idx
  from cut k
  cross join term t
  join public.behaviour_settings bs on bs.term_id = p_term_id
  cross join lateral (
    select greatest(0, least(
      t.term_weeks,
      ceil(extract(epoch from (least(k.at, (t.ends_on + 1)::timestamptz) - t.starts_on::timestamptz)) / 604800.0)
    ))::integer as weeks_elapsed
  ) w
  left join lateral (
    select sum(il.penalty) as penalty,
           count(*)        as seen,
           count(distinct floor(extract(epoch from (bi.occurred_at - t.starts_on::timestamptz)) / 604800.0)) as weeks_with_incident
    from public.behaviour_incidents bi
    join public.incident_levels il on il.level = bi.level
    where bi.classroom_id = k.classroom_id and bi.occurred_at <= k.at
  ) b on true
  left join lateral (
    select round(avg(os.score), 2) as score
    from public.observations obs
    join public.observation_scores os on os.observation_id = obs.id
    where obs.teacher_id = k.homeroom_teacher_id and obs.recorded_at <= k.at
  ) o on true
  left join lateral (
    select sum(pc.weight * ch.rate)::numeric as idx
    from (
      select pe.channel_id, avg(case when pe.done then 1.0 else 0.0 end) as rate
      from public.parent_engagement pe
      where pe.classroom_id = k.classroom_id and pe.recorded_at <= k.at
      group by pe.channel_id
    ) ch
    join public.parent_channels pc on pc.id = ch.channel_id
  ) p on true
  left join public.v_assessment_by_checkpoint a
    on a.classroom_id = k.classroom_id and a.checkpoint = k.seq
  order by k.classroom_id, k.seq;
$fn$;

comment on function public.class_metric_series(uuid) is
  'R1-R4 evaluated as of each checkpoint. Feeds the dashboard sparklines and the S3 trend charts.';

grant execute on function public.class_metric_series(uuid) to authenticated;
