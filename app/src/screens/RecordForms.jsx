import { useMemo, useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp, useActions } from '../store/AppContext';
import { visibleClassrooms } from '../lib/rules';
import {
  SUBJECTS, CHECKPOINTS, INCIDENT_TYPES, INCIDENT_LEVELS,
  OBSERVATION_TOPICS, OBSERVATION_ROUNDS, PARENT_CHANNELS, TARGETS, ROLES,
} from '../data/constants';
import { Card, CardLabel, Field, Notice, Badge, Empty } from '../components/Ui';

const TABS = [
  { id: 'assessment',  label: 'ผลประเมิน',     screen: 'S4' },
  { id: 'behaviour',   label: 'พฤติกรรม',      screen: 'S5' },
  { id: 'observation', label: 'นิเทศการสอน',   screen: 'S5' },
  { id: 'parent',      label: 'ผู้ปกครอง',     screen: 'S5' },
];

/**
 * S4 and S5 share one shell: pick a context at the top, fill the middle, submit.
 * Mobile first - the roster collapses to a single column under 860px.
 */
export default function RecordForms() {
  const { kind = 'assessment' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { db, user, semesterId } = useApp();
  const actions = useActions();

  const classes = useMemo(() => visibleClassrooms(db, user, semesterId), [db, user, semesterId]);
  const initialClass = params.get('class') && classes.some((c) => c.id === params.get('class'))
    ? params.get('class')
    : (classes[0] ? classes[0].id : '');

  const [classId, setClassId] = useState(initialClass);
  useEffect(() => { if (!classes.some((c) => c.id === classId) && classes[0]) setClassId(classes[0].id); }, [classes, classId]);

  const classroom = classes.find((c) => c.id === classId);
  const roster = useMemo(
    () => db.students.filter((s) => s.classroomId === classId && s.semesterId === semesterId),
    [db.students, classId, semesterId],
  );

  const onBehalf = user.role === 'staff';

  if (!classes.length) {
    return <div className="wrap page"><Empty>บทบาทนี้ยังไม่มีห้องเรียนที่เข้าถึงได้</Empty></div>;
  }

  return (
    <div className="wrap page">
      <div className="page__head">
        <div className="page__titles">
          <span className="eyebrow">MODULE 01 · DATA ENTRY</span>
          <h1 className="page__title">บันทึกข้อมูล</h1>
          <span className="page__sub">
            ฟอร์มสี่ใบที่ป้อนตัวเลขให้ Dashboard · ทุกรายการเก็บว่าใครบันทึกและเมื่อไร
          </span>
        </div>
      </div>

      <div className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab${kind === t.id ? ' is-active' : ''}`}
            onClick={() => navigate(`/record/${t.id}${classId ? `?class=${classId}` : ''}`)}
          >
            {t.screen} · {t.label}
          </button>
        ))}
      </div>

      {onBehalf && (
        <div style={{ marginBottom: 18 }}>
          <Notice>
            คุณกำลังกรอกในบทบาท <b>ธุรการ</b> — ระบบจะบันทึกรายการนี้ว่าเป็น <b>การกรอกแทน</b> ครูประจำชั้น (Q2)
          </Notice>
        </div>
      )}

      {kind === 'assessment' && (
        <AssessmentForm
          classes={classes} classroom={classroom} classId={classId} setClassId={setClassId}
          roster={roster} user={user} onBehalf={onBehalf} actions={actions} db={db}
        />
      )}
      {kind === 'behaviour' && (
        <BehaviourForm
          classes={classes} classroom={classroom} classId={classId} setClassId={setClassId}
          roster={roster} user={user} actions={actions}
        />
      )}
      {kind === 'observation' && <ObservationForm db={db} user={user} actions={actions} />}
      {kind === 'parent' && (
        <ParentForm
          classes={classes} classroom={classroom} classId={classId} setClassId={setClassId}
          roster={roster} user={user} actions={actions} db={db}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * S4 - assessment
 * ---------------------------------------------------------------- */
function AssessmentForm({ classes, classroom, classId, setClassId, roster, user, onBehalf, actions, db }) {
  const [checkpoint, setCheckpoint] = useState(4);
  const [subjectId, setSubjectId] = useState(SUBJECTS[1].id);
  const [scores, setScores] = useState({});
  const [note, setNote] = useState('');

  // Load whatever is already on file for this class/checkpoint/subject.
  useEffect(() => {
    const existing = db.assessments.filter(
      (r) => r.classroomId === classId && r.checkpoint === Number(checkpoint) && r.subjectId === subjectId,
    );
    const next = {};
    existing.forEach((r) => { next[r.studentId] = String(r.score); });
    setScores(next);
  }, [db.assessments, classId, checkpoint, subjectId]);

  const filled = Object.values(scores).filter((v) => v !== '' && v != null).length;
  const failing = Object.values(scores).filter((v) => v !== '' && Number(v) < TARGETS.passingScore).length;

  function submit(e) {
    e.preventDefault();
    actions.submitAssessment({
      classroomId: classId,
      checkpoint: Number(checkpoint),
      subjectId,
      scores,
      note,
      teacherId: classroom.homeroomTeacherId,
      recordedBy: user.id,
    });
    setNote('');
  }

  return (
    <form className="stack stack--lg" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="กรอกคะแนนทั้งห้องในหนึ่งจุดตรวจ · ตั้งเป้าไม่เกิน 5 นาทีต่อห้อง">S4 · ฟอร์มผลประเมิน</CardLabel>
        <div className="form__grid">
          <Field label="ห้องเรียน" required>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="จุดตรวจ" required hint="สัปดาห์ที่ 4, 8, 12, 16">
            <select className="select" value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)}>
              {CHECKPOINTS.map((cp) => <option key={cp} value={cp}>จุดตรวจที่ {cp}</option>)}
            </select>
          </Field>
          <Field label="กลุ่มสาระ" required hint="8 กลุ่มสาระตามหลักสูตรแกนกลาง">
            <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {SUBJECTS.map((s) => <option key={s.id} value={s.id}>{s.th}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <div className="row row--between" style={{ marginBottom: 14 }}>
          <CardLabel sub={`${roster.length} คน · กรอกแล้ว ${filled} คน · ต่ำกว่าเกณฑ์ ${failing} คน`}>
            คะแนนรายนักเรียน
          </CardLabel>
          <Badge tone={filled === roster.length ? 'success' : 'warning'}>
            {filled === roster.length ? 'ครบทุกคน' : `เหลือ ${roster.length - filled} คน`}
          </Badge>
        </div>

        <div className="roster">
          {roster.map((s, i) => {
            const v = scores[s.id] ?? '';
            const low = v !== '' && Number(v) < TARGETS.passingScore;
            return (
              <div className="roster__row" key={s.id}>
                <span className="roster__no">{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="roster__name">{s.nameTh}</span>{' '}
                  <span className="roster__code">{s.code}</span>
                </span>
                <input
                  className="input roster__input"
                  type="number"
                  min={0}
                  max={100}
                  value={v}
                  placeholder="0-100"
                  onChange={(e) => setScores((prev) => ({ ...prev, [s.id]: e.target.value }))}
                />
                <span className="roster__flag">
                  {low ? <Badge tone="danger">ต่ำกว่า {TARGETS.passingScore}</Badge> : null}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <Card variant="flat">
        <Field label="หมายเหตุ" hint="ไม่เกิน 280 ตัวอักษร · ใช้อธิบายกรณีคะแนนตกผิดปกติ">
          <textarea className="textarea" rows={3} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <p className="form__note" style={{ marginTop: 12 }}>
          ผู้บันทึก: {user.nameTh}{onBehalf ? ' · บันทึกแทนครูประจำชั้น' : ''} · แก้ไขเองได้ภายใน 7 วัน (R9)
        </p>
        <div className="form__actions">
          <button type="submit" className="btn btn--primary">บันทึกและส่ง</button>
          <button type="button" className="btn btn--ghost" onClick={() => actions.toast({ kind: 'info', text: 'เก็บเป็นฉบับร่างแล้ว' })}>
            บันทึกร่าง
          </button>
        </div>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * S5 - behaviour
 * ---------------------------------------------------------------- */
function BehaviourForm({ classes, classroom, classId, setClassId, roster, user, actions }) {
  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState('');
  const [typeId, setTypeId] = useState(INCIDENT_TYPES[0].id);
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState('');

  const matches = roster.filter(
    (s) => s.nameTh.includes(query) || s.code.includes(query),
  ).slice(0, 8);

  function submit(e) {
    e.preventDefault();
    if (!studentId) return;
    actions.logBehaviour({
      classroomId: classId,
      studentId,
      typeId,
      level: Number(level),
      recordedBy: user.id,
      note: note || null,
    });
    setStudentId(''); setQuery(''); setNote('');
  }

  const chosen = roster.find((s) => s.id === studentId);

  return (
    <form className="form" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="บันทึกเหตุพฤติกรรมรายคน · หักคะแนนตามกฎ R2">S5 · ฟอร์มพฤติกรรม</CardLabel>
        <div className="form__grid">
          <Field label="ห้องเรียน" required>
            <select className="select" value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="ประเภทเหตุ" required>
            <select className="select" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {INCIDENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.th}</option>)}
            </select>
          </Field>
          <Field label="ระดับ" required hint="หักคะแนน 2 / 5 / 10 ตามระดับ">
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              {INCIDENT_LEVELS.map((l) => (
                <option key={l.level} value={l.level}>ระดับ {l.level} · {l.th} (−{l.penalty})</option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <Field label="นักเรียน" required hint="ค้นด้วยชื่อหรือเลขประจำตัว">
          <input
            className="input"
            value={chosen ? `${chosen.nameTh} · ${chosen.code}` : query}
            onChange={(e) => { setQuery(e.target.value); setStudentId(''); }}
            placeholder="พิมพ์ชื่อหรือรหัสนักเรียน"
          />
        </Field>
        {!chosen && query && (
          <div className="stack" style={{ marginTop: 10 }}>
            {matches.length === 0 && <span className="small muted">ไม่พบนักเรียนที่ตรงกับคำค้น</span>}
            {matches.map((s) => (
              <button
                key={s.id}
                type="button"
                className="btn btn--ghost"
                style={{ justifyContent: 'flex-start' }}
                onClick={() => { setStudentId(s.id); setQuery(''); }}
              >
                {s.nameTh} · {s.code}
              </button>
            ))}
          </div>
        )}
      </Card>

      <Card variant="flat">
        <Field label="บันทึกเพิ่มเติม">
          <textarea className="textarea" rows={3} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {Number(level) === 3 && (
          <div style={{ marginTop: 12 }}>
            <Notice tone="warn">ระดับ 3 จะสร้างรายการที่ต้องจัดการบน Dashboard โดยอัตโนมัติ (R7)</Notice>
          </div>
        )}
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={!studentId}>บันทึกเหตุ</button>
        </div>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * S5 - observation
 * ---------------------------------------------------------------- */
function ObservationForm({ db, user, actions }) {
  const teachers = db.teachers.filter((t) => t.role === 'teacher');
  const [teacherId, setTeacherId] = useState(teachers[0] ? teachers[0].id : '');
  const [round, setRound] = useState(2);
  const [scores, setScores] = useState(() => Object.fromEntries(OBSERVATION_TOPICS.map((t) => [t.id, 4])));
  const [note, setNote] = useState('');

  const values = OBSERVATION_TOPICS.map((t) => Number(scores[t.id]));
  const avg = values.reduce((a, b) => a + b, 0) / values.length;

  const allowed = ROLES[user.role].canSeeAllObservations || user.role === 'teacher';

  function submit(e) {
    e.preventDefault();
    actions.logObservation({
      teacherId,
      observerId: user.id,
      round: Number(round),
      scores: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, Number(v)])),
      note: note || null,
    });
    setNote('');
  }

  if (!allowed) return <Empty>บทบาทนี้ไม่มีสิทธิ์บันทึกผลนิเทศ</Empty>;

  return (
    <form className="form" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="ห้าหัวข้อ ระดับ 1-5 · สองรอบต่อภาคเรียน · ผู้นิเทศคือหัวหน้ากลุ่มสาระ">
          S5 · แบบนิเทศการสอน
        </CardLabel>
        <div className="form__grid">
          <Field label="ครูที่ถูกนิเทศ" required>
            <select className="select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.nameTh}</option>)}
            </select>
          </Field>
          <Field label="รอบนิเทศ" required>
            <select className="select" value={round} onChange={(e) => setRound(e.target.value)}>
              {OBSERVATION_ROUNDS.map((r) => <option key={r} value={r}>รอบที่ {r}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardLabel
          sub={`เฉลี่ยรอบนี้ ${avg.toFixed(1)} · เกณฑ์โรงเรียน ${TARGETS.observation.toFixed(1)} · คะแนน R3 เฉลี่ยจากทั้งสองรอบ`}
        >
          หัวข้อประเมิน
        </CardLabel>
        {OBSERVATION_TOPICS.map((t) => (
          <div className="list__row" key={t.id}>
            <span className="list__main">
              <b>{t.th}</b>
              <span>{t.en}</span>
            </span>
            <span className="row" style={{ gap: 4 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`btn btn--sm ${Number(scores[t.id]) === n ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setScores((prev) => ({ ...prev, [t.id]: n }))}
                >{n}</button>
              ))}
            </span>
          </div>
        ))}
        {avg < TARGETS.coaching && (
          <div style={{ marginTop: 14 }}>
            <Notice tone="warn">
              รอบนี้ต่ำกว่า {TARGETS.coaching} · ถ้าค่าเฉลี่ยทั้งสองรอบยังต่ำกว่าเกณฑ์
              ระบบจะสร้างรายการเข้ารอบโค้ชชิ่งให้อัตโนมัติ (R3, R7)
            </Notice>
          </div>
        )}
      </Card>

      <Card variant="flat">
        <Field label="ข้อสังเกตของผู้นิเทศ">
          <textarea className="textarea" rows={3} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="form__actions">
          <button type="submit" className="btn btn--primary">บันทึกผลนิเทศ</button>
        </div>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * S5 - parent engagement
 * ---------------------------------------------------------------- */
