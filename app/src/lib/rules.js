/**
 * Calculation rules R1-R9 from Spec v1 - Module 01.
 *
 * The database now owns these. R1-R6 and R8 are views and functions in
 * supabase/migrations/0003_views.sql, and the app reads the answers rather than
 * recomputing them: `v_class_metrics` is nine rows instead of the ~10,000 marks
 * behind it, and a rule has one definition instead of two that can drift.
 *
 * What is left here is what the browser still genuinely needs:
 *
 *   METRICS      the labels, units and scales the cards and tables render with
 *   statusFor    R6, applied to the school-wide means, which the database does
 *                not compute because they depend on the level filter
 *
 * The remaining functions are the reference implementations of R1-R5, R8 and R9.
 * Nothing in the running app calls them; they are kept beside the SQL so the two
 * can be read against each other, and so a future test can assert they agree.
 */

import { TARGETS, STATUS, PARENT_CHANNELS, OBSERVATION_TOPICS, INCIDENT_LEVELS, TASK_STATUS } from '../data/constants.js';

const penaltyFor = (level) => (INCIDENT_LEVELS.find((l) => l.level === level) || { penalty: 0 }).penalty;

/**
 * Metric definitions. `scale` lifts a metric onto the shared 0-100 axis so R5
 * and R6 can use one band width across metrics that are not natively
 * percentages (observation is 1-5). Targets here are defaults; the live values
 * come from metric_targets and the screens override these with them.
 */
export const METRICS = {
  assessment:  { key: 'assessment',  scale: 1,  target: TARGETS.assessment,  label: 'Assessment vs target', th: 'ผลประเมินเทียบเป้าหมาย', unit: '%' },
  behaviour:   { key: 'behaviour',   scale: 1,  target: TARGETS.behaviour,   label: 'Behaviour index',      th: 'คะแนนพฤติกรรมนักเรียน',  unit: '' },
  observation: { key: 'observation', scale: 20, target: TARGETS.observation, label: 'Teacher observation',  th: 'คะแนนนิเทศการสอน',       unit: '' },
  parent:      { key: 'parent',      scale: 1,  target: TARGETS.parent,      label: 'Parent engagement',    th: 'การมีส่วนร่วมผู้ปกครอง',  unit: '%' },
};

/* ================================================================== *
 * R6 - status bands. Mirrors public.status_band().
 * ================================================================== */
export function statusFor(value, metric, series = []) {
  if (value == null) return STATUS.watch;
  const { target, scale } = metric;

  // Compare the value the screen actually shows, not the raw float, so a class
  // sitting on the edge of a band is never coloured against its own number.
  const displayed = metric.key === 'observation' ? Math.round(value * 10) / 10 : Math.round(value);
  const v = displayed * scale;
  const t = target * scale;

  const points = series.filter((p) => p != null);
  const declinedTwice = points.length >= 3
    && points[points.length - 1] < points[points.length - 2]
    && points[points.length - 2] < points[points.length - 3];

  if (v < t - 5 || declinedTwice) return STATUS.risk;
  if (v < t) return STATUS.watch;
  return STATUS.ok;
}

/* ================================================================== *
 * Reference implementations — mirrored by the SQL, not called by the UI
 * ================================================================== */

/** R1 - share of marks at or above the pass score, never the mean. */
export function assessmentPct(rows, passMark = TARGETS.passingScore) {
  if (!rows.length) return null;
  return (rows.filter((r) => r.score >= passMark).length / rows.length) * 100;
}

/** R2 - opens at 100, loses the level penalty, recovers on incident-free weeks. */
export function behaviourIndex(incidents, weeksElapsed, startIndex = 100, recovery = 1) {
  const penalty = incidents.reduce((sum, i) => sum + penaltyFor(i.level), 0);
  const weeksWithIncident = new Set(incidents.map((i) => i.week)).size;
  const quiet = Math.max(0, weeksElapsed - weeksWithIncident);
  return Math.max(0, Math.min(100, startIndex - penalty + quiet * recovery));
}

/**
 * R3 - mean across every topic of both rounds.
 *
 * This departs from the written spec, which takes the latest round only: five
 * integer topics can then land only on a 0.2 step, which put the approved
 * design's 4.3 out of reach. Still pending the school's confirmation, because
 * it changes who crosses the 3.5 coaching threshold.
 */
export function observationScore(rounds) {
  const values = rounds.flatMap((r) => OBSERVATION_TOPICS.map((t) => r.scores[t.id]).filter((v) => typeof v === 'number'));
  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** R4 - weighted share across the six agreed channels. */
export function parentIndex(rows) {
  if (!rows.length) return null;
  return PARENT_CHANNELS.reduce((total, ch) => {
    const forChannel = rows.filter((r) => r.channelId === ch.id);
    if (!forChannel.length) return total;
    return total + ch.weight * (forChannel.filter((r) => r.done).length / forChannel.length);
  }, 0);
}

/** R5 - ranking aid for the matrix view only. Never used to judge a teacher. */
export function classIndex({ assessment, behaviour, observation, parent }) {
  const parts = [assessment, behaviour, observation == null ? null : observation * METRICS.observation.scale, parent]
    .filter((v) => v != null);
  if (!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/** R8 - task status, derived from the due date, never stored. */
export function taskStatus(task, asOf = new Date()) {
  if (task.completedAt) return TASK_STATUS.done;
  if (new Date(task.dueDate) < asOf) return TASK_STATUS.overdue;
  return TASK_STATUS.pending;
}

/**
 * R9 - a teacher may correct their own entry inside the window; after that it
 * takes office staff and a stated reason. Enforced in the database by
 * public.enforce_edit_window(), which is the copy that actually binds.
 */
export function canEdit(record, user, editWindowDays = 7, asOf = new Date()) {
  const age = (asOf.getTime() - new Date(record.recordedAt || record.occurredAt).getTime()) / 86400000;
  if (user.role === 'staff') return { allowed: true, needsReason: age > editWindowDays };
  if (record.teacherId !== user.id && record.recordedBy !== user.id) {
    return { allowed: false, why: 'แก้ได้เฉพาะรายการของตัวเอง' };
  }
  if (age > editWindowDays) {
    return { allowed: false, why: `เกิน ${editWindowDays} วันแล้ว ต้องให้ธุรการแก้และระบุเหตุผล` };
  }
  return { allowed: true, needsReason: false };
}
