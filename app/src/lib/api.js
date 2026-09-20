/**
 * Everything the app reads from or writes to Supabase.
 *
 * Metrics come from the views — `v_class_metrics` is nine rows instead of the
 * ~10,000 marks behind it, and R1–R6 have one definition, in the database. The
 * raw tables are still read where a screen genuinely needs rows: a class roster
 * to grade, a behaviour log to display, a task list to tick.
 *
 * Row level security does the filtering. A teacher's `select` against
 * `v_class_metrics` returns one row because the view carries `security_invoker`
 * and the policies underneath scope it — the app sends no `where role = ...`
 * anywhere, and could not bypass it if it tried.
 *
 * The adapters below reshape view rows into the objects the components already
 * consumed when the data came from the fixture, so the screens did not have to
 * be rewritten around a new vocabulary.
 */

import { supabase } from './supabase.js';
import { STATUS, CHECKPOINTS } from '../data/constants.js';

const bandOf = (key) => STATUS[key] || STATUS.watch;
const num = (v) => (v === null || v === undefined ? null : Number(v));

/* ------------------------------------------------------------------ *
 * Adapters
 * ------------------------------------------------------------------ */

/** A v_class_metrics row plus its four series, shaped like the old classMetrics(). */
function adaptClass(row, seriesRows) {
  const mine = seriesRows.filter((s) => s.classroom_id === row.classroom_id);
  const at = (cp) => mine.find((s) => s.checkpoint === cp);

  const series = {
    assessment: CHECKPOINTS.map((cp) => num(at(cp)?.assessment)),
    behaviour: CHECKPOINTS.map((cp) => num(at(cp)?.behaviour)),
    observation: CHECKPOINTS.map((cp) => num(at(cp)?.observation)),
    parent: CHECKPOINTS.map((cp) => num(at(cp)?.parent)),
  };

  return {
    classroom: {
      id: row.classroom_id,
      name: row.classroom_name,
      level: row.level,
      grade: row.grade,
      homeroomTeacherId: row.homeroom_teacher_id,
    },
    homeroom: {
      id: row.homeroom_teacher_id,
      nameTh: row.homeroom_name_th,
      nameEn: row.homeroom_name_en,
    },
    studentCount: row.student_count,
    assessment: num(row.assessment_pct),
    behaviour: num(row.behaviour_index),
    observation: num(row.observation_score),
    parent: num(row.parent_index),
    index: row.class_index,
    status: bandOf(row.class_status),
    statuses: {
      assessment: bandOf(row.assessment_status),
      behaviour: bandOf(row.behaviour_status),
      observation: bandOf(row.observation_status),
      parent: bandOf(row.parent_status),
    },
    series,
  };
}

function adaptActionItem(row, classNames) {
  return {
    id: row.id,
    trigger: row.trigger_type,
    classroomId: row.classroom_id,
    classroomName: row.classroom_id ? classNames.get(row.classroom_id) : null,
    teacherId: row.teacher_id,
    title: row.title,
    titleTh: row.title_th,
    detail: row.detail,
    owner: row.owner_name,
    action: row.action_label,
    tone: row.tone,
    closedAt: row.closed_at,
  };
}

function adaptTask(row, teachersById) {
  return {
    id: row.id,
    title: row.title,
    classroomId: row.classroom_id,
    dueDate: row.due_date,
    source: row.source,
    completedAt: row.completed_at,
    status: row.status,
    assigneeIds: row.assignee_ids || [],
    assignees: (row.assignee_ids || []).map((id) => teachersById.get(id)).filter(Boolean),
  };
}

/* ------------------------------------------------------------------ *
 * Reads
 * ------------------------------------------------------------------ */

/** The signed-in user's own staff row. Null means an account with no roster entry. */
export async function loadMe() {
  const { data, error } = await supabase
    .from('teachers')
    .select('id, name_th, name_en, email, role, subject_id, is_department_head')
    .limit(1000);
  if (error) throw error;

  const { data: auth } = await supabase.auth.getUser();
  const email = auth?.user?.email?.toLowerCase();
  const me = data.find((t) => t.email.toLowerCase() === email) || null;

  return {
    me: me && {
      id: me.id, nameTh: me.name_th, nameEn: me.name_en,
      email: me.email, role: me.role, isDepartmentHead: me.is_department_head,
    },
    teachers: data.map((t) => ({
      id: t.id, nameTh: t.name_th, nameEn: t.name_en, email: t.email,
      role: t.role, subjectId: t.subject_id, isDepartmentHead: t.is_department_head,
    })),
  };
}

/**
 * One round trip per screen would be tidier, but the whole visible dataset is
 * small once RLS has scoped it — nine classes for a director, one for a teacher
 * — and loading it together keeps every screen consistent with the others.
 */
