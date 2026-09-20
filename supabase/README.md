# Supabase schema — TBG School OS Module 01

Designed against `Spec v1 - Module 01.dc.html` (screens S1–S6, rules R1–R9,
assumptions A1–A6) and the record shapes the app already consumes in
[`app/src/data/schema.js`](../app/src/data/schema.js).

> **Not yet applied.** The Supabase connector was not available in the session
> that produced these files, and no Postgres, Docker or Supabase CLI is
> installed on this machine, so **none of this SQL has been executed or tested**.
> It has been reviewed by hand, not run. Expect to fix something on first apply.

## Apply it

```bash
supabase db push
```

Or paste the files into the SQL editor, in order:

| Order | File | What it does |
|---|---|---|
| 1 | `migrations/0001_schema.sql` | Types, tables, keys, indexes, triggers |
| 2 | `migrations/0002_reference_data.sql` | Subjects, incident types and levels, observation topics, parent channels |
| 3 | `migrations/0003_views.sql` | R1–R8 as views and functions, grants |
| 4 | `migrations/0004_rls.sql` | Row level security — the spec's permission table |
| 5 | `seed.sql` | 12,700-odd rows of test data |
| — | `verify.sql` | Read-only checks with the expected numbers in the header |

Regenerate the seed after changing the app's fixture:

```bash
node supabase/scripts/generate-seed.mjs
```

## Shape

```
schools ─┬─ terms ─┬─ checkpoints            (A2: weeks 4/8/12/16)
         │         ├─ metric_targets         (A1: pass mark, per-metric targets)
         │         ├─ behaviour_settings     (R2: start index, recovery rate)
         │         └─ policy_settings        (R7/R9: grace and edit windows)
         │
         ├─ teachers ──────────── auth.users (director · teacher · staff)
         │      │
         └─ classrooms ─┬─ students ── guardians
                        │
                        ├─ assessments          student × subject × checkpoint
                        ├─ behaviour_incidents  → incident_types, incident_levels
                        ├─ parent_engagement    guardian × channel
                        ├─ action_items         raised by R7, closed by the director
                        └─ tasks ─┬─ task_assignees
                                  └─ task_attachments

teachers ── observations ── observation_scores   (5 topics × 2 rounds)
import_batches ── import_errors                  (S1)
edit_log                                          (R9, written by triggers)
```

Reference tables — `subjects`, `incident_types`, `incident_levels`,
`observation_topics`, `parent_channels` — sit outside the tree and are shared
across terms.

## Decisions behind the shape

**Nothing computed is stored.** R1–R6 and R8 are views, so the numbers cannot go
stale and a target change moves every screen at once. `v_class_metrics` is one
row per class and is what S2 renders; `v_school_metrics` is the KPI strip.

**What the school retunes is a row, not a constant.** Metric targets, channel
weights, incident penalties and checkpoint dates all live in tables, because A1,
A3, A4 and A5 each flag their value as unconfirmed. Changing the pass mark from
70 is one UPDATE, not a migration. `0002` refuses to load if the six channel
weights stop totalling 100, since R4 is meaningless otherwise.

**Proxy entry is modelled, not inferred.** `assessments.teacher_id` is whose
submission it is and `recorded_by` is who typed it; `on_behalf` is a generated
column so the two can never drift. That is Q2's "office staff fills in for a
teacher", and it survives into the database rather than living in the UI.

**Observation scores are normalised**, one row per topic, rather than a jsonb
blob — R3 is then a plain average, and a sixth topic is a row instead of a
migration.

**Action items are upserted, not appended.** `refresh_action_items(term)`
re-derives all four R7 triggers and is idempotent: re-running updates the wording
and leaves closures alone. Its identity index uses `nulls not distinct` so a
trigger with no classroom still collapses to one row. Run it on a schedule.

**R3 follows the app, not the written spec.** The spec averages the latest round
only; five integer topics can then land only on a 0.2 step, which put the
approved design's 4.3 out of reach. Both the app and `v_teacher_observation`
average all ten scores across the two rounds. This is still pending the school's
confirmation — it changes who crosses the 3.5 coaching threshold.

**Status compares the displayed value.** `status_band()` rounds to the precision
the screen shows before applying the band, so a class at 76.97% that renders as
77% against an 82% target reads Watch, not At risk — the badge never contradicts
the number beside it.

## Security

RLS is on for every table, and the policies are section 02 of the spec:

| | ผู้อำนวยการ | ครู | ธุรการ |
|---|---|---|---|
| All classes and metrics | ✅ | own homeroom only | ✅ |
| Other teachers' observations | ✅ | ❌ | ❌ |
| Edit a teacher's marks | ❌ | own, within 7 days | ✅ any, with a reason |
| Assign tasks | ✅ | ❌ | ❌ |
| Close an action item | ✅ | ❌ | ❌ |
| Import master data | ❌ | ❌ | ✅ |

Two things that are easy to get wrong and are handled here:

- **Views carry `security_invoker = true`.** A Postgres view otherwise runs as
  its owner and quietly bypasses the RLS of every table underneath it, which
  would have served the whole school to anyone holding the anon key.
- **Correlated references in policies are table-qualified.** `task_id` exists on
  both `task_attachments` and `task_assignees`; an unqualified
  `ta.task_id = task_id` binds to the inner table and is true for every row.

`service_role` bypasses RLS, so seeding and scheduled jobs are unaffected.

**Until Supabase auth is wired up**, `teachers.auth_user_id` is null for
everyone and the policies correctly deny everything to `anon` and
`authenticated`. Connect the app with the service key server-side, or — for a
throwaway project with no real student data — run
`optional/demo_open_read.sql`, which opens read access to signed-in users and
carries its own undo block.

## Wiring the app to it (M7)

`app/src/data/mockData.js` is the only module that invents data. Replacing it
with queries that return the same shapes is the whole migration; `rules.js`,
the store and every screen stay as they are. The views are there if you would
rather let Postgres do the arithmetic — `v_class_metrics` returns exactly what
`classMetrics()` builds today.

Mapping worth noting: the app's ids (`cls-1`, `tch-003`) become deterministic
UUID v5 values in the database, and the original string is kept in
`external_ref`. The generator produces the same UUIDs on every run, so seeds are
stable across environments.
