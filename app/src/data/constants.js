// Domain constants for TBG School OS Module 01.
// Every value here traces back to the build spec or Spec v1 - Module 01.
// Changing a target or a weight here changes it everywhere; no screen hardcodes them (rule R6).

/** Reference date the mock dataset is built around. Swap for new Date() against a live DB (M7). */
export const AS_OF = new Date('2026-09-19T08:40:00');

/** A2 - semester 1 runs May-Sep, checkpoints land on weeks 4, 8, 12 and 16. */
export const TERM_START = new Date('2026-05-18T00:00:00');
export const CHECKPOINT_WEEKS = [4, 8, 12, 16];

/** A2 - four checkpoints per semester. */
export const CHECKPOINTS = [1, 2, 3, 4];

/** R9 - teachers may edit their own submission for 7 days; after that staff must do it with a reason. */
export const EDIT_WINDOW_DAYS = 7;

/** R7 - a checkpoint submission counts as late once this many days have passed. */
export const SUBMISSION_GRACE_DAYS = 7;

export const ACADEMIC_YEAR = 2569; // พ.ศ.

export const SEMESTERS = [
  { id: '2569-1', year: 2569, term: 1, label: 'ภาคเรียนที่ 1 / 2569', short: 'S1 / 2569', current: true },
  { id: '2568-2', year: 2568, term: 2, label: 'ภาคเรียนที่ 2 / 2568', short: 'S2 / 2568', current: false },
];
export const CURRENT_SEMESTER = '2569-1';

/** A1, R1, R3, R4 - the numbers every status colour is measured against. */
export const TARGETS = {
  passingScore: 70, // A1 - a student passes a subject at 70
  assessment: 82,   // R1 - % of students at or above the passing score
  behaviour: 88,    // R2 - class behaviour index
  observation: 4.0, // R3 - school standard for a teaching observation
  parent: 70,       // R4 - parent engagement index
  coaching: 3.5,    // R3 - below this a teacher enters a coaching cycle
};

/** R6 - one status scale, used by every screen. */
export const STATUS = {
  ok:    { key: 'ok',    label: 'On track', th: 'บนเป้า',   tone: 'success' },
  watch: { key: 'watch', label: 'Watch',    th: 'เฝ้าระวัง', tone: 'warning' },
  risk:  { key: 'risk',  label: 'At risk',  th: 'เสี่ยง',    tone: 'danger' },
};

/** S4 - the 8 learning areas of the Thai core curriculum. */
export const SUBJECTS = [
  { id: 'thai',    th: 'ภาษาไทย',                     en: 'Thai' },
  { id: 'math',    th: 'คณิตศาสตร์',                   en: 'Mathematics' },
  { id: 'science', th: 'วิทยาศาสตร์และเทคโนโลยี',       en: 'Science & Technology' },
  { id: 'social',  th: 'สังคมศึกษา ศาสนา และวัฒนธรรม', en: 'Social Studies' },
  { id: 'health',  th: 'สุขศึกษาและพลศึกษา',           en: 'Health & PE' },
  { id: 'art',     th: 'ศิลปะ',                        en: 'Arts' },
  { id: 'career',  th: 'การงานอาชีพ',                  en: 'Occupations' },
  { id: 'foreign', th: 'ภาษาต่างประเทศ',               en: 'Foreign Languages' },
];

/** S5 - behaviour incident categories. */
export const INCIDENT_TYPES = [
  { id: 'late',    th: 'มาสาย',       en: 'Late' },
  { id: 'absent',  th: 'ขาดเรียน',    en: 'Absent' },
  { id: 'uniform', th: 'แต่งกาย',     en: 'Uniform' },
  { id: 'fight',   th: 'ทะเลาะวิวาท', en: 'Fighting' },
  { id: 'other',   th: 'อื่น ๆ',       en: 'Other' },
];

/** R2 - penalty per incident level. Level 3 also triggers an action item (R7). */
export const INCIDENT_LEVELS = [
  { level: 1, th: 'เตือน',         en: 'Verbal warning',   penalty: 2 },
  { level: 2, th: 'บันทึก',        en: 'Logged',           penalty: 5 },
  { level: 3, th: 'เชิญผู้ปกครอง', en: 'Parent called in', penalty: 10 },
];

/** R2 - the index starts at 100 and recovers 1 point for every incident-free week. */
export const BEHAVIOUR_START = 100;
export const BEHAVIOUR_RECOVERY_PER_WEEK = 1;
export const TERM_WEEKS = 18;

