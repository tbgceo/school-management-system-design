/**
 * Deterministic mock dataset.
 *
 * This file is the ONLY place that invents data. It emits the flat record arrays described in
 * schema.js; every number the UI shows is then computed from these rows by src/lib/rules.js.
 * In M7 this module is replaced by API calls that return the same shapes - nothing else changes.
 *
 * The generator is seeded, so a reload always produces the same school.
 */

import {
  AS_OF, TERM_START, CHECKPOINT_WEEKS, CHECKPOINTS, TERM_WEEKS,
  SUBJECTS, INCIDENT_TYPES, OBSERVATION_TOPICS, PARENT_CHANNELS,
  TARGETS, CURRENT_SEMESTER, BEHAVIOUR_START, BEHAVIOUR_RECOVERY_PER_WEEK,
} from './constants';

const SCHOOL_ID = 'sch-001';
const SEM = CURRENT_SEMESTER;

/* ------------------------------------------------------------------ *
 * Seeded randomness - mulberry32. Same seed, same school, every run.
 * ------------------------------------------------------------------ */
function mulberry32(seed) {
  let a = seed >>> 0;
  return function rnd() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20690919);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const between = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));

/* ------------------------------------------------------------------ *
 * Dates
 * ------------------------------------------------------------------ */
const DAY = 86400000;
const iso = (d) => new Date(d).toISOString();
const addDays = (d, n) => new Date(d.getTime() + n * DAY);

/** A2 - checkpoint N closes at the end of its week. */
export const CHECKPOINT_DATES = CHECKPOINT_WEEKS.map((w) => addDays(TERM_START, w * 7 - 1));

/* ------------------------------------------------------------------ *
 * Name pools
 * ------------------------------------------------------------------ */
const FIRST_TH = [
  'กนกวรรณ', 'พรทิพย์', 'อนันต์', 'ศิริพร', 'วีระชัย', 'ณภัทร', 'ดวงใจ', 'ธนกร', 'ปรีดา',
  'สมชาย', 'สุดารัตน์', 'วราภรณ์', 'จิราพร', 'ณัฐพล', 'พิมพ์ชนก', 'ธีรศักดิ์', 'อารยา',
  'กิตติศักดิ์', 'เบญจมาศ', 'ภานุวัฒน์', 'รัตนา', 'สิทธิชัย', 'อรวรรณ', 'ชัยวัฒน์', 'มณีรัตน์',
  'ปิยะ', 'สุภาพร', 'ทวีศักดิ์', 'นันทนา', 'เอกชัย', 'ลัดดาวัลย์', 'ประสิทธิ์', 'จันทร์เพ็ญ',
  'วิชัย', 'ศศิธร', 'บุญมี', 'พัชรี', 'สมหมาย', 'กาญจนา', 'ยุทธนา', 'สายฝน', 'นิภาพร',
];
const LAST_TH = [
  'สุขใจ', 'รุ่งเรือง', 'ทองดี', 'ใจงาม', 'พัฒนากุล', 'ศรีสุข', 'บุญมาก', 'แสงทอง',
  'วงศ์ไทย', 'มีชัย', 'อินทร์แก้ว', 'ชูเกียรติ', 'พรหมมา', 'สินสมบูรณ์', 'เจริญสุข',
  'ก้องเกียรติ', 'นาคเงิน', 'ดาวเรือง', 'ภูผา', 'ทะเลใส',
];
const STUDENT_FIRST = [
  'ภูมิ', 'ข้าวหอม', 'ปุณณ์', 'นภัส', 'อิงฟ้า', 'ธาดา', 'พลอย', 'กันต์', 'ใบเตย', 'ปรินทร์',
  'มีนา', 'ชนน', 'อารดา', 'ภูริ', 'ณิชา', 'วรินทร', 'สิรวิชญ์', 'พิชญา', 'ธนวัฒน์', 'กมลชนก',
  'รวิพล', 'ปาณิสรา', 'จิรายุ', 'ศุภกร', 'อภิชญา', 'ณฐกร', 'สุพิชฌาย์', 'พชร', 'ไอลดา', 'ธัญชนก',
];