export async function loadWorkspace(termCode) {
  const { data: term, error: termError } = await supabase
    .from('terms').select('id, code, label, starts_on, ends_on, school_id')
    .eq('code', termCode).single();
  if (termError) throw termError;

  const [
    metrics, series, bands, rates, items, tasks,
    classrooms, students, behaviour, subjects, channels, topics,
    incidentTypes, incidentLevels, targets, batches,
  ] = await Promise.all([
    supabase.from('v_class_metrics').select('*').eq('term_id', term.id),
    supabase.rpc('class_metric_series', { p_term_id: term.id }),
    supabase.from('v_observation_bands').select('*').eq('term_id', term.id).maybeSingle(),
    supabase.from('v_parent_channel_rates').select('*').eq('term_id', term.id),
    supabase.from('action_items').select('*').eq('term_id', term.id).is('closed_at', null),
    supabase.from('v_tasks').select('*').eq('term_id', term.id),
    supabase.from('classrooms').select('id, name, level, grade, homeroom_teacher_id').eq('term_id', term.id),
    supabase.from('students').select('id, code, name_th, classroom_id').eq('term_id', term.id),
    supabase.from('behaviour_incidents')
      .select('id, classroom_id, student_id, incident_type_id, level, occurred_at, note')
      .eq('term_id', term.id).order('occurred_at', { ascending: false }),
    supabase.from('subjects').select('*').order('sort_order'),
    supabase.from('parent_channels').select('*').order('sort_order'),
    supabase.from('observation_topics').select('*').order('sort_order'),
    supabase.from('incident_types').select('*').order('sort_order'),
    supabase.from('incident_levels').select('*').order('level'),
    supabase.from('metric_targets').select('*').eq('term_id', term.id),
    supabase.from('import_batches').select('*, import_errors(*)').eq('term_id', term.id)
      .order('uploaded_at', { ascending: false }),
  ]);

  const firstError = [metrics, series, rates, items, tasks, classrooms, students, behaviour]
    .find((r) => r.error);
  if (firstError) throw firstError.error;

  const { teachers } = await loadMe();
  const teachersById = new Map(teachers.map((t) => [t.id, t]));
  const classNames = new Map((classrooms.data || []).map((c) => [c.id, c.name]));

  const rows = (metrics.data || [])
    .map((r) => adaptClass(r, series.data || []))
    .sort((a, b) => a.classroom.name.localeCompare(b.classroom.name, 'th'));

  return {
    term,
    rows,
    bands: bands.data || null,
    parentRates: rates.data || [],
    actionItems: (items.data || []).map((r) => adaptActionItem(r, classNames)),
    tasks: (tasks.data || []).map((r) => adaptTask(r, teachersById)),
    classrooms: (classrooms.data || []).map((c) => ({
      id: c.id, name: c.name, level: c.level, grade: c.grade, homeroomTeacherId: c.homeroom_teacher_id,
    })),
    students: (students.data || []).map((s) => ({
      id: s.id, code: s.code, nameTh: s.name_th, classroomId: s.classroom_id,
    })),
    behaviour: (behaviour.data || []).map((b) => ({
      id: b.id, classroomId: b.classroom_id, studentId: b.student_id,
      typeId: b.incident_type_id, level: b.level, occurredAt: b.occurred_at, note: b.note,
    })),
    subjects: (subjects.data || []).map((s) => ({ id: s.id, th: s.name_th, en: s.name_en })),
    parentChannels: (channels.data || []).map((c) => ({ id: c.id, th: c.name_th, en: c.name_en, weight: c.weight })),
    observationTopics: (topics.data || []).map((t) => ({ id: t.id, th: t.name_th, en: t.name_en })),
    incidentTypes: (incidentTypes.data || []).map((t) => ({ id: t.id, th: t.name_th, en: t.name_en })),
    incidentLevels: (incidentLevels.data || []).map((l) => ({ level: l.level, th: l.name_th, penalty: l.penalty })),
    targets: Object.fromEntries((targets.data || []).map((t) => [t.metric, Number(t.target)])),
    importBatches: (batches.data || []).map((b) => ({
      id: b.id, fileName: b.file_name, mode: b.mode, rowsOk: b.rows_ok,
      rowsFailed: b.rows_failed, state: b.state, uploadedAt: b.uploaded_at,
      errors: (b.import_errors || []).map((e) => ({ sheet: e.sheet, row: e.row_no, reason: e.reason })),
    })),
    teachers,
  };
}

/** S3 — students below the pass mark, straight from the view. */
export async function loadStruggling(classroomId) {
  const { data, error } = await supabase
    .from('v_struggling_students')
    .select('student_id, code, name_th, latest_avg, failed_checkpoints')
    .eq('classroom_id', classroomId)
    .order('latest_avg');
  if (error) throw error;
  return (data || []).map((s) => ({
    student: { id: s.student_id, code: s.code, nameTh: s.name_th },
    latestAvg: Number(s.latest_avg),
    failedCheckpoints: s.failed_checkpoints,
  }));
}

/** S4 — the marks already on file for one class, checkpoint and subject. */
export async function loadMarks(classroomId, checkpoint, subjectId) {
  const { data, error } = await supabase
    .from('assessments')
    .select('student_id, score')
    .eq('classroom_id', classroomId)
    .eq('checkpoint', checkpoint)
    .eq('subject_id', subjectId);
  if (error) throw error;
  return Object.fromEntries((data || []).map((r) => [r.student_id, String(r.score)]));
}

