import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { CHECKPOINTS, OBSERVATION_ROUNDS, ROLES } from '../data/constants';
import { loadMarks, loadParentEntries } from '../lib/api';
import { Card, CardLabel, Field, Notice, Badge, Empty } from '../components/Ui';

const TABS = [
  { id: 'assessment', label: 'ผลประเมิน', screen: 'S4' },
  { id: 'behaviour', label: 'พฤติกรรม', screen: 'S5' },
  { id: 'observation', label: 'นิเทศการสอน', screen: 'S5' },
  { id: 'parent', label: 'ผู้ปกครอง', screen: 'S5' },
];

/**
 * S4 and S5 share one shell: pick a context at the top, fill the middle, submit.
 *
 * The class list is whatever RLS returned — a teacher sees one entry in the
 * dropdown because the database sent one row, not because the UI filtered it.
 */
export default function RecordForms() {
  const { kind = 'assessment' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const app = useApp();
  const { classrooms, students, user } = app;

  const initial = params.get('class') && classrooms.some((c) => c.id === params.get('class'))
    ? params.get('class')
    : (classrooms[0]?.id ?? '');

  const [classId, setClassId] = useState(initial);
  useEffect(() => {
    if (!classrooms.some((c) => c.id === classId) && classrooms[0]) setClassId(classrooms[0].id);
  }, [classrooms, classId]);

  const classroom = classrooms.find((c) => c.id === classId);
  const roster = useMemo(
    () => students.filter((s) => s.classroomId === classId).sort((a, b) => a.code.localeCompare(b.code)),
    [students, classId],
  );

  const onBehalf = user?.role === 'staff';

  if (!classrooms.length) {
    return <div className="wrap page"><Empty>บทบาทนี้ยังไม่มีห้องเรียนที่เข้าถึงได้</Empty></div>;
  }

  const shared = { app, classrooms, classroom, classId, setClassId, roster, user };

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
            โดย <code>on_behalf</code> เป็นคอลัมน์ที่ฐานข้อมูลคำนวณเอง
          </Notice>
        </div>
      )}

      {kind === 'assessment' && <AssessmentForm {...shared} />}
      {kind === 'behaviour' && <BehaviourForm {...shared} />}
      {kind === 'observation' && <ObservationForm app={app} user={user} />}
      {kind === 'parent' && <ParentForm {...shared} />}
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * S4 — assessment
 * ---------------------------------------------------------------- */
function AssessmentForm({ app, classrooms, classroom, classId, setClassId, roster, user }) {
  const { subjects, targets } = app;
  const [checkpoint, setCheckpoint] = useState(4);
  const [subjectId, setSubjectId] = useState(subjects[1]?.id ?? subjects[0]?.id ?? '');
  const [scores, setScores] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!subjectId && subjects[0]) setSubjectId(subjects[0].id); }, [subjects, subjectId]);

  // Whatever is already on file for this class, checkpoint and subject.
  useEffect(() => {
    let live = true;
    if (classId && subjectId) {
      loadMarks(classId, Number(checkpoint), subjectId)
        .then((m) => { if (live) setScores(m); })
        .catch(() => { if (live) setScores({}); });
    }
    return () => { live = false; };
  }, [classId, checkpoint, subjectId]);

  const pass = targets.passing_score ?? 70;
  const filled = Object.values(scores).filter((v) => v !== '' && v != null).length;
  const failing = Object.values(scores).filter((v) => v !== '' && Number(v) < pass).length;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    await app.submitMarks({
      classroomId: classId,
      teacherId: classroom.homeroomTeacherId,
      checkpoint: Number(checkpoint),
      subjectId,
      scores,
      note,
    });
    setBusy(false);
    setNote('');
  }

  return (
    <form className="stack stack--lg" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="กรอกคะแนนทั้งห้องในหนึ่งจุดตรวจ · ตั้งเป้าไม่เกิน 5 นาทีต่อห้อง">S4 · ฟอร์มผลประเมิน</CardLabel>
        <div className="form__grid">
          <Field label="ห้องเรียน" required>
            <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="จุดตรวจ" required hint="สัปดาห์ที่ 4, 8, 12, 16">
            <select className="select" value={checkpoint} onChange={(e) => setCheckpoint(e.target.value)}>
              {CHECKPOINTS.map((cp) => <option key={cp} value={cp}>จุดตรวจที่ {cp}</option>)}
            </select>
          </Field>
          <Field label="กลุ่มสาระ" required hint="8 กลุ่มสาระตามหลักสูตรแกนกลาง">
            <select className="select" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.th}</option>)}
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
            const low = v !== '' && Number(v) < pass;
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
                  {low ? <Badge tone="danger">ต่ำกว่า {pass}</Badge> : null}
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
          ผู้บันทึก: {user?.nameTh} · แก้ไขเองได้ภายใน 7 วัน หลังจากนั้นต้องให้ธุรการแก้ (R9 บังคับด้วย trigger)
        </p>
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'กำลังบันทึก…' : 'บันทึกและส่ง'}
          </button>
        </div>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * S5 — behaviour
 * ---------------------------------------------------------------- */