const teacherNameEn = (i, th) => {
  const map = {
    'กนกวรรณ': 'Kanokwan S.', 'พรทิพย์': 'Pornthip R.', 'อนันต์': 'Anan T.',
    'ศิริพร': 'Siriporn K.', 'วีระชัย': 'Weerachai P.', 'ณภัทร': 'Napat J.',
    'ดวงใจ': 'Duangjai M.', 'ธนกร': 'Thanakorn L.', 'ปรีดา': 'Preeda C.',
  };
  return map[th] || `Teacher ${String(i).padStart(2, '0')}`;
};

/* ------------------------------------------------------------------ *
 * Class blueprint.
 *
 * These are the nine classes and the four headline numbers from the approved
 * dashboard design. They are TARGETS for the generator, not stored values: the
 * generator works backwards from them to raw rows, and rules.js then recomputes
 * the metrics from those rows. If a rule changes, the numbers move - which is
 * exactly what should happen.
 * ------------------------------------------------------------------ */
const CLASS_BLUEPRINT = [
  { name: 'ป.1/1', level: 'primary', grade: 1, students: 34, teacher: 'กนกวรรณ', assess: 88, behaviour: 92, obs: 4.3, parent: 71 },
  { name: 'ป.2/1', level: 'primary', grade: 2, students: 36, teacher: 'พรทิพย์', assess: 85, behaviour: 90, obs: 4.1, parent: 68 },
  { name: 'ป.3/1', level: 'primary', grade: 3, students: 33, teacher: 'อนันต์', assess: 79, behaviour: 86, obs: 3.8, parent: 54 },
  { name: 'ป.4/1', level: 'primary', grade: 4, students: 35, teacher: 'ศิริพร', assess: 83, behaviour: 88, obs: 4.0, parent: 62 },
  { name: 'ป.4/2', level: 'primary', grade: 4, students: 35, teacher: 'วีระชัย', assess: 74, behaviour: 71, obs: 3.2, parent: 41 },
  { name: 'ป.5/1', level: 'primary', grade: 5, students: 32, teacher: 'ณภัทร', assess: 81, behaviour: 84, obs: 3.9, parent: 58 },
  { name: 'ป.6/1', level: 'primary', grade: 6, students: 34, teacher: 'ดวงใจ', assess: 90, behaviour: 93, obs: 4.5, parent: 76 },
  { name: 'ม.1/1', level: 'lower', grade: 7, students: 38, teacher: 'ธนกร', assess: 77, behaviour: 75, obs: 3.5, parent: 47 },
  { name: 'ม.2/1', level: 'lower', grade: 8, students: 37, teacher: 'ปรีดา', assess: 72, behaviour: 68, obs: 3.1, parent: 38 },
];

/* ------------------------------------------------------------------ *
 * Solvers - turn a target metric back into raw rows
 * ------------------------------------------------------------------ */

/**
 * R2 solver. behaviour = 100 - (2*n1 + 5*n2 + 10*n3) + incidentFreeWeeks
 * with incidentFreeWeeks = TERM_WEEKS - min(totalIncidents, TERM_WEEKS).
 * Scans severity-ascending so a healthy class gets warnings, not parent call-ins.
 */
function solveIncidents(target) {
  let best = null;
  for (let n3 = 0; n3 <= 3; n3 += 1) {
    for (let n2 = 0; n2 <= 10; n2 += 1) {
      for (let n1 = 0; n1 <= 16; n1 += 1) {
        const total = n1 + n2 + n3;
        if (total === 0 || total > TERM_WEEKS) continue;
        const penalty = 2 * n1 + 5 * n2 + 10 * n3;
        const recovery = (TERM_WEEKS - total) * BEHAVIOUR_RECOVERY_PER_WEEK;
        const value = Math.max(0, Math.min(100, BEHAVIOUR_START - penalty + recovery));
        const miss = Math.abs(value - target);
        if (!best || miss < best.miss) best = { n1, n2, n3, miss };
        if (miss === 0) return best;
      }
    }
  }
  return best;
}