function ParentForm({ classes, classId, setClassId, roster, user, actions, db }) {
  const [studentId, setStudentId] = useState(roster[0] ? roster[0].id : '');
  useEffect(() => { setStudentId(roster[0] ? roster[0].id : ''); }, [roster]);

  const student = roster.find((s) => s.id === studentId);
  const guardianId = student ? student.guardianId : null;

  const [entries, setEntries] = useState({});
  useEffect(() => {
    if (!guardianId) return;
    const rows = db.parentEngagement.filter((r) => r.guardianId === guardianId);
    const next = Object.fromEntries(PARENT_CHANNELS.map((c) => [c.id, false]));
    rows.forEach((r) => { next[r.channelId] = r.done; });
    setEntries(next);
  }, [db.parentEngagement, guardianId]);

  const weighted = PARENT_CHANNELS.reduce((sum, c) => sum + (entries[c.id] ? c.weight : 0), 0);

  function submit(e) {
    e.preventDefault();
    if (!guardianId) return;
    actions.logParentEngagement({ classroomId: classId, guardianId, entries, recordedBy: user.id });
  }

  return (
    <form className="form" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="หกช่องทาง ถ่วงน้ำหนักตามกฎ R4 · หนึ่งผู้ปกครองต่อหนึ่งรอบ">
          S5 · การมีส่วนร่วมผู้ปกครอง
        </CardLabel>
        <div className="form__grid">
          <Field label="ห้องเรียน" required>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="นักเรียน / ผู้ปกครอง" required>
            <select className="select" value={studentId} onChange={(e) => setStudentId(e.target.value)}>
              {roster.map((s) => <option key={s.id} value={s.id}>{s.nameTh} · {s.code}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <Card>
        <CardLabel sub={`ดัชนีของผู้ปกครองรายนี้ ${weighted} จาก 100`}>ช่องทางที่ทำแล้ว</CardLabel>
        {PARENT_CHANNELS.map((c) => (
          <label className="list__row" key={c.id} style={{ cursor: 'pointer' }}>
            <span className="list__main">
              <b>{c.th}</b>
              <span>{c.en} · น้ำหนัก {c.weight}%</span>
            </span>
            <input
              className="checkbox"
              type="checkbox"
              checked={!!entries[c.id]}
              onChange={(e) => setEntries((prev) => ({ ...prev, [c.id]: e.target.checked }))}
            />
          </label>
        ))}
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={!guardianId}>บันทึก</button>
        </div>
      </Card>
    </form>
  );
}
