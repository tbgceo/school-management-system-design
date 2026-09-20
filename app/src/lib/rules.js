/**
 * Calculation rules R1-R9 from Spec v1 - Module 01.
 *
 * Every metric on every screen comes from a function in this file, computed from the raw
 * records in src/data. Nothing is precomputed and stored. That is deliberate: when the rules
 * change, one edit here moves every screen at once, and when the mock data is swapped for a
 * real database in M7 these functions keep working on the same row shapes.
 */

import {
  AS_OF, TERM_START, TERM_WEEKS, CHECKPOINTS, SUBJECTS,
  TARGETS, STATUS, PARENT_CHANNELS, OBSERVATION_TOPICS,
  BEHAVIOUR_START, BEHAVIOUR_RECOVERY_PER_WEEK, INCIDENT_LEVELS,
  SUBMISSION_GRACE_DAYS, EDIT_WINDOW_DAYS, TASK_STATUS,
} from '../data/constants.js';
import { CHECKPOINT_DATES } from '../data/mockData.js';

const DAY = 86400000;
const WEEK = DAY * 7;
const penaltyFor = (level) => (INCIDENT_LEVELS.find((l) => l.level === level) || { penalty: 0 }).penalty;

/**
 * Metric definitions. `scale` lifts a metric onto the shared 0-100 axis so R5 and R6 can use
 * one band width across metrics that are not natively percentages (observation is 1-5).
 */
export const METRICS = {
  assessment:  { key: 'assessment',  scale: 1,  target: TARGETS.assessment,  label: 'Assessment vs target', th: 'ผลประเมินเทียบเป้าหมาย', unit: '%' },
  behaviour:   { key: 'behaviour',   scale: 1,  target: TARGETS.behaviour,   label: 'Behaviour index',      th: 'คะแนนพฤติกรรมนักเรียน',  unit: '' },
  observation: { key: 'observation', scale: 20, target: TARGETS.observation, label: 'Teacher observation',  th: 'คะแนนนิเทศการสอน',       unit: '' },
  parent:      { key: 'parent',      scale: 1,  target: TARGETS.parent,      label: 'Parent engagement',    th: 'การมีส่วนร่วมผู้ปกครอง',  unit: '%' },
};

/* ================================================================== *
 * R1 - assessment against target
 * Share of students at or above the passing score, not the mean, so a
 * handful of strong students cannot mask the rest.
 * ================================================================== */
export function assessmentPct(rows) {
  if (!rows.length) return null;
  const passed = rows.filter((r) => r.score >= TARGETS.passingScore).length;
  return (passed / rows.length) * 100;
}

/* ================================================================== *
 * R2 - behaviour index
 * Starts at 100 each term, loses points per incident level, and recovers
 * one point for every week that passes without a new incident.
 * ================================================================== */
export function behaviourIndex(incidents, asOf = AS_OF) {
  const weeksElapsed = Math.max(
    0,
    Math.min(TERM_WEEKS, Math.ceil((asOf.getTime() - TERM_START.getTime()) / WEEK)),
  );
  const seen = incidents.filter((i) => new Date(i.occurredAt) <= asOf);
  const penalty = seen.reduce((sum, i) => sum + penaltyFor(i.level), 0);

  const weeksWithIncident = new Set(
    seen.map((i) => Math.floor((new Date(i.occurredAt).getTime() - TERM_START.getTime()) / WEEK)),
  ).size;
  const quietWeeks = Math.max(0, weeksElapsed - weeksWithIncident);

  const raw = BEHAVIOUR_START - penalty + quietWeeks * BEHAVIOUR_RECOVERY_PER_WEEK;
  return Math.max(0, Math.min(100, raw));
}

/* ================================================================== *
 * R3 - observation score
 * Mean of the five topics across every round held so far this semester.
 * Two rounds a term; until the second happens the first one stands on its own.
 *
 * Averaging both rounds rather than taking only the latest is deliberate. Five
 * integer topics from a single round can only average onto a 0.2 step, which put
 * the design's 4.3 out of reach; ten scores across two rounds move in 0.1 steps.
 * It also stops one weak round from erasing a term's worth of evidence.
 * ================================================================== */