/**
 * R3 solver.
 *
 * R3 averages all ten topic scores from the two rounds, so the mean moves in 0.1 steps and a
 * target such as 4.3 is reachable. Split the required ten-score total across the two rounds,
 * keeping round 2 at or above round 1 so the term reads as improvement.
 */
function solveRoundSums(target) {
  const total = Math.max(10, Math.min(50, Math.round(target * 2 * OBSERVATION_TOPICS.length)));
  let first = Math.floor(total / 2);
  let second = total - first;
  // A dead-even split hides the trend; nudge it apart when there is headroom.
  if (first === second && second < 25 && first > 5) { first -= 1; second += 1; }
  return [first, second];
}

/** Spread one round's total across the five topics, rotating which ones carry the remainder. */
function distributeTopics(sum, offset = 0) {
  const n = OBSERVATION_TOPICS.length;
  const safe = Math.max(n, Math.min(n * 5, sum));
  const base = Math.floor(safe / n);
  const remainder = safe - base * n;
  return OBSERVATION_TOPICS.map((t, i) => {
    const carries = ((i + offset) % n) < remainder;
    return [t.id, Math.max(1, Math.min(5, base + (carries ? 1 : 0)))];
  });
}

/** R4 solver. Scale the school-wide channel profile so the weighted sum hits the class target. */
const CHANNEL_PROFILE = { line_oa: 0.58, conference: 0.71, homework: 0.46, fee: 0.78, volunteer: 0.23, survey: 0.40 };
const PROFILE_INDEX = PARENT_CHANNELS.reduce((sum, c) => sum + c.weight * CHANNEL_PROFILE[c.id], 0);

function solveChannelRates(target) {
  // PROFILE_INDEX is already on the 0-100 scale the index uses, so this is a plain ratio.
  const k = target / PROFILE_INDEX;
  return PARENT_CHANNELS.reduce((acc, c) => {
    acc[c.id] = Math.max(0, Math.min(1, CHANNEL_PROFILE[c.id] * k));
    return acc;
  }, {});
}

/* ------------------------------------------------------------------ *
 * Builders
 * ------------------------------------------------------------------ */
function buildTeachers() {
  const teachers = [];
  teachers.push({
    id: 'tch-director', schoolId: SCHOOL_ID, nameTh: 'ผอ. สุรชัย วัฒนกิจ', nameEn: 'Surachai W.',
    email: 'director@tbg.ac.th', role: 'director', subjectGroupId: null, isDepartmentHead: false,
  });
  teachers.push({
    id: 'tch-staff', schoolId: SCHOOL_ID, nameTh: 'คุณมาลี ธุรการ', nameEn: 'Malee T.',
    email: 'office@tbg.ac.th', role: 'staff', subjectGroupId: null, isDepartmentHead: false,
  });

  // Nine homeroom teachers, named to match the design.
  CLASS_BLUEPRINT.forEach((c, i) => {
    teachers.push({
      id: `tch-${String(i + 1).padStart(3, '0')}`,
      schoolId: SCHOOL_ID,
      nameTh: `ครู${c.teacher} ${LAST_TH[i % LAST_TH.length]}`,
      nameEn: teacherNameEn(i + 1, c.teacher),
      email: `teacher${i + 1}@tbg.ac.th`,
      role: 'teacher',
      subjectGroupId: SUBJECTS[i % SUBJECTS.length].id,
      isDepartmentHead: false,
    });
  });

  // Eight department heads - they run the observation rounds (A4).
  SUBJECTS.forEach((s, i) => {
    teachers.push({
      id: `tch-head-${s.id}`,
      schoolId: SCHOOL_ID,
      nameTh: `ครู${FIRST_TH[(i + 9) % FIRST_TH.length]} ${LAST_TH[(i + 3) % LAST_TH.length]}`,
      nameEn: `Head ${s.en}`,
      email: `head.${s.id}@tbg.ac.th`,
      role: 'teacher',
      subjectGroupId: s.id,
      isDepartmentHead: true,
    });
  });

  // Fill out to 42 teaching staff, as stated on the dashboard.
  let n = teachers.filter((t) => t.role === 'teacher').length;
  while (n < 42) {
    const i = n + 1;
    teachers.push({
      id: `tch-${String(i + 20).padStart(3, '0')}`,
      schoolId: SCHOOL_ID,
      nameTh: `ครู${FIRST_TH[i % FIRST_TH.length]} ${LAST_TH[i % LAST_TH.length]}`,
      nameEn: `Teacher ${String(i).padStart(2, '0')}`,
      email: `teacher${i + 20}@tbg.ac.th`,
      role: 'teacher',
      subjectGroupId: SUBJECTS[i % SUBJECTS.length].id,
      isDepartmentHead: false,
    });
    n += 1;
  }
  return teachers;
}