function BehaviourForm({ app, classrooms, classId, setClassId, roster }) {
  const { incidentTypes, incidentLevels } = app;
  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState('');
  const [typeId, setTypeId] = useState('');
  const [level, setLevel] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!typeId && incidentTypes[0]) setTypeId(incidentTypes[0].id); }, [incidentTypes, typeId]);

  const matches = roster.filter((s) => s.nameTh.includes(query) || s.code.includes(query)).slice(0, 8);
  const chosen = roster.find((s) => s.id === studentId);

  async function submit(e) {
    e.preventDefault();
    if (!studentId) return;
    setBusy(true);
    const ok = await app.logBehaviour({
      classroomId: classId, studentId, typeId, level: Number(level), note,
    });
    setBusy(false);
    if (ok) { setStudentId(''); setQuery(''); setNote(''); }
  }

  return (
    <form className="form" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="บันทึกเหตุพฤติกรรมรายคน · หักคะแนนตามกฎ R2">S5 · ฟอร์มพฤติกรรม</CardLabel>
        <div className="form__grid">
          <Field label="ห้องเรียน" required>
            <select className="select" value={classId} onChange={(e) => { setClassId(e.target.value); setStudentId(''); }}>
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="ประเภทเหตุ" required>
            <select className="select" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
              {incidentTypes.map((t) => <option key={t.id} value={t.id}>{t.th}</option>)}
            </select>
          </Field>
          <Field label="ระดับ" required hint="หักคะแนนตามระดับ">
            <select className="select" value={level} onChange={(e) => setLevel(e.target.value)}>
              {incidentLevels.map((l) => (
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
            <Notice tone="warn">ระดับ 3 จะถูกหยิบขึ้น Dashboard เป็นรายการที่ต้องจัดการรอบถัดไป (R7)</Notice>
          </div>
        )}
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={!studentId || busy}>
            {busy ? 'กำลังบันทึก…' : 'บันทึกเหตุ'}
          </button>
        </div>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * S5 — observation
 * ---------------------------------------------------------------- */
function ObservationForm({ app, user }) {
  const { teachers, observationTopics, targets } = app;
  const pool = teachers.filter((t) => t.role === 'teacher' && t.id !== user?.id);
  const [teacherId, setTeacherId] = useState('');
  const [round, setRound] = useState(2);
  const [scores, setScores] = useState({});
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!teacherId && pool[0]) setTeacherId(pool[0].id); }, [pool, teacherId]);
  useEffect(() => {
    if (observationTopics.length && Object.keys(scores).length === 0) {
      setScores(Object.fromEntries(observationTopics.map((t) => [t.id, 4])));
    }
  }, [observationTopics, scores]);

  const values = observationTopics.map((t) => Number(scores[t.id] ?? 4));
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  // Only a department head may insert an observation; the policy enforces it.
  if (!user?.isDepartmentHead) {
    return (
      <Notice tone="warn">
        เฉพาะ <b>หัวหน้ากลุ่มสาระ</b> เท่านั้นที่บันทึกผลนิเทศได้ (A4) · ฐานข้อมูลปฏิเสธการเขียนจากบัญชีอื่น
      </Notice>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    const ok = await app.logObservation({ teacherId, round: Number(round), scores, note });
    setBusy(false);
    if (ok) setNote('');
  }

  return (
    <form className="form" onSubmit={submit}>
      <Card accent>
        <CardLabel sub="ห้าหัวข้อ ระดับ 1-5 · สองรอบต่อภาคเรียน · ผู้นิเทศคือหัวหน้ากลุ่มสาระ">
          S5 · แบบนิเทศการสอน
        </CardLabel>
        <div className="form__grid">
          <Field label="ครูที่ถูกนิเทศ" required>
            <select className="select" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              {pool.map((t) => <option key={t.id} value={t.id}>{t.nameTh}</option>)}
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
          sub={`เฉลี่ยรอบนี้ ${avg.toFixed(1)} · เกณฑ์โรงเรียน ${(targets.observation ?? 4).toFixed(1)} · คะแนน R3 เฉลี่ยจากทั้งสองรอบ`}
        >
          หัวข้อประเมิน
        </CardLabel>
        {observationTopics.map((t) => (
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
      </Card>

      <Card variant="flat">
        <Field label="ข้อสังเกตของผู้นิเทศ">
          <textarea className="textarea" rows={3} maxLength={280} value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        <div className="form__actions">
          <button type="submit" className="btn btn--primary" disabled={busy}>
            {busy ? 'กำลังบันทึก…' : 'บันทึกผลนิเทศ'}
          </button>
        </div>
      </Card>
    </form>
  );
}

/* ---------------------------------------------------------------- *
 * S5 — parent engagement
 * ---------------------------------------------------------------- */
function ParentForm({ app, classrooms, classId, setClassId, roster }) {
  const { parentChannels } = app;
  const [studentId, setStudentId] = useState('');
  const [guardianId, setGuardianId] = useState(null);
  const [entries, setEntries] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => { setStudentId(roster[0]?.id ?? ''); }, [roster]);

  useEffect(() => {
    let live = true;
    if (!studentId) return undefined;
    loadParentEntries(studentId).then((r) => {
      if (!live) return;
      setGuardianId(r.guardianId);
      setEntries(Object.fromEntries(parentChannels.map((c) => [c.id, Boolean(r.entries[c.id])])));
    }).catch(() => {});
    return () => { live = false; };
  }, [studentId, parentChannels]);

  const weighted = parentChannels.reduce((sum, c) => sum + (entries[c.id] ? c.weight : 0), 0);

  async function submit(e) {
    e.preventDefault();
    if (!guardianId) return;
    setBusy(true);
    await app.saveParentEngagement({ classroomId: classId, guardianId, entries });
    setBusy(false);
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
              {classrooms.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
        {parentChannels.map((c) => (
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
          <button type="submit" className="btn btn--primary" disabled={!guardianId || busy}>
            {busy ? 'กำลังบันทึก…' : 'บันทึก'}
          </button>
        </div>
      </Card>
    </form>
  );
}