export function observationScore(rows, asOf = AS_OF) {
  const done = rows.filter((r) => new Date(r.recordedAt) <= asOf);
  if (!done.length) return null;

  const values = done.flatMap((r) => OBSERVATION_TOPICS
    .map((t) => r.scores[t.id])
    .filter((v) => typeof v === 'number'));

  if (!values.length) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/* ================================================================== *
 * R4 - parent engagement index
 * Weighted share across the six agreed channels (Q3).
 * ================================================================== */
export function parentIndex(rows) {
  if (!rows.length) return null;
  let total = 0;
  PARENT_CHANNELS.forEach((ch) => {
    const forChannel = rows.filter((r) => r.channelId === ch.id);
    if (!forChannel.length) return;
    const rate = forChannel.filter((r) => r.done).length / forChannel.length;
    total += ch.weight * rate;
  });
  return total;
}

/* ================================================================== *
 * R5 - combined class index
 * Ranking aid for the matrix view only. Never used to judge a teacher.
 * ================================================================== */
export function classIndex({ assessment, behaviour, observation, parent }) {
  const parts = [assessment, behaviour, observation == null ? null : observation * METRICS.observation.scale, parent]
    .filter((v) => v != null);
  if (!parts.length) return null;
  return Math.round(parts.reduce((a, b) => a + b, 0) / parts.length);
}

/* ================================================================== *
 * R6 - status bands
 * One scale everywhere. At risk also covers a metric that has slipped on two
 * consecutive checkpoints, even when it is still near target.
 * ================================================================== */
export function statusFor(value, metric, series = []) {
  if (value == null) return STATUS.watch;
  const { target, scale } = metric;

  // Compare the value the screen actually shows, not the raw float. Otherwise a class sitting
  // exactly on the edge of a band (76.97 rendering as 77 against an 82 target) reads "5 points
  // under target" while being coloured as if it were more than 5 under.
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
 * R8 - task status, derived from the due date
 * ================================================================== */
export function taskStatus(task, asOf = AS_OF) {
  if (task.completedAt) return TASK_STATUS.done;
  if (new Date(task.dueDate) < asOf) return TASK_STATUS.overdue;
  return TASK_STATUS.pending;
}

/* ================================================================== *
 * R9 - retrospective edit window
 * A teacher may correct their own entry for seven days. After that it takes
 * office staff and a stated reason. Either way the previous value is kept.
 * ================================================================== */
export function canEdit(record, user, asOf = AS_OF) {
  const age = (asOf.getTime() - new Date(record.recordedAt || record.occurredAt).getTime()) / DAY;
  const own = record.teacherId === user.id || record.recordedBy === user.id;

  if (user.role === 'staff') return { allowed: true, needsReason: age > EDIT_WINDOW_DAYS };
  if (!own) return { allowed: false, needsReason: false, why: 'แก้ได้เฉพาะรายการของตัวเอง' };
  if (age > EDIT_WINDOW_DAYS) {
    return { allowed: false, needsReason: false, why: `เกิน ${EDIT_WINDOW_DAYS} วันแล้ว ต้องให้ธุรการแก้และระบุเหตุผล` };
  }
  return { allowed: true, needsReason: false };
}

/* ================================================================== *
 * Selectors - the shapes the screens actually consume
 * ================================================================== */

const inSemester = (rows, semesterId) => rows.filter((r) => r.semesterId === semesterId);

/** Assessment percentage for one class at one checkpoint, or null when nothing was submitted. */
export function assessmentAtCheckpoint(db, classroomId, checkpoint, semesterId) {
  const rows = db.assessments.filter(
    (r) => r.classroomId === classroomId && r.checkpoint === checkpoint && r.semesterId === semesterId,
  );
  return assessmentPct(rows);
}

/**
 * The four metrics for one class, plus a checkpoint-by-checkpoint series for each.
 * The series is what the sparklines and the trend arrows read.
 */
export function classMetrics(db, classroom, semesterId, asOf = AS_OF) {
  const cid = classroom.id;

  const assessmentSeries = CHECKPOINTS.map((cp) => assessmentAtCheckpoint(db, cid, cp, semesterId));
  const assessment = [...assessmentSeries].reverse().find((v) => v != null) ?? null;

  const incidents = inSemester(db.behaviour, semesterId).filter((r) => r.classroomId === cid);
  const behaviourSeries = CHECKPOINT_DATES.map((d) => (d <= asOf ? behaviourIndex(incidents, d) : null));
  const behaviour = behaviourIndex(incidents, asOf);

  const obsRows = inSemester(db.observations, semesterId).filter((r) => r.teacherId === classroom.homeroomTeacherId);
  const observationSeries = CHECKPOINT_DATES.map((d) => (d <= asOf ? observationScore(obsRows, d) : null));
  const observation = observationScore(obsRows, asOf);

  const parentRows = inSemester(db.parentEngagement, semesterId).filter((r) => r.classroomId === cid);
  const parentSeries = CHECKPOINT_DATES.map((d) => {
    if (d > asOf) return null;
    const upTo = parentRows.filter((r) => new Date(r.recordedAt) <= d);
    return upTo.length ? parentIndex(upTo) : null;
  });
  const parent = parentIndex(parentRows);

  const values = { assessment, behaviour, observation, parent };
  const series = { assessment: assessmentSeries, behaviour: behaviourSeries, observation: observationSeries, parent: parentSeries };

  const statuses = {
    assessment: statusFor(assessment, METRICS.assessment, assessmentSeries),
    behaviour: statusFor(behaviour, METRICS.behaviour, behaviourSeries),
    observation: statusFor(observation, METRICS.observation, observationSeries),
    parent: statusFor(parent, METRICS.parent, parentSeries),
  };

  return {
    classroom,
    ...values,
    series,
    statuses,
    index: classIndex(values),
    // The row status on the dashboard follows the headline metric, the way the
    // approved design reads it. Per-metric colour still uses each metric's own band.
    status: statuses.assessment,
    studentCount: db.students.filter((s) => s.classroomId === cid && s.semesterId === semesterId).length,
    homeroom: db.teachers.find((t) => t.id === classroom.homeroomTeacherId),
  };
}

/** Every class, filtered by level, in roster order. */
export function allClassMetrics(db, semesterId, level = 'all', asOf = AS_OF) {
  return db.classrooms
    .filter((c) => c.semesterId === semesterId)
    .filter((c) => (level === 'all' ? true : c.level === level))
    .map((c) => classMetrics(db, c, semesterId, asOf));
}

/** School-wide KPI cards. Each is the mean across the classes currently in view. */
export function schoolMetrics(rows) {
  const mean = (key) => {
    const vals = rows.map((r) => r[key]).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };
  const meanSeries = (key) => CHECKPOINTS.map((_, i) => {
    const vals = rows.map((r) => r.series[key][i]).filter((v) => v != null);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });

  return Object.values(METRICS).map((m) => {
    const value = mean(m.key);
    const series = meanSeries(m.key);
    return { metric: m, value, series, status: statusFor(value, m, series) };
  });
}

/** Observation bands for the right-hand panel, across all teaching staff. */
export function observationBands(db, semesterId, asOf = AS_OF) {
  const teachers = db.teachers.filter((t) => t.role === 'teacher');
  const scores = teachers
    .map((t) => observationScore(inSemester(db.observations, semesterId).filter((r) => r.teacherId === t.id), asOf))
    .filter((v) => v != null);

  const band = (lo, hi) => scores.filter((s) => s >= lo && s < hi).length;
  return {
    bands: [
      { label: '4.5 – 5.0', count: band(4.5, 5.01) },
      { label: '4.0 – 4.4', count: band(4.0, 4.5) },
      { label: '3.5 – 3.9', count: band(3.5, 4.0) },
      { label: 'below 3.5', count: scores.filter((s) => s < TARGETS.coaching).length },
    ],
    total: scores.length,
    belowThreshold: scores.filter((s) => s < TARGETS.coaching).length,
  };
}

/** Channel-by-channel parent rates, school-wide or for one class. */
export function parentChannelRates(db, semesterId, classroomId = null) {
  const rows = inSemester(db.parentEngagement, semesterId)
    .filter((r) => (classroomId ? r.classroomId === classroomId : true));
  return PARENT_CHANNELS.map((ch) => {
    const forChannel = rows.filter((r) => r.channelId === ch.id);
    const rate = forChannel.length ? forChannel.filter((r) => r.done).length / forChannel.length : 0;
    return { channel: ch, rate: rate * 100, count: forChannel.filter((r) => r.done).length, of: forChannel.length };
  });
}

/** Checkpoint submissions that are past the grace period (feeds R7). */
export function lateSubmissions(db, semesterId, asOf = AS_OF) {
  const out = [];
  db.classrooms.filter((c) => c.semesterId === semesterId).forEach((cls) => {
    CHECKPOINTS.forEach((cp, i) => {
      const closed = CHECKPOINT_DATES[i];
      if (closed > asOf) return;
      const daysLate = Math.floor((asOf.getTime() - closed.getTime()) / DAY);
      if (daysLate <= SUBMISSION_GRACE_DAYS) return;
      SUBJECTS.forEach((sub) => {
        const any = db.assessments.some(
          (r) => r.classroomId === cls.id && r.checkpoint === cp && r.subjectId === sub.id && r.semesterId === semesterId,
        );
        if (!any) out.push({ classroom: cls, checkpoint: cp, subject: sub, daysLate });
      });
    });
  });
  return out;
}

/* ================================================================== *
 * R7 - action items
 * The system raises these; nobody creates one by hand, and only the director
 * can close one.
 * ================================================================== */
export function buildActionItems(db, semesterId, closedIds = {}, asOf = AS_OF) {
  const items = [];
  const rows = allClassMetrics(db, semesterId, 'all', asOf);
  const push = (o) => items.push({
    schoolId: db.schools[0].id,
    semesterId,
    closedAt: closedIds[o.id] || null,
    closedBy: closedIds[o.id] ? 'tch-director' : null,
    ...o,
  });

  // Trigger 1 - a class sitting in the at-risk band (R6).
  rows.filter((r) => r.status.key === 'risk').forEach((r) => {
    const gap = Math.round(TARGETS.assessment - r.assessment);
    push({
      id: `ai-risk-${r.classroom.id}`,
      trigger: 'class_at_risk',
      classroomId: r.classroom.id,
      teacherId: r.homeroom.id,
      title: `Assessment ${gap} points under target`,
      titleTh: `ผลประเมินต่ำกว่าเป้าหมาย ${gap} จุด`,
      detail: `${r.classroom.name} อยู่ที่ ${r.assessment.toFixed(0)}% เทียบเป้าหมาย ${TARGETS.assessment}% ของภาคเรียน`,
      owner: r.homeroom.nameTh,
      action: 'เปิดแผน',
      tone: 'danger',
      raisedAt: asOf.toISOString(),
    });
  });

  // Trigger 2 - observation below the coaching threshold (R3).
  db.teachers.filter((t) => t.role === 'teacher').forEach((t) => {
    const score = observationScore(inSemester(db.observations, semesterId).filter((r) => r.teacherId === t.id), asOf);
    if (score == null || score >= TARGETS.coaching) return;
    const cls = db.classrooms.find((c) => c.homeroomTeacherId === t.id);
    push({
      id: `ai-obs-${t.id}`,
      trigger: 'observation_low',
      classroomId: cls ? cls.id : null,
      teacherId: t.id,
      title: `Observation score fell to ${score.toFixed(1)}`,
      titleTh: `คะแนนนิเทศลดลงเหลือ ${score.toFixed(1)}`,
      detail: `ต่ำกว่าเกณฑ์โค้ชชิ่ง ${TARGETS.coaching} ยังไม่ได้กำหนดรอบโค้ชในภาคเรียนนี้`,
      owner: t.nameTh,
      action: 'จัดรอบโค้ช',
      tone: 'danger',
      raisedAt: asOf.toISOString(),
    });
  });

  // Trigger 3 - a level 3 behaviour incident in the last 30 days.
  const recent = inSemester(db.behaviour, semesterId).filter(
    (b) => b.level === 3 && (asOf.getTime() - new Date(b.occurredAt).getTime()) / DAY <= 30,
  );
  const byClass = {};
  recent.forEach((b) => { byClass[b.classroomId] = (byClass[b.classroomId] || 0) + 1; });
  Object.entries(byClass).forEach(([cid, count]) => {
    const cls = db.classrooms.find((c) => c.id === cid);
    const teacher = db.teachers.find((t) => t.id === cls.homeroomTeacherId);
    push({
      id: `ai-bhv-${cid}`,
      trigger: 'behaviour_level3',
      classroomId: cid,
      teacherId: teacher.id,
      title: `${count} level 3 discipline ${count === 1 ? 'escalation' : 'escalations'}`,
      titleTh: `เหตุพฤติกรรมระดับ 3 จำนวน ${count} ครั้ง`,
      detail: 'ต้องเชิญผู้ปกครองและบันทึกผลการพูดคุยภายในสัปดาห์นี้',
      owner: teacher.nameTh,
      action: 'ดูบันทึก',
      tone: 'warning',
      raisedAt: asOf.toISOString(),
    });
  });

  // Trigger 4 - a checkpoint submission past the grace period.
  lateSubmissions(db, semesterId, asOf).forEach((l) => {
    const teacher = db.teachers.find((t) => t.id === l.classroom.homeroomTeacherId);
    push({
      id: `ai-late-${l.classroom.id}-${l.checkpoint}-${l.subject.id}`,
      trigger: 'submission_late',
      classroomId: l.classroom.id,
      teacherId: teacher.id,
      title: `Checkpoint ${l.checkpoint} not submitted`,
      titleTh: `ยังไม่ส่งผลประเมินจุดตรวจที่ ${l.checkpoint}`,
      detail: `${l.subject.th} · เลยกำหนดมาแล้ว ${l.daysLate} วัน`,
      owner: teacher.nameTh,
      action: 'เตือนครู',
      tone: 'info',
      raisedAt: asOf.toISOString(),
    });
  });

  const order = { danger: 0, warning: 1, info: 2 };
  return items.sort((a, b) => order[a.tone] - order[b.tone]);
}

/** Tasks a given user should see (S6). Directors see everything; teachers see their own. */
export function visibleTasks(db, user, semesterId) {
  return inSemester(db.tasks, semesterId).filter(
    (t) => (user.role === 'director' || user.role === 'staff' ? true : t.assigneeIds.includes(user.id)),
  );
}

/** Classes a given user may open (S3). */
export function visibleClassrooms(db, user, semesterId) {
  const all = db.classrooms.filter((c) => c.semesterId === semesterId);
  if (user.role === 'director' || user.role === 'staff') return all;
  return all.filter((c) => c.homeroomTeacherId === user.id);
}

/** Students below the passing score at the latest checkpoint they have marks for (S3). */
export function strugglingStudents(db, classroomId, semesterId) {
  const rows = db.assessments.filter((r) => r.classroomId === classroomId && r.semesterId === semesterId);
  const byStudent = {};
  rows.forEach((r) => {
    if (!byStudent[r.studentId]) byStudent[r.studentId] = [];
    byStudent[r.studentId].push(r);
  });

  return Object.entries(byStudent).map(([studentId, list]) => {
    const latestCp = Math.max(...list.map((r) => r.checkpoint));
    const latest = list.filter((r) => r.checkpoint === latestCp);
    const avg = latest.reduce((a, b) => a + b.score, 0) / latest.length;
    const failedCheckpoints = CHECKPOINTS.filter((cp) => {
      const atCp = list.filter((r) => r.checkpoint === cp);
      if (!atCp.length) return false;
      return atCp.reduce((a, b) => a + b.score, 0) / atCp.length < TARGETS.passingScore;
    }).length;
    return {
      student: db.students.find((s) => s.id === studentId),
      latestAvg: avg,
      failedCheckpoints,
    };
  })
    .filter((s) => s.latestAvg < TARGETS.passingScore)
    .sort((a, b) => a.latestAvg - b.latestAvg);
}