function buildClassroomsAndStudents(teachers) {
  const homerooms = teachers.filter((t) => t.role === 'teacher' && !t.isDepartmentHead).slice(0, 9);
  const classrooms = [];
  const students = [];
  const guardians = [];

  CLASS_BLUEPRINT.forEach((c, ci) => {
    const classroomId = `cls-${ci + 1}`;
    classrooms.push({
      id: classroomId,
      schoolId: SCHOOL_ID,
      semesterId: SEM,
      name: c.name,
      level: c.level,
      grade: c.grade,
      homeroomTeacherId: homerooms[ci].id,
    });

    for (let s = 0; s < c.students; s += 1) {
      const studentId = `stu-${ci + 1}-${String(s + 1).padStart(2, '0')}`;
      const guardianId = `gdn-${ci + 1}-${String(s + 1).padStart(2, '0')}`;
      students.push({
        id: studentId,
        schoolId: SCHOOL_ID,
        semesterId: SEM,
        classroomId,
        code: `${69}${String(ci + 1).padStart(2, '0')}${String(s + 1).padStart(3, '0')}`,
        nameTh: `${pick(STUDENT_FIRST)} ${pick(LAST_TH)}`,
        guardianId,
      });
      guardians.push({
        id: guardianId,
        schoolId: SCHOOL_ID,
        studentId,
        nameTh: `ผู้ปกครองของ ${students[students.length - 1].nameTh.split(' ')[0]}`,
      });
    }
  });

  return { classrooms, students, guardians };
}

/**
 * S4 - assessment rows.
 * For every checkpoint we place exactly the number of passing rows needed for R1 to land on
 * the blueprint percentage, then give each row a plausible score on the right side of 70.
 * Checkpoint 4 is missing for two (class, subject) pairs so R7 has real late submissions.
 */
const LATE_SUBMISSIONS = [
  { classIndex: 4, subjectId: 'math' },     // ป.4/2
  { classIndex: 8, subjectId: 'science' },  // ม.2/1
];

