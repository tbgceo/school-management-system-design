/**
 * Emit supabase/seed.sql from the app's own fixture module.
 *
 * The seed is generated rather than hand-written so the database and the running
 * app cannot drift: both read app/src/data/mockData.js, so every figure the
 * dashboard shows is reproducible with a SQL query against these rows.
 *
 *   node supabase/scripts/generate-seed.mjs
 *
 * App ids ("cls-1", "tch-003") become deterministic UUID v5 values, so re-running
 * produces byte-identical SQL and the same keys every time. The original id is
 * kept in external_ref for traceability back to the fixture — and, later, for
 * reconciling an SGS/DMC import.
 */

import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { db, CHECKPOINT_DATES } from '../../app/src/data/mockData.js';
import {
  TERM_START, TERM_WEEKS, TARGETS, CHECKPOINT_WEEKS, SEMESTERS, CURRENT_SEMESTER,
  BEHAVIOUR_START, BEHAVIOUR_RECOVERY_PER_WEEK, EDIT_WINDOW_DAYS, SUBMISSION_GRACE_DAYS,
} from '../../app/src/data/constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, '../seed.sql');

/* ------------------------------------------------------------------ *
 * Deterministic UUIDs
 * ------------------------------------------------------------------ */
const NAMESPACE = '6f9b1d20-1c4e-5a7f-9b3d-2e8a4c6f10ab';

