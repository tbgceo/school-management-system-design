-- ============================================================================
-- TBG School OS — Module 01 schema
--
-- Derived from Spec v1 - Module 01 (screens S1–S6, rules R1–R9, assumptions
-- A1–A6) and from the record shapes the app already consumes in
-- app/src/data/schema.js.
--
-- Design decisions worth knowing before you read on:
--
--  * Nothing computed is stored. R1–R6 and R8 are views (0003_views.sql), so a
--    change to a target or a weight moves every screen at once, exactly as the
--    app's rules.js does today.
--  * Anything the school can retune is a row, not a constant: metric targets,
--    parent-channel weights, incident penalties, checkpoint dates. A1 and A5
--    both say these will move.
--  * Surrogate uuid keys everywhere, plus external_ref on the entities that
--    arrive from outside (S1 Excel today, SGS/DMC in Wave 2) so re-imports can
--    reconcile without guessing on names.
--  * Every fact row carries school_id and term_id. Q6 says one school today,
--    but the spec asks for the column now; term_id turns the semester filter
--    into a WHERE clause instead of a recompute.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enumerations that are structural (the app branches on them), as opposed to
-- the reference tables below, which the school is expected to edit.
-- ----------------------------------------------------------------------------
create type public.staff_role     as enum ('director', 'teacher', 'staff');
create type public.class_level    as enum ('primary', 'lower');
create type public.task_source    as enum ('manual', 'action_item');
create type public.action_trigger as enum ('class_at_risk', 'observation_low', 'behaviour_level3', 'submission_late');
create type public.severity       as enum ('danger', 'warning', 'info');
create type public.import_mode    as enum ('append', 'replace');
create type public.import_state   as enum ('pending', 'confirmed', 'rejected');
create type public.status_band    as enum ('ok', 'watch', 'risk');

-- ============================================================================
-- Organisation
-- ============================================================================

create table public.schools (
  id           uuid primary key default gen_random_uuid(),
  external_ref text unique,
  name_th      text not null,
  name_en      text not null,
  created_at   timestamptz not null default now()
);
comment on table public.schools is
  'Q6: one school in the MVP. The column exists on every fact table so a second one costs a filter, not a migration.';

create table public.terms (
  id         uuid primary key default gen_random_uuid(),
  school_id  uuid not null references public.schools(id) on delete cascade,
  code       text not null,
  year       smallint not null check (year between 2500 and 2700),
  term       smallint not null check (term in (1, 2)),
  label      text not null,
  starts_on  date not null,
  ends_on    date not null,
  term_weeks smallint not null default 18 check (term_weeks between 1 and 30),
  is_current boolean not null default false,
  created_at timestamptz not null default now(),
  constraint terms_code_unique   unique (school_id, code),
  constraint terms_number_unique unique (school_id, year, term),
  constraint terms_dates_ordered check (ends_on > starts_on)
);
comment on column public.terms.year is 'Buddhist era, as the school writes it (2569 = 2026 CE).';

-- Exactly one current term per school.
create unique index terms_single_current on public.terms (school_id) where is_current;

-- A2: four checkpoints a term, on weeks 4/8/12/16. Rows, not constants, because
-- the week numbers are an assumption the school still has to confirm.
create table public.checkpoints (
  id        uuid primary key default gen_random_uuid(),
  term_id   uuid not null references public.terms(id) on delete cascade,
  seq       smallint not null check (seq between 1 and 8),
  week_no   smallint not null check (week_no > 0),
  closes_on date not null,
  constraint checkpoints_seq_unique unique (term_id, seq)
);

-- ============================================================================
-- Reference data the school is expected to edit
-- ============================================================================

-- S4: the 8 learning areas of the Thai core curriculum.
create table public.subjects (
  id         text primary key,
  name_th    text not null,
  name_en    text not null,
  sort_order smallint not null
);

-- S5: behaviour incident categories.
create table public.incident_types (
  id         text primary key,
  name_th    text not null,
  name_en    text not null,
  sort_order smallint not null
);

-- R2: the penalty per level. Editable, because A3 flags the whole deduct-model
-- as something the school may replace with direct scoring.
create table public.incident_levels (
  level      smallint primary key check (level between 1 and 5),
  name_th    text not null,
  name_en    text not null,
  penalty    smallint not null check (penalty >= 0)
);

-- A4: five observation topics, scored 1–5.
create table public.observation_topics (
  id         text primary key,
  name_th    text not null,
  name_en    text not null,
  sort_order smallint not null
);