function buildAssessments(classrooms, students) {
  const rows = [];
  let seq = 0;

  classrooms.forEach((cls, ci) => {
    const bp = CLASS_BLUEPRINT[ci];
    const roster = students.filter((s) => s.classroomId === cls.id);

    CHECKPOINTS.forEach((cp, cpi) => {
      // The class climbs towards its blueprint figure over the term.
      const pct = Math.max(30, Math.min(100, bp.assess - (CHECKPOINTS.length - 1 - cpi) * 3));
      const subjects = SUBJECTS.filter((sub) => !(
        cp === 4 && LATE_SUBMISSIONS.some((l) => l.classIndex === ci && l.subjectId === sub.id)
      ));

      // Spread the passing cells by student rather than by subject. Filling subject-major
      // would give every student the same mix and flatten the "students below the threshold"
      // list on S3; ranking students means the weakest genuinely fail across the board.
      const ranked = roster
        .map((stu, i) => ({ stu, rank: ((i * 7919 + ci * 104729 + cpi * 31) % roster.length) }))
        .sort((a, b) => a.rank - b.rank)
        .map((r) => r.stu);

      const cells = [];
      let remaining = Math.round((roster.length * subjects.length * pct) / 100);
      ranked.forEach((stu) => {
        const passing = Math.max(0, Math.min(subjects.length, remaining));
        remaining -= passing;
        subjects.forEach((sub, si) => cells.push({ sub, stu, passes: si < passing }));
      });

      cells.forEach((cell) => {
        const { passes } = cell;
        const score = passes ? between(TARGETS.passingScore, 96) : between(42, TARGETS.passingScore - 1);
        const recordedAt = addDays(CHECKPOINT_DATES[cpi], between(1, 5));
        const onBehalf = ci === 8 && cp === 3; // staff typed ม.2/1 checkpoint 3 for the teacher
        seq += 1;
        rows.push({
          id: `asm-${seq}`,
          schoolId: SCHOOL_ID,
          semesterId: SEM,
          classroomId: cls.id,
          studentId: cell.stu.id,
          subjectId: cell.sub.id,
          checkpoint: cp,
          score,
          recordedAt: iso(recordedAt),
          teacherId: cls.homeroomTeacherId,
          recordedBy: onBehalf ? 'tch-staff' : cls.homeroomTeacherId,
          onBehalf,
          note: null,
        });
      });
    });
  });

  return rows;
}

function buildBehaviour(classrooms, students) {
  const rows = [];
  let seq = 0;

  classrooms.forEach((cls, ci) => {
    const bp = CLASS_BLUEPRINT[ci];
    const roster = students.filter((s) => s.classroomId === cls.id);
    const { n1, n2, n3 } = solveIncidents(bp.behaviour);
    const plan = [
      ...Array(n1).fill(1),
      ...Array(n2).fill(2),
      ...Array(n3).fill(3),
    ];

    // One incident per week at most, so the R2 recovery term is well defined.
    plan.forEach((level, i) => {
      const week = Math.min(TERM_WEEKS - 1, Math.floor((i * TERM_WEEKS) / Math.max(plan.length, 1)));
      const occurredAt = addDays(TERM_START, week * 7 + between(0, 4));
      const type = level === 3 ? pick([INCIDENT_TYPES[3], INCIDENT_TYPES[4]]) : pick(INCIDENT_TYPES);
      seq += 1;
      rows.push({
        id: `bhv-${seq}`,
        schoolId: SCHOOL_ID,
        semesterId: SEM,
        classroomId: cls.id,
        studentId: pick(roster).id,
        typeId: type.id,
        level,
        occurredAt: iso(occurredAt),
        recordedBy: cls.homeroomTeacherId,
        note: level === 3 ? 'เชิญผู้ปกครองพบครูประจำชั้น' : null,
      });
    });
  });

  return rows;
}