/** S5 — one guardian's six channel flags. */
export async function loadParentEntries(studentId) {
  const { data, error } = await supabase
    .from('guardians')
    .select('id, parent_engagement(channel_id, done)')
    .eq('student_id', studentId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return { guardianId: null, entries: {} };
  return {
    guardianId: data.id,
    entries: Object.fromEntries((data.parent_engagement || []).map((r) => [r.channel_id, r.done])),
  };
}

/* ------------------------------------------------------------------ *
 * Writes
 *
 * None of these send a role or an owner id to prove anything — the policies
 * decide. A refused write comes back as PostgREST error 42501 rather than
 * quietly doing nothing.
 * ------------------------------------------------------------------ */

export async function submitMarks({ termId, schoolId, classroomId, teacherId, meId, checkpoint, subjectId, scores, note }) {
  const rows = Object.entries(scores)
    .filter(([, v]) => v !== '' && v != null)
    .map(([studentId, v]) => ({
      school_id: schoolId, term_id: termId, classroom_id: classroomId,
      student_id: studentId, subject_id: subjectId, checkpoint,
      score: Number(v), note: note || null,
      teacher_id: teacherId, recorded_by: meId,
    }));
  if (!rows.length) return 0;

  const { error } = await supabase
    .from('assessments')
    .upsert(rows, { onConflict: 'student_id,subject_id,checkpoint' });
  if (error) throw error;
  return rows.length;
}

export async function logBehaviour(row) {
  const { error } = await supabase.from('behaviour_incidents').insert({
    school_id: row.schoolId, term_id: row.termId, classroom_id: row.classroomId,
    student_id: row.studentId, incident_type_id: row.typeId, level: row.level,
    occurred_at: new Date().toISOString(), note: row.note || null, recorded_by: row.meId,
  });
  if (error) throw error;
}

export async function logObservation({ schoolId, termId, teacherId, meId, round, scores, note }) {
  const { data, error } = await supabase.from('observations').insert({
    school_id: schoolId, term_id: termId, teacher_id: teacherId,
    observer_id: meId, round, note: note || null,
  }).select('id').single();
  if (error) throw error;

  const { error: scoreError } = await supabase.from('observation_scores').insert(
    Object.entries(scores).map(([topicId, score]) => ({
      observation_id: data.id, topic_id: topicId, score: Number(score),
    })),
  );
  if (scoreError) throw scoreError;
}

export async function saveParentEngagement({ schoolId, termId, classroomId, guardianId, meId, entries }) {
  const rows = Object.entries(entries).map(([channelId, done]) => ({
    school_id: schoolId, term_id: termId, classroom_id: classroomId,
    guardian_id: guardianId, channel_id: channelId, done: Boolean(done),
    recorded_at: new Date().toISOString(), recorded_by: meId,
  }));
  const { error } = await supabase
    .from('parent_engagement')
    .upsert(rows, { onConflict: 'term_id,guardian_id,channel_id' });
  if (error) throw error;
}

export async function createTask({ schoolId, termId, title, classroomId, dueDate, assigneeIds, meId }) {
  const { data, error } = await supabase.from('tasks').insert({
    school_id: schoolId, term_id: termId, title, classroom_id: classroomId || null,
    due_date: dueDate, source: 'manual', created_by: meId,
  }).select('id').single();
  if (error) throw error;

  const { error: assignError } = await supabase.from('task_assignees').insert(
    assigneeIds.map((teacher_id) => ({ task_id: data.id, teacher_id })),
  );
  if (assignError) throw assignError;
  return data.id;
}

export async function setTaskDone(taskId, done, meId) {
  const { error } = await supabase.from('tasks').update({
    completed_at: done ? new Date().toISOString() : null,
    completed_by: done ? meId : null,
  }).eq('id', taskId);
  if (error) throw error;
}

/** S1 — record the upload attempt and its rejected rows. Staff only, per RLS. */
export async function confirmImport({ schoolId, termId, meId, fileName, mode, rowsOk, rowsFailed, errors }) {
  const { data, error } = await supabase.from('import_batches').insert({
    school_id: schoolId, term_id: termId, file_name: fileName, mode,
    rows_ok: rowsOk, rows_failed: rowsFailed, state: 'confirmed', uploaded_by: meId,
  }).select('id').single();
  if (error) throw error;

  if (errors?.length) {
    const { error: rowError } = await supabase.from('import_errors').insert(
      errors.map((e) => ({ batch_id: data.id, sheet: e.sheet, row_no: e.row, reason: e.reason })),
    );
    if (rowError) throw rowError;
  }
}

/** R7 — the database refuses this for anyone but the director. */
export async function closeActionItem(itemId, meId) {
  const { error } = await supabase.rpc('close_action_item', {
    p_item_id: itemId, p_teacher_id: meId,
  });
  if (error) throw error;
}
