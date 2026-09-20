/**
 * Static consistency check on the generated seed.
 *
 * It cannot replace running the SQL, but it does catch the failures that would
 * otherwise only surface as a foreign key violation halfway through a 4 MB
 * import: a subject id that is not in the reference table, a guardian pointing
 * at a student that was never emitted, a task marked complete with nobody to
 * attribute it to.
 *
 *   node supabase/scripts/check-seed.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { db } from '../../app/src/data/mockData.js';
import {
  SUBJECTS, INCIDENT_TYPES, INCIDENT_LEVELS, OBSERVATION_TOPICS, PARENT_CHANNELS, CHECKPOINTS,
} from '../../app/src/data/constants.js';

const here = dirname(fileURLToPath(import.meta.url));
const refSql = readFileSync(resolve(here, '../migrations/0002_reference_data.sql'), 'utf8');

const problems = [];
const checks = [];

function check(label, ok, detail = '') {
  checks.push({ label, ok });
  if (!ok) problems.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

/** Ids actually present in the reference migration, parsed from its INSERT lists. */
function refIds(table) {
  const block = refSql.split(`insert into public.${table}`)[1];
  if (!block) return new Set();
  const values = block.split(/on conflict/i)[0];
  return new Set([...values.matchAll(/^\s*\('([^']+)'/gm)].map((m) => m[1]));
}

const set = (rows, key = 'id') => new Set(rows.map((r) => r[key]));

/* ---------------------------------------------------------------- *
 * Reference tables match the app's constants
 * ---------------------------------------------------------------- */
const sqlSubjects = refIds('subjects');
const sqlIncident = refIds('incident_types');
const sqlTopics   = refIds('observation_topics');
const sqlChannels = refIds('parent_channels');

check('subjects: migration matches constants',
  SUBJECTS.every((s) => sqlSubjects.has(s.id)) && sqlSubjects.size === SUBJECTS.length,
  `sql=${sqlSubjects.size} app=${SUBJECTS.length}`);

check('incident_types: migration matches constants',
  INCIDENT_TYPES.every((t) => sqlIncident.has(t.id)) && sqlIncident.size === INCIDENT_TYPES.length,
  `sql=${sqlIncident.size} app=${INCIDENT_TYPES.length}`);

check('observation_topics: migration matches constants',
  OBSERVATION_TOPICS.every((t) => sqlTopics.has(t.id)) && sqlTopics.size === OBSERVATION_TOPICS.length,
  `sql=${sqlTopics.size} app=${OBSERVATION_TOPICS.length}`);

check('parent_channels: migration matches constants',
  PARENT_CHANNELS.every((c) => sqlChannels.has(c.id)) && sqlChannels.size === PARENT_CHANNELS.length,
  `sql=${sqlChannels.size} app=${PARENT_CHANNELS.length}`);

check('parent_channels weights total 100',
  PARENT_CHANNELS.reduce((a, c) => a + c.weight, 0) === 100,
  String(PARENT_CHANNELS.reduce((a, c) => a + c.weight, 0)));

/* ---------------------------------------------------------------- *
 * Referential integrity across the fixture
 * ---------------------------------------------------------------- */
const teachers   = set(db.teachers);
const classrooms = set(db.classrooms);
const students   = set(db.students);
const guardians  = set(db.guardians);
const levels     = new Set(INCIDENT_LEVELS.map((l) => l.level));
const checkpoints = new Set(CHECKPOINTS);

const missing = (rows, fn) => rows.filter((r) => !fn(r)).length;

check('classrooms.homeroom_teacher_id resolves',
  missing(db.classrooms, (c) => teachers.has(c.homeroomTeacherId)) === 0);

check('students.classroom_id resolves',
  missing(db.students, (s) => classrooms.has(s.classroomId)) === 0);

check('guardians.student_id resolves',
  missing(db.guardians, (g) => students.has(g.studentId)) === 0);

check('every student has exactly one guardian',
  db.guardians.length === db.students.length
  && new Set(db.guardians.map((g) => g.studentId)).size === db.students.length);

check('assessments.subject_id in reference table',
  missing(db.assessments, (a) => sqlSubjects.has(a.subjectId)) === 0);

check('assessments.checkpoint in 1..4',
  missing(db.assessments, (a) => checkpoints.has(a.checkpoint)) === 0);

check('assessments.score in 0..100',
  missing(db.assessments, (a) => a.score >= 0 && a.score <= 100) === 0);

check('assessments teacher_id / recorded_by resolve',
  missing(db.assessments, (a) => teachers.has(a.teacherId) && teachers.has(a.recordedBy)) === 0);

check('assessments unique on (student, subject, checkpoint)',
  new Set(db.assessments.map((a) => `${a.studentId}|${a.subjectId}|${a.checkpoint}`)).size === db.assessments.length,
  `${db.assessments.length} rows`);

check('behaviour.incident_type in reference table',
  missing(db.behaviour, (b) => sqlIncident.has(b.typeId)) === 0);

check('behaviour.level in reference table',
  missing(db.behaviour, (b) => levels.has(b.level)) === 0);

check('behaviour student/classroom resolve',
  missing(db.behaviour, (b) => students.has(b.studentId) && classrooms.has(b.classroomId)) === 0);

check('observations teacher/observer resolve',
  missing(db.observations, (o) => teachers.has(o.teacherId) && teachers.has(o.observerId)) === 0);

check('observations: observer is never the teacher',
  missing(db.observations, (o) => o.observerId !== o.teacherId) === 0);

check('observations unique on (teacher, round)',
  new Set(db.observations.map((o) => `${o.teacherId}|${o.round}`)).size === db.observations.length);

check('observation scores: 5 topics each, all 1..5',
  db.observations.every((o) => {
    const keys = Object.keys(o.scores);
    return keys.length === OBSERVATION_TOPICS.length
      && keys.every((k) => sqlTopics.has(k))
      && Object.values(o.scores).every((v) => v >= 1 && v <= 5);
  }));

check('parent_engagement channel in reference table',
  missing(db.parentEngagement, (p) => sqlChannels.has(p.channelId)) === 0);

check('parent_engagement guardian/classroom resolve',
  missing(db.parentEngagement, (p) => guardians.has(p.guardianId) && classrooms.has(p.classroomId)) === 0);

check('parent_engagement unique on (guardian, channel)',
  new Set(db.parentEngagement.map((p) => `${p.guardianId}|${p.channelId}`)).size === db.parentEngagement.length);

check('tasks.assignee ids resolve',
  missing(db.tasks, (t) => t.assigneeIds.every((a) => teachers.has(a))) === 0);

check('tasks.classroom_id resolves when set',
  missing(db.tasks, (t) => !t.classroomId || classrooms.has(t.classroomId)) === 0);

// The schema keeps completed_at and completed_by together; the generator fills
// completed_by from the first assignee, so a completed task must have one.
check('completed tasks have at least one assignee',
  missing(db.tasks.filter((t) => t.completedAt), (t) => t.assigneeIds.length > 0) === 0);

check('tasks.title within 120 chars',
  missing(db.tasks, (t) => t.title.length <= 120) === 0);

check('import batches uploaded_by resolves',
  missing(db.importBatches, (b) => teachers.has(b.uploadedBy)) === 0);

/* ---------------------------------------------------------------- *
 * Report
 * ---------------------------------------------------------------- */
checks.forEach((c) => process.stdout.write(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.label}\n`));
process.stdout.write(`\n${checks.filter((c) => c.ok).length}/${checks.length} passed\n`);

if (problems.length) {
  process.stdout.write(`\n${problems.length} problem(s):\n`);
  problems.forEach((p) => process.stdout.write(`  - ${p}\n`));
  process.exit(1);
}