function buildObservations(teachers, classrooms) {
  const rows = [];
  const heads = teachers.filter((t) => t.isDepartmentHead);
  let seq = 0;

  const scoreFor = (teacherId, target) => {
    const roundSums = solveRoundSums(target);
    [1, 2].forEach((round) => {
      const scores = Object.fromEntries(distributeTopics(roundSums[round - 1], round));
      seq += 1;
      rows.push({
        id: `obs-${seq}`,
        schoolId: SCHOOL_ID,
        semesterId: SEM,
        teacherId,
        observerId: heads[seq % heads.length].id,
        round,
        scores,
        recordedAt: iso(addDays(TERM_START, round === 1 ? 45 : 100)),
        note: null,
      });
    });
  };

  // Homeroom teachers follow their class blueprint.
  classrooms.forEach((cls, ci) => scoreFor(cls.homeroomTeacherId, CLASS_BLUEPRINT[ci].obs));

  // Everyone else gets a spread that reproduces the design's observation bands.
  const others = teachers.filter(
    (t) => t.role === 'teacher' && !classrooms.some((c) => c.homeroomTeacherId === t.id),
  );
  // Chosen so the four observation bands across all 42 teaching staff come out at
  // 9 / 16 / 11 / 6, the distribution the approved dashboard shows. The nine homeroom
  // teachers contribute 1 / 3 / 3 / 2 of that from their own blueprint scores.
  const bandPlan = [
    ...Array(8).fill(4.6), ...Array(13).fill(4.2),
    ...Array(8).fill(3.7), ...Array(4).fill(3.2),
  ];
  others.forEach((t, i) => scoreFor(t.id, bandPlan[i % bandPlan.length]));

  return rows;
}

function buildParentEngagement(classrooms, students, guardians) {
  const rows = [];
  let seq = 0;

  classrooms.forEach((cls, ci) => {
    const bp = CLASS_BLUEPRINT[ci];
    const rates = solveChannelRates(bp.parent);
    const roster = students.filter((s) => s.classroomId === cls.id);
    const ids = roster.map((s) => s.guardianId);

    PARENT_CHANNELS.forEach((ch) => {
      const doneCount = Math.round(ids.length * rates[ch.id]);
      ids.forEach((guardianId, i) => {
        seq += 1;
        rows.push({
          id: `pae-${seq}`,
          schoolId: SCHOOL_ID,
          semesterId: SEM,
          classroomId: cls.id,
          guardianId,
          channelId: ch.id,
          done: i < doneCount,
          recordedAt: iso(addDays(TERM_START, between(60, 118))),
          recordedBy: 'tch-staff',
        });
      });
    });
  });

  return { rows, guardianCount: guardians.length };
}

function buildTasks(classrooms) {
  const near = (n) => iso(addDays(AS_OF, n));
  const t = (i) => classrooms[i].homeroomTeacherId;

  return [
    {
      id: 'tsk-1', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'ส่งแผนยกระดับผลสัมฤทธิ์คณิตศาสตร์ ม.2/1',
      assigneeIds: [t(8)], classroomId: classrooms[8].id,
      dueDate: near(-4), source: 'action_item', sourceActionItemId: null,
      completedAt: null, createdBy: 'tch-director', createdAt: near(-14), attachments: [],
    },
    {
      id: 'tsk-2', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'เข้ารอบโค้ชชิ่งกับหัวหน้ากลุ่มสาระ',
      assigneeIds: [t(4)], classroomId: classrooms[4].id,
      dueDate: near(6), source: 'action_item', sourceActionItemId: null,
      completedAt: null, createdBy: 'tch-director', createdAt: near(-3), attachments: [],
    },
    {
      id: 'tsk-3', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'ทบทวนบันทึกพฤติกรรมคาบ 6 และเสนอมาตรการ',
      assigneeIds: [t(7)], classroomId: classrooms[7].id,
      dueDate: near(2), source: 'action_item', sourceActionItemId: null,
      completedAt: null, createdBy: 'tch-director', createdAt: near(-6), attachments: [],
    },
    {
      id: 'tsk-4', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'จัดกิจกรรม SCL ไทย-จีน หน่วยที่ 3 และ 4',
      assigneeIds: [t(2)], classroomId: classrooms[2].id,
      dueDate: near(11), source: 'manual', sourceActionItemId: null,
      completedAt: null, createdBy: 'tch-director', createdAt: near(-9), attachments: [],
    },
    {
      id: 'tsk-5', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'ส่งผลประเมินจุดตรวจที่ 4 กลุ่มสาระคณิตศาสตร์',
      assigneeIds: [t(4), t(8)], classroomId: null,
      dueDate: near(-2), source: 'action_item', sourceActionItemId: null,
      completedAt: null, createdBy: 'tch-director', createdAt: near(-10), attachments: [],
    },
    {
      id: 'tsk-6', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'รวบรวมแบบสอบถามผู้ปกครอง ภาคเรียนที่ 1',
      assigneeIds: [t(0), t(1), t(3)], classroomId: null,
      dueDate: near(-8), source: 'manual', sourceActionItemId: null,
      completedAt: near(-9), createdBy: 'tch-director', createdAt: near(-20),
      attachments: [{ name: 'survey-summary.pdf', kind: 'pdf' }],
    },
    {
      id: 'tsk-7', schoolId: SCHOOL_ID, semesterId: SEM,
      title: 'อัปเดตแผนการสอนหลังนิเทศรอบ 1',
      assigneeIds: [t(5)], classroomId: classrooms[5].id,
      dueDate: near(-15), source: 'manual', sourceActionItemId: null,
      completedAt: near(-16), createdBy: 'tch-director', createdAt: near(-30), attachments: [],
    },
  ];
}