-- R4 / Q3: six parent channels and the agreed weights.
create table public.parent_channels (
  id         text primary key,
  name_th    text not null,
  name_en    text not null,
  weight     smallint not null check (weight between 0 and 100),
  sort_order smallint not null
);
comment on table public.parent_channels is
  'A5: weights are expected to change. Nothing else has to move when they do — R4 reads them from here.';

-- R1/R3/R4/R6 thresholds, per term so last term's numbers stay intact.
create table public.metric_targets (
  term_id uuid not null references public.terms(id) on delete cascade,
  metric  text not null check (metric in ('assessment', 'behaviour', 'observation', 'parent', 'passing_score', 'coaching')),
  target  numeric(6,2) not null,
  primary key (term_id, metric)
);
comment on table public.metric_targets is
  'A1: if the school''s pass mark is not 70, this is the one row to change.';

-- R2 constants, per term.
create table public.behaviour_settings (
  term_id                 uuid primary key references public.terms(id) on delete cascade,
  start_index             smallint not null default 100 check (start_index between 0 and 100),
  recovery_per_quiet_week smallint not null default 1 check (recovery_per_quiet_week >= 0)
);

-- R7/R9 windows, per term.
create table public.policy_settings (
  term_id               uuid primary key references public.terms(id) on delete cascade,
  edit_window_days      smallint not null default 7 check (edit_window_days >= 0),
  submission_grace_days smallint not null default 7 check (submission_grace_days >= 0)
);

-- ============================================================================
-- People
-- ============================================================================

-- Holds everyone with a login, not only classroom teachers: the director and
-- office staff are rows here too, separated by `role`. Named `teachers` to match
-- what the app calls this collection.
create table public.teachers (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid not null references public.schools(id) on delete cascade,
  auth_user_id       uuid unique references auth.users(id) on delete set null,
  external_ref       text,
  name_th            text not null,
  name_en            text not null,
  email              text not null,
  role               public.staff_role not null default 'teacher',
  subject_id         text references public.subjects(id) on delete set null,
  is_department_head boolean not null default false,
  is_active          boolean not null default true,
  created_at         timestamptz not null default now(),
  constraint teachers_email_unique unique (school_id, email),
  constraint teachers_ref_unique   unique (school_id, external_ref)
);
comment on column public.teachers.auth_user_id is
  'Links a row to a Supabase auth user. RLS in 0004 reads this; until sign-in is wired it stays null.';
comment on column public.teachers.is_department_head is
  'A4: department heads are the ones who run observation rounds.';

create index teachers_role_idx on public.teachers (school_id, role) where is_active;

create table public.classrooms (
  id                  uuid primary key default gen_random_uuid(),
  school_id           uuid not null references public.schools(id) on delete cascade,
  term_id             uuid not null references public.terms(id) on delete cascade,
  external_ref        text,
  name                text not null,
  level               public.class_level not null,
  grade               smallint not null check (grade between 1 and 12),
  homeroom_teacher_id uuid not null references public.teachers(id) on delete restrict,
  created_at          timestamptz not null default now(),
  constraint classrooms_name_unique unique (term_id, name),
  constraint classrooms_ref_unique  unique (term_id, external_ref)
);

create index classrooms_homeroom_idx on public.classrooms (homeroom_teacher_id);