/** A4, S5 - five observation topics, scored 1-5, two rounds per semester. */
export const OBSERVATION_TOPICS = [
  { id: 'plan',       th: 'แผนการสอน',                en: 'Lesson plan' },
  { id: 'media',      th: 'สื่อการสอน',                en: 'Teaching media' },
  { id: 'classroom',  th: 'การจัดการชั้นเรียน',        en: 'Classroom management' },
  { id: 'assessment', th: 'การวัดผล',                  en: 'Assessment' },
  { id: 'engagement', th: 'การมีส่วนร่วมของผู้เรียน',   en: 'Learner engagement' },
];
export const OBSERVATION_ROUNDS = [1, 2];

/** R4, Q3 - six parent channels and the agreed weights. Weights total 100. */
export const PARENT_CHANNELS = [
  { id: 'line_oa',    weight: 20, th: 'รับข่าวผ่าน Line OA',     en: 'Line OA opt-in' },
  { id: 'conference', weight: 25, th: 'มาประชุมผู้ปกครอง',        en: 'Conference attendance' },
  { id: 'homework',   weight: 20, th: 'เซ็นรับทราบการบ้าน',      en: 'Homework sign-off' },
  { id: 'fee',        weight: 15, th: 'ชำระค่าธรรมเนียมตรงเวลา', en: 'Fees paid on time' },
  { id: 'volunteer',  weight: 10, th: 'อาสาสมัครกิจกรรม',        en: 'Activity volunteer' },
  { id: 'survey',     weight: 10, th: 'ตอบแบบสอบถาม',            en: 'Survey response' },
];

/** S2 - three roles, three permission sets. */
export const ROLES = {
  director: {
    key: 'director', th: 'ผู้อำนวยการ', en: 'Director',
    sees: 'ทุกห้อง ทุกครู ทุกตัวชี้วัด',
    canAssignTasks: true, canCloseActionItems: true, canImport: false,
    canSeeAllObservations: true, canEditOthersRecords: false,
  },
  teacher: {
    key: 'teacher', th: 'ครู', en: 'Teacher',
    sees: 'เฉพาะห้องของตัวเองและคะแนนนิเทศของตัวเอง',
    canAssignTasks: false, canCloseActionItems: false, canImport: false,
    canSeeAllObservations: false, canEditOthersRecords: false,
  },
  staff: {
    key: 'staff', th: 'ธุรการ', en: 'Staff',
    sees: 'ข้อมูลหลักทั้งหมดและทะเบียนนักเรียน',
    canAssignTasks: false, canCloseActionItems: false, canImport: true,
    canSeeAllObservations: false, canEditOthersRecords: true,
  },
};

/** S6 - task status is derived (R8), never set by hand except marking it done. */
export const TASK_STATUS = {
  pending: { key: 'pending', th: 'ค้าง',      en: 'Pending', tone: 'info' },
  done:    { key: 'done',    th: 'เสร็จ',     en: 'Done',    tone: 'success' },
  overdue: { key: 'overdue', th: 'เลยกำหนด', en: 'Overdue', tone: 'danger' },
};

/** The five modules in the nav. Only 01 and 02 exist in the MVP. */
export const MODULES = [
  { no: '01', label: 'DASHBOARD',         path: '/',      live: true },
  { no: '02', label: 'TEACHER TASKS',     path: '/tasks', live: true },
  { no: '03', label: 'PROJECTS & BUDGET', path: null,     live: false },
  { no: '04', label: 'SLC & PLC',         path: null,     live: false },
  { no: '05', label: 'SEO & SOCIAL',      path: null,     live: false },
];

/**
 * The "This week" panel on S2. Calendar entries, not derived metrics — there is
 * no table behind them yet, so they stay a constant until Module 04 brings a
 * real schedule.
 */
export const WEEK_ITEMS = [
  { label: 'PLC circle · วง PLC ครูคณิตศาสตร์', when: 'พุธ 15:30' },
  { label: 'Observation round 2 opens · นิเทศรอบ 2', when: 'พฤหัสบดี' },
  { label: 'Parent conference ม.1-ม.3', when: 'เสาร์ 09:00' },
  { label: 'ปิดจุดตรวจที่ 4 · assessment checkpoint 4', when: '26 ก.ย.' },
];

/** Level filter on S2. */
export const LEVEL_FILTERS = [
  { id: 'all',     th: 'ทุกระดับชั้น', en: 'All levels' },
  { id: 'primary', th: 'ประถมศึกษา',  en: 'Primary' },
  { id: 'lower',   th: 'มัธยมศึกษา',   en: 'Secondary' },
];