function buildImportBatches() {
  return [
    {
      id: 'imp-1', schoolId: SCHOOL_ID, semesterId: SEM,
      fileName: 'master-data-2569-s1.xlsx', mode: 'replace',
      rowsOk: 365, rowsFailed: 0, errors: [],
      uploadedBy: 'tch-staff', uploadedAt: iso(addDays(TERM_START, -6)), state: 'confirmed',
    },
    {
      id: 'imp-2', schoolId: SCHOOL_ID, semesterId: SEM,
      fileName: 'students-transfer-aug.xlsx', mode: 'append',
      rowsOk: 4, rowsFailed: 2,
      errors: [
        { sheet: 'students', row: 5, reason: 'รหัสนักเรียนซ้ำกับที่มีอยู่แล้ว (6903021)' },
        { sheet: 'students', row: 7, reason: 'ไม่พบห้องเรียน "ป.7/1" ในทะเบียนภาคเรียนนี้' },
      ],
      uploadedBy: 'tch-staff', uploadedAt: iso(addDays(TERM_START, 82)), state: 'confirmed',
    },
  ];
}

/* ------------------------------------------------------------------ *
 * Assemble
 * ------------------------------------------------------------------ */
function build() {
  const schools = [{ id: SCHOOL_ID, nameTh: 'โรงเรียนสาธิต ทีบีจี', nameEn: 'TBG Demonstration School' }];
  const teachers = buildTeachers();
  const { classrooms, students, guardians } = buildClassroomsAndStudents(teachers);
  const assessments = buildAssessments(classrooms, students);
  const behaviour = buildBehaviour(classrooms, students);
  const observations = buildObservations(teachers, classrooms);
  const { rows: parentEngagement } = buildParentEngagement(classrooms, students, guardians);
  const tasks = buildTasks(classrooms);
  const importBatches = buildImportBatches();

  return {
    schools,
    teachers,
    classrooms,
    students,
    guardians,
    assessments,
    behaviour,
    observations,
    parentEngagement,
    tasks,
    actionItems: [], // R7 - derived at read time by rules.js, never stored
    editLog: [],
    importBatches,
  };
}

export const db = build();

export const SCHOOL = db.schools[0];
export const DIRECTOR = db.teachers.find((t) => t.role === 'director');
export const STAFF = db.teachers.find((t) => t.role === 'staff');

/** Events shown in the "This week" panel. Calendar entries, not derived metrics. */
export const WEEK_ITEMS = [
  { label: 'PLC circle · วง PLC ครูคณิตศาสตร์', when: 'พุธ 15:30' },
  { label: 'Observation round 2 opens · นิเทศรอบ 2', when: 'พฤหัสบดี' },
  { label: 'Parent conference ม.1-ม.3', when: 'เสาร์ 09:00' },
  { label: 'ปิดจุดตรวจที่ 4 · assessment checkpoint 4', when: '26 ก.ย.' },
];