function uuidv5(name) {
  const ns = Buffer.from(NAMESPACE.replace(/-/g, ''), 'hex');
  const hash = createHash('sha1').update(Buffer.concat([ns, Buffer.from(name, 'utf8')])).digest();
  const b = Buffer.from(hash.subarray(0, 16));
  b[6] = (b[6] & 0x0f) | 0x50;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = b.toString('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

const ID = new Map();
const id = (appId) => {
  if (!ID.has(appId)) ID.set(appId, uuidv5(appId));
  return ID.get(appId);
};

/* ------------------------------------------------------------------ *
 * SQL literals
 * ------------------------------------------------------------------ */
const q = (v) => (v === null || v === undefined ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const n = (v) => (v === null || v === undefined ? 'null' : String(v));
const bool = (v) => (v ? 'true' : 'false');
const ts = (v) => (v ? `'${new Date(v).toISOString()}'::timestamptz` : 'null');
const day = (v) => (v ? `'${new Date(v).toISOString().slice(0, 10)}'::date` : 'null');

/** Chunked multi-row INSERT — one statement per 500 rows keeps the file parseable. */
function insert(table, columns, rows, chunkSize = 500) {
  if (!rows.length) return `-- ${table}: no rows\n`;
  const out = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const slice = rows.slice(i, i + chunkSize);
    out.push(
      `insert into public.${table} (${columns.join(', ')}) values\n`
      + slice.map((r) => `  (${r.join(', ')})`).join(',\n')
      + ';\n',
    );
  }
  return out.join('\n');
}

/* ------------------------------------------------------------------ *
 * Fixed rows
 * ------------------------------------------------------------------ */
const school = db.schools[0];
const schoolId = id(school.id);

const semester = SEMESTERS.find((s) => s.id === CURRENT_SEMESTER);
const termId = id(`term-${CURRENT_SEMESTER}`);
const termEnds = new Date(TERM_START.getTime() + (TERM_WEEKS * 7 - 1) * 86400000);

const sections = [];
const say = (title) => sections.push(`\n-- ${'-'.repeat(74)}\n-- ${title}\n-- ${'-'.repeat(74)}\n`);

sections.push(`-- ============================================================================
-- TBG School OS — seed data
--
-- GENERATED FILE. Do not edit by hand; run:
--     node supabase/scripts/generate-seed.mjs
--
-- Source of truth: app/src/data/mockData.js — the same fixture the running app
-- uses, so a query against these rows reproduces the dashboard exactly:
-- nine classes, 314 students, 42 teaching staff, four checkpoints.
--
-- Re-runnable: it clears the tables it owns, leaves reference data from
-- 0002_reference_data.sql alone, and is wrapped in a single transaction.
-- ============================================================================

begin;

-- Clear in dependency order. Reference tables are untouched.
truncate table
  public.import_errors, public.import_batches, public.edit_log,
  public.task_attachments, public.task_assignees, public.tasks, public.action_items,
  public.parent_engagement, public.observation_scores, public.observations,
  public.behaviour_incidents, public.assessments,
  public.guardians, public.students, public.classrooms, public.teachers,
  public.policy_settings, public.behaviour_settings, public.metric_targets,
  public.checkpoints, public.terms, public.schools
restart identity cascade;
`);

/* ------------------------------------------------------------------ *
 * School, term, checkpoints, settings
 * ------------------------------------------------------------------ */
say('School and term');

sections.push(insert('schools', ['id', 'external_ref', 'name_th', 'name_en'], [
  [q(schoolId), q(school.id), q(school.nameTh), q(school.nameEn)],
]));

sections.push(insert('terms',
  ['id', 'school_id', 'code', 'year', 'term', 'label', 'starts_on', 'ends_on', 'term_weeks', 'is_current'], [
    [q(termId), q(schoolId), q(semester.id), n(semester.year), n(semester.term),
      q(semester.label), day(TERM_START), day(termEnds), n(TERM_WEEKS), bool(true)],
  ]));

sections.push(insert('checkpoints', ['id', 'term_id', 'seq', 'week_no', 'closes_on'],
  CHECKPOINT_DATES.map((d, i) => [
    q(id(`cp-${CURRENT_SEMESTER}-${i + 1}`)), q(termId), n(i + 1), n(CHECKPOINT_WEEKS[i]), day(d),
  ])));

sections.push(insert('metric_targets', ['term_id', 'metric', 'target'], [
  [q(termId), q('assessment'), n(TARGETS.assessment)],
  [q(termId), q('behaviour'), n(TARGETS.behaviour)],
  [q(termId), q('observation'), n(TARGETS.observation)],
  [q(termId), q('parent'), n(TARGETS.parent)],
  [q(termId), q('passing_score'), n(TARGETS.passingScore)],
  [q(termId), q('coaching'), n(TARGETS.coaching)],
]));

sections.push(insert('behaviour_settings', ['term_id', 'start_index', 'recovery_per_quiet_week'], [
  [q(termId), n(BEHAVIOUR_START), n(BEHAVIOUR_RECOVERY_PER_WEEK)],
]));

sections.push(insert('policy_settings', ['term_id', 'edit_window_days', 'submission_grace_days'], [
  [q(termId), n(EDIT_WINDOW_DAYS), n(SUBMISSION_GRACE_DAYS)],
]));

/* ------------------------------------------------------------------ *
 * People
 * ------------------------------------------------------------------ */
say('Staff — 1 director, 1 office, 42 teaching');

sections.push(insert('teachers',
  ['id', 'school_id', 'external_ref', 'name_th', 'name_en', 'email', 'role', 'subject_id', 'is_department_head'],
  db.teachers.map((t) => [
    q(id(t.id)), q(schoolId), q(t.id), q(t.nameTh), q(t.nameEn), q(t.email),
    `'${t.role}'::public.staff_role`, q(t.subjectGroupId), bool(t.isDepartmentHead),
  ])));

say('Classrooms, students, guardians');

sections.push(insert('classrooms',
  ['id', 'school_id', 'term_id', 'external_ref', 'name', 'level', 'grade', 'homeroom_teacher_id'],
  db.classrooms.map((c) => [
    q(id(c.id)), q(schoolId), q(termId), q(c.id), q(c.name),
    `'${c.level}'::public.class_level`, n(c.grade), q(id(c.homeroomTeacherId)),
  ])));

sections.push(insert('students',
  ['id', 'school_id', 'term_id', 'classroom_id', 'external_ref', 'code', 'name_th'],
  db.students.map((s) => [
    q(id(s.id)), q(schoolId), q(termId), q(id(s.classroomId)), q(s.id), q(s.code), q(s.nameTh),
  ])));

sections.push(insert('guardians', ['id', 'school_id', 'student_id', 'name_th'],
  db.guardians.map((g) => [
    q(id(g.id)), q(schoolId), q(id(g.studentId)), q(g.nameTh),
  ])));

/* ------------------------------------------------------------------ *
 * Facts
 * ------------------------------------------------------------------ */
say(`Assessments — ${db.assessments.length} marks (student x subject x checkpoint)`);

sections.push(insert('assessments',
  ['id', 'school_id', 'term_id', 'classroom_id', 'student_id', 'subject_id', 'checkpoint',
    'score', 'note', 'teacher_id', 'recorded_by', 'recorded_at'],
  db.assessments.map((a) => [
    q(id(a.id)), q(schoolId), q(termId), q(id(a.classroomId)), q(id(a.studentId)),
    q(a.subjectId), n(a.checkpoint), n(a.score), q(a.note),
    q(id(a.teacherId)), q(id(a.recordedBy)), ts(a.recordedAt),
  ]), 1000));

say(`Behaviour incidents — ${db.behaviour.length}`);

sections.push(insert('behaviour_incidents',
  ['id', 'school_id', 'term_id', 'classroom_id', 'student_id', 'incident_type_id',
    'level', 'occurred_at', 'note', 'recorded_by'],
  db.behaviour.map((b) => [
    q(id(b.id)), q(schoolId), q(termId), q(id(b.classroomId)), q(id(b.studentId)),
    q(b.typeId), n(b.level), ts(b.occurredAt), q(b.note), q(id(b.recordedBy)),
  ])));

say(`Observations — ${db.observations.length} rounds, ${db.observations.length * 5} topic scores`);

sections.push(insert('observations',
  ['id', 'school_id', 'term_id', 'teacher_id', 'observer_id', 'round', 'note', 'recorded_at'],
  db.observations.map((o) => [
    q(id(o.id)), q(schoolId), q(termId), q(id(o.teacherId)), q(id(o.observerId)),
    n(o.round), q(o.note), ts(o.recordedAt),
  ])));

const topicRows = [];
db.observations.forEach((o) => {
  Object.entries(o.scores).forEach(([topicId, score]) => {
    topicRows.push([q(id(o.id)), q(topicId), n(score)]);
  });
});
sections.push(insert('observation_scores', ['observation_id', 'topic_id', 'score'], topicRows, 1000));

say(`Parent engagement — ${db.parentEngagement.length} guardian x channel rows`);

sections.push(insert('parent_engagement',
  ['id', 'school_id', 'term_id', 'classroom_id', 'guardian_id', 'channel_id', 'done', 'recorded_at', 'recorded_by'],
  db.parentEngagement.map((p) => [
    q(id(p.id)), q(schoolId), q(termId), q(id(p.classroomId)), q(id(p.guardianId)),
    q(p.channelId), bool(p.done), ts(p.recordedAt), q(id(p.recordedBy)),
  ]), 1000));

/* ------------------------------------------------------------------ *
 * Tasks
 * ------------------------------------------------------------------ */
say(`Tasks — ${db.tasks.length}`);

sections.push(insert('tasks',
  ['id', 'school_id', 'term_id', 'title', 'classroom_id', 'due_date', 'source',
    'completed_at', 'completed_by', 'created_by', 'created_at'],
  db.tasks.map((t) => [
    q(id(t.id)), q(schoolId), q(termId), q(t.title),
    t.classroomId ? q(id(t.classroomId)) : 'null', day(t.dueDate),
    `'${t.source}'::public.task_source`,
    ts(t.completedAt),
    // The schema keeps completed_at and completed_by together; the fixture only
    // records the timestamp, so the first assignee stands as who ticked it off.
    t.completedAt ? q(id(t.assigneeIds[0])) : 'null',
    q(id(t.createdBy)), ts(t.createdAt),
  ])));

const assigneeRows = [];
db.tasks.forEach((t) => t.assigneeIds.forEach((a) => assigneeRows.push([q(id(t.id)), q(id(a))])));
sections.push(insert('task_assignees', ['task_id', 'teacher_id'], assigneeRows));

const attachmentRows = [];
db.tasks.forEach((t) => (t.attachments || []).forEach((f, i) => {
  attachmentRows.push([q(id(`att-${t.id}-${i}`)), q(id(t.id)), q(f.name), q(f.kind)]);
}));
sections.push(insert('task_attachments', ['id', 'task_id', 'file_name', 'kind'], attachmentRows));

/* ------------------------------------------------------------------ *
 * Imports
 * ------------------------------------------------------------------ */
say('Import history (S1)');

sections.push(insert('import_batches',
  ['id', 'school_id', 'term_id', 'file_name', 'mode', 'rows_ok', 'rows_failed', 'state', 'uploaded_by', 'uploaded_at'],
  db.importBatches.map((b) => [
    q(id(b.id)), q(schoolId), q(termId), q(b.fileName),
    `'${b.mode}'::public.import_mode`, n(b.rowsOk), n(b.rowsFailed),
    `'${b.state}'::public.import_state`, q(id(b.uploadedBy)), ts(b.uploadedAt),
  ])));

const errorRows = [];
db.importBatches.forEach((b) => (b.errors || []).forEach((e, i) => {
  errorRows.push([q(id(`imperr-${b.id}-${i}`)), q(id(b.id)), q(e.sheet), n(e.row), q(e.reason)]);
}));
sections.push(insert('import_errors', ['id', 'batch_id', 'sheet', 'row_no', 'reason'], errorRows));

/* ------------------------------------------------------------------ *
 * R7 and close
 * ------------------------------------------------------------------ */
say('R7 — let the rules raise the action items');

sections.push(`select public.refresh_action_items('${termId}'::uuid) as open_action_items;\n`);

sections.push(`
commit;

-- Sanity check after loading — these should match the dashboard.
--   select * from public.v_school_metrics;
--   select classroom_name, assessment_pct, behaviour_index, observation_score,
--          parent_index, class_index, class_status
--     from public.v_class_metrics order by classroom_name;
--   select * from public.v_observation_bands;
`);

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, sections.join('\n'), 'utf8');

const counts = {
  teachers: db.teachers.length,
  classrooms: db.classrooms.length,
  students: db.students.length,
  guardians: db.guardians.length,
  assessments: db.assessments.length,
  behaviour: db.behaviour.length,
  observations: db.observations.length,
  observation_scores: topicRows.length,
  parent_engagement: db.parentEngagement.length,
  tasks: db.tasks.length,
};

process.stdout.write(`wrote ${OUT}\n`);
Object.entries(counts).forEach(([k, v]) => process.stdout.write(`  ${k.padEnd(20)} ${v}\n`));