create table public.students (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  term_id      uuid not null references public.terms(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  external_ref text,
  code         text not null,
  name_th      text not null,
  created_at   timestamptz not null default now(),
  constraint students_code_unique unique (term_id, code),
  constraint students_ref_unique  unique (term_id, external_ref)
);
comment on column public.students.code is
  'S5 searches on this as well as the name, so it is indexed and unique within a term.';

create index students_classroom_idx on public.students (classroom_id);

create table public.guardians (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  name_th      text not null,
  phone        text,
  line_user_id text,
  created_at   timestamptz not null default now(),
  constraint guardians_one_per_student unique (student_id)
);
comment on constraint guardians_one_per_student on public.guardians is
  'MVP models one guardian per student, which is what R4 counts. Drop this to allow several.';

-- ============================================================================
-- Facts — the rows every metric is computed from
-- ============================================================================

-- S4: one row per student, per subject, per checkpoint.
create table public.assessments (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  term_id      uuid not null references public.terms(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  student_id   uuid not null references public.students(id) on delete cascade,
  subject_id   text not null references public.subjects(id) on delete restrict,
  checkpoint   smallint not null,
  score        smallint not null check (score between 0 and 100),
  note         text check (char_length(note) <= 280),
  teacher_id   uuid not null references public.teachers(id) on delete restrict,
  recorded_by  uuid not null references public.teachers(id) on delete restrict,
  on_behalf    boolean generated always as (recorded_by is distinct from teacher_id) stored,
  recorded_at  timestamptz not null default now(),
  constraint assessments_one_per_cell unique (student_id, subject_id, checkpoint),
  constraint assessments_checkpoint_fk foreign key (term_id, checkpoint)
    references public.checkpoints (term_id, seq) on delete cascade
);
comment on column public.assessments.teacher_id is
  'Whose submission this is. recorded_by is who typed it — Q2''s "office staff fills in for a teacher".';
comment on column public.assessments.on_behalf is
  'Generated, so proxy entry can never drift out of sync with the two ids.';

create index assessments_class_cp_idx on public.assessments (classroom_id, checkpoint);
create index assessments_term_cp_idx  on public.assessments (term_id, checkpoint);
create index assessments_student_idx  on public.assessments (student_id);

-- S5: behaviour incidents.
create table public.behaviour_incidents (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references public.schools(id) on delete cascade,
  term_id          uuid not null references public.terms(id) on delete cascade,
  classroom_id     uuid not null references public.classrooms(id) on delete cascade,
  student_id       uuid not null references public.students(id) on delete cascade,
  incident_type_id text not null references public.incident_types(id) on delete restrict,
  level            smallint not null references public.incident_levels(level) on delete restrict,
  occurred_at      timestamptz not null,
  note             text check (char_length(note) <= 280),
  recorded_by      uuid not null references public.teachers(id) on delete restrict,
  recorded_at      timestamptz not null default now()
);

create index behaviour_class_idx    on public.behaviour_incidents (classroom_id, occurred_at desc);
create index behaviour_level3_idx   on public.behaviour_incidents (term_id, occurred_at desc) where level = 3;

-- S5: one observation round for one teacher; the five topic scores hang off it.
create table public.observations (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  term_id     uuid not null references public.terms(id) on delete cascade,
  teacher_id  uuid not null references public.teachers(id) on delete cascade,
  observer_id uuid not null references public.teachers(id) on delete restrict,
  round       smallint not null check (round between 1 and 2),
  note        text check (char_length(note) <= 280),
  recorded_at timestamptz not null default now(),
  constraint observations_one_per_round unique (term_id, teacher_id, round),
  constraint observations_not_self check (observer_id <> teacher_id)
);

create table public.observation_scores (
  observation_id uuid not null references public.observations(id) on delete cascade,
  topic_id       text not null references public.observation_topics(id) on delete restrict,
  score          smallint not null check (score between 1 and 5),
  primary key (observation_id, topic_id)
);
comment on table public.observation_scores is
  'Normalised rather than a jsonb blob so R3 is a plain average and a sixth topic is a row, not a migration.';

-- S5: one guardian, one channel, one term.
create table public.parent_engagement (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  term_id      uuid not null references public.terms(id) on delete cascade,
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  guardian_id  uuid not null references public.guardians(id) on delete cascade,
  channel_id   text not null references public.parent_channels(id) on delete restrict,
  done         boolean not null default false,
  recorded_at  timestamptz not null default now(),
  recorded_by  uuid not null references public.teachers(id) on delete restrict,
  constraint parent_engagement_one_per_channel unique (term_id, guardian_id, channel_id)
);

create index parent_engagement_class_idx on public.parent_engagement (classroom_id, channel_id);

-- ============================================================================
-- Action items (R7) and tasks (S6)
-- ============================================================================

-- R7: raised by the system, never created by hand, closed by the director only.
create table public.action_items (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references public.schools(id) on delete cascade,
  term_id      uuid not null references public.terms(id) on delete cascade,
  trigger_type public.action_trigger not null,
  classroom_id uuid references public.classrooms(id) on delete cascade,
  teacher_id   uuid references public.teachers(id) on delete cascade,
  ref          text not null default '',
  title        text not null,
  title_th     text not null,
  detail       text not null,
  owner_name   text,
  action_label text,
  tone         public.severity not null default 'info',
  raised_at    timestamptz not null default now(),
  closed_at    timestamptz,
  closed_by    uuid references public.teachers(id) on delete set null,
  constraint action_items_closed_together check ((closed_at is null) = (closed_by is null))
);
comment on column public.action_items.ref is
  'Discriminator for triggers that can fire more than once for the same class — e.g. "cp4:math" for a late submission.';

-- Re-running the generator upserts instead of duplicating.
create unique index action_items_identity
  on public.action_items (term_id, trigger_type, classroom_id, teacher_id, ref)
  nulls not distinct;

create index action_items_open_idx on public.action_items (term_id, tone) where closed_at is null;

-- S6: Module 02 in its MVP form.
create table public.tasks (
  id                    uuid primary key default gen_random_uuid(),
  school_id             uuid not null references public.schools(id) on delete cascade,
  term_id               uuid not null references public.terms(id) on delete cascade,
  title                 text not null check (char_length(title) between 1 and 120),
  classroom_id          uuid references public.classrooms(id) on delete set null,
  due_date              date not null,
  source                public.task_source not null default 'manual',
  source_action_item_id uuid references public.action_items(id) on delete set null,
  completed_at          timestamptz,
  completed_by          uuid references public.teachers(id) on delete set null,
  created_by            uuid not null references public.teachers(id) on delete restrict,
  created_at            timestamptz not null default now(),
  constraint tasks_completed_together check ((completed_at is null) = (completed_by is null))
);
comment on table public.tasks is
  'R8 status (pending / done / overdue) is derived in v_tasks, never stored — it changes with the date, not with a write.';

create index tasks_due_idx on public.tasks (term_id, due_date) where completed_at is null;

create table public.task_assignees (
  task_id    uuid not null references public.tasks(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  primary key (task_id, teacher_id)
);

create index task_assignees_teacher_idx on public.task_assignees (teacher_id);

create table public.task_attachments (
  id           uuid primary key default gen_random_uuid(),
  task_id      uuid not null references public.tasks(id) on delete cascade,
  file_name    text not null,
  kind         text not null check (kind in ('image', 'pdf')),
  storage_path text,
  uploaded_by  uuid references public.teachers(id) on delete set null,
  uploaded_at  timestamptz not null default now()
);

-- S6 caps attachments at five per task.
create or replace function public.enforce_attachment_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.task_attachments where task_id = new.task_id) >= 5 then
    raise exception 'A task may carry at most 5 attachments (S6)';
  end if;
  return new;
end;
$$;

create trigger task_attachments_limit
  before insert on public.task_attachments
  for each row execute function public.enforce_attachment_limit();

-- ============================================================================
-- Audit (R9) and imports (S1)
-- ============================================================================

create table public.edit_log (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  record_type text not null,
  record_id   uuid not null,
  field       text not null,
  old_value   text,
  new_value   text,
  edited_by   uuid references public.teachers(id) on delete set null,
  edited_at   timestamptz not null default now(),
  reason      text
);
comment on table public.edit_log is
  'R9: every correction keeps the previous value. Beyond the edit window the reason is required — enforced where the edit is made, since the trigger cannot know who asked.';

create index edit_log_record_idx on public.edit_log (record_type, record_id, edited_at desc);

-- Keep the history automatically for the two tables teachers correct most.
create or replace function public.log_assessment_edit()
returns trigger
language plpgsql
as $$
begin
  if new.score is distinct from old.score then
    insert into public.edit_log (school_id, record_type, record_id, field, old_value, new_value, edited_by)
    values (old.school_id, 'assessments', old.id, 'score', old.score::text, new.score::text, new.recorded_by);
  end if;
  return new;
end;
$$;

create trigger assessments_edit_log
  after update on public.assessments
  for each row execute function public.log_assessment_edit();

create or replace function public.log_behaviour_edit()
returns trigger
language plpgsql
as $$
begin
  if new.level is distinct from old.level then
    insert into public.edit_log (school_id, record_type, record_id, field, old_value, new_value, edited_by)
    values (old.school_id, 'behaviour_incidents', old.id, 'level', old.level::text, new.level::text, new.recorded_by);
  end if;
  return new;
end;
$$;

create trigger behaviour_edit_log
  after update on public.behaviour_incidents
  for each row execute function public.log_behaviour_edit();

-- S1: one Excel upload attempt, with its rejected rows.
create table public.import_batches (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid not null references public.schools(id) on delete cascade,
  term_id     uuid not null references public.terms(id) on delete cascade,
  file_name   text not null,
  mode        public.import_mode not null,
  rows_ok     integer not null default 0 check (rows_ok >= 0),
  rows_failed integer not null default 0 check (rows_failed >= 0),
  state       public.import_state not null default 'pending',
  uploaded_by uuid not null references public.teachers(id) on delete restrict,
  uploaded_at timestamptz not null default now()
);

create table public.import_errors (
  id       uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.import_batches(id) on delete cascade,
  sheet    text not null,
  row_no   integer not null check (row_no > 0),
  reason   text not null
);

create index import_errors_batch_idx on public.import_errors (batch_id);
