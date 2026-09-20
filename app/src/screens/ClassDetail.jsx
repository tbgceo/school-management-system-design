import { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp, useActions } from '../store/AppContext';
import { classMetrics, strugglingStudents, parentChannelRates, METRICS } from '../lib/rules';
import {
  CHECKPOINTS, INCIDENT_TYPES, INCIDENT_LEVELS, TARGETS, ROLES,
} from '../data/constants';
import { CHECKPOINT_DATES } from '../data/mockData';
import { metricText, targetText, thaiDate, stampDate, inputDate } from '../lib/format';
import { Card, CardLabel, Badge, Empty, Field, Notice } from '../components/Ui';

/**
 * One metric's checkpoint-by-checkpoint bars.
 *
 * Bar height is a shape indicator on a floored scale, the same treatment the design uses for
 * its sparklines - four checkpoints of a percentage that only moves a few points would be
 * indistinguishable on a zero baseline. Every bar carries its own value above it, and the
 * target sits under the chart, so nothing is read from height alone.
 */
function Trend({ series, metric }) {
  const points = series.filter((p) => p != null);
  const max = points.length ? Math.max(...points) : 1;
  const min = points.length ? Math.min(...points) : 0;
  const span = max - min || 1;

  return (
    <div>
      <div className="trend">
        {series.map((v, i) => (
          <div className="trend__col" key={i}>
            <span className="trend__value">{v == null ? '—' : metricText(v, metric)}</span>
            <span
              className={`trend__bar${v == null ? ' is-empty' : ''}`}
              style={{ height: v == null ? '10%' : `${30 + 62 * ((v - min) / span)}%` }}
            />
            <span className="trend__label">CP{CHECKPOINTS[i]}</span>
          </div>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 8 }}>
        เป้าหมาย {targetText(metric)} · แท่งแสดงทิศทางเทียบกันเอง ตัวเลขกำกับคือค่าจริง
      </p>
    </div>
  );
}

/** S3 - where every click from the dashboard lands. */
export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const { db, user, semesterId, asOf, openActionItems } = useApp();
  const { createTask } = useActions();
  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(inputDate(new Date(asOf.getTime() + 7 * 86400000)));

  const classroom = db.classrooms.find((c) => c.id === classId);

  const metrics = useMemo(
    () => (classroom ? classMetrics(db, classroom, semesterId, asOf) : null),
    [db, classroom, semesterId, asOf],
  );
  const struggling = useMemo(
    () => (classroom ? strugglingStudents(db, classroom.id, semesterId) : []),
    [db, classroom, semesterId],
  );
  const parents = useMemo(
    () => (classroom ? parentChannelRates(db, semesterId, classroom.id) : []),
    [db, classroom, semesterId],
  );

  if (!classroom) {
    return <div className="wrap page"><Empty>ไม่พบห้องเรียนนี้ · <Link to="/">กลับหน้า Dashboard</Link></Empty></div>;
  }

  // S2 permissions - a teacher can only open their own class.
  if (user.role === 'teacher' && classroom.homeroomTeacherId !== user.id) {
    return (
      <div className="wrap page">
        <Notice tone="warn">
          บทบาท <b>ครู</b> เปิดได้เฉพาะห้องที่ตัวเองเป็นครูประจำชั้น · <Link to="/">กลับหน้า Dashboard</Link>
        </Notice>
      </div>
    );
  }

  const incidents = db.behaviour
    .filter((b) => b.classroomId === classroom.id && b.semesterId === semesterId)
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
    .slice(0, 20);

  const classItems = openActionItems.filter((a) => a.classroomId === classroom.id);
  const keys = ['assessment', 'behaviour', 'observation', 'parent'];

  function submitTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    createTask({
      title: taskTitle.trim(),
      assigneeIds: [classroom.homeroomTeacherId],
      classroomId: classroom.id,
      dueDate: new Date(taskDue).toISOString(),
      source: 'manual',
      createdBy: user.id,
    });
    setTaskTitle('');
    setTaskOpen(false);
    navigate('/tasks');
  }

  return (
    <div className="wrap page">
      <Link className="crumb" to="/">← DASHBOARD</Link>

      <section className="detail__hero" style={{ marginTop: 14 }}>
        <span className="detail__glow" aria-hidden="true" />
        <div style={{ position: 'relative' }}>
          <span className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>
            MODULE 01 · CLASS DETAIL · {stampDate(asOf)}
          </span>
          <h1 className="detail__name" style={{ margin: '10px 0 8px' }}>{classroom.name}</h1>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,.72)' }}>
            ครูประจำชั้น {metrics.homeroom.nameTh} · {metrics.studentCount} นักเรียน · ดัชนีรวม {metrics.index}
          </span>

          <div className="detail__metrics">
            {keys.map((key) => (
              <div className="detail__metric" key={key}>
                <b>{metricText(metrics[key], METRICS[key])}</b>
                <i>{METRICS[key].label}</i>
                <span>
                  {METRICS[key].th} · target {targetText(METRICS[key])} · {metrics.statuses[key].th}
                </span>
                <span className="detail__rule" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {classItems.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Notice tone="warn">
            ห้องนี้มีรายการที่ต้องจัดการ {classItems.length} รายการ: {classItems.map((a) => a.titleTh).join(' · ')}
          </Notice>
        </div>
      )}

      <div className="cols2" style={{ marginBottom: 20 }}>
        {keys.map((key) => (
          <Card accent key={key}>
            <div className="row row--between">
              <CardLabel>{METRICS[key].label}</CardLabel>
              <Badge tone={metrics.statuses[key].tone}>{metrics.statuses[key].th}</Badge>
            </div>
            <span className="card__sub">{METRICS[key].th} · รายจุดตรวจของภาคเรียนนี้</span>
            <Trend series={metrics.series[key]} metric={METRICS[key]} />
          </Card>
        ))}
      </div>

      <div className="cols2">
        <Card>
          <CardLabel sub={`ต่ำกว่าเกณฑ์ผ่าน ${TARGETS.passingScore} คะแนน · ${struggling.length} คน`}>
            นักเรียนที่ต้องติดตาม
          </CardLabel>
          {struggling.length === 0 ? (
            <Empty>ไม่มีนักเรียนที่ต่ำกว่าเกณฑ์ในจุดตรวจล่าสุด</Empty>
          ) : struggling.slice(0, 12).map((s) => (
            <div className="list__row" key={s.student.id}>
              <span className="list__main">
                <b>{s.student.nameTh}</b>
                <span>รหัส {s.student.code} · ไม่ผ่าน {s.failedCheckpoints} จุดตรวจ</span>
              </span>
              <span className="mono" style={{ fontSize: 13 }}>{s.latestAvg.toFixed(0)}</span>
            </div>
          ))}
        </Card>

        <Card>
          <CardLabel sub="เรียงใหม่ไปเก่า · 20 รายการล่าสุด">ประวัติบันทึกพฤติกรรม</CardLabel>
          {incidents.length === 0 ? (
            <Empty>ยังไม่มีบันทึกพฤติกรรมในภาคเรียนนี้</Empty>
          ) : incidents.map((b) => {
            const type = INCIDENT_TYPES.find((t) => t.id === b.typeId);
            const lvl = INCIDENT_LEVELS.find((l) => l.level === b.level);
            const student = db.students.find((s) => s.id === b.studentId);
            return (
              <div className="list__row" key={b.id}>
                <span className="list__main">
                  <b>{student ? student.nameTh : '—'}</b>
                  <span>{type.th} · {thaiDate(b.occurredAt)}</span>
                </span>
                <Badge tone={b.level === 3 ? 'danger' : b.level === 2 ? 'warning' : 'neutral'}>
                  ระดับ {b.level} · {lvl.th}
                </Badge>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="cols2" style={{ marginTop: 20 }}>
        <Card>
          <CardLabel sub="หกช่องทางตามกฎ R4 · เฉพาะห้องนี้">การมีส่วนร่วมผู้ปกครอง</CardLabel>
          {parents.map((p) => (
            <div className="prow" key={p.channel.id}>
              <span className="prow__label">{p.channel.th} <span className="muted small">(น้ำหนัก {p.channel.weight}%)</span></span>
              <span className="prow__value">{p.rate.toFixed(0)}% · {p.count}/{p.of}</span>
            </div>
          ))}
        </Card>

        <Card variant="flat">
          <CardLabel sub="มอบหมายงานให้ครูประจำชั้นของห้องนี้">มอบหมายงาน</CardLabel>
          {!ROLES[user.role].canAssignTasks ? (
            <Empty>เฉพาะผู้อำนวยการเท่านั้นที่มอบหมายงานได้</Empty>
          ) : !taskOpen ? (
            <button type="button" className="btn btn--outline" onClick={() => setTaskOpen(true)}>
              + มอบหมายงานให้ {metrics.homeroom.nameTh}
            </button>
          ) : (
            <form className="form" onSubmit={submitTask}>
              <Field label="ชื่องาน" required hint="ไม่เกิน 120 ตัวอักษร">
                <input
                  className="input"
                  maxLength={120}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="เช่น ส่งแผนยกระดับผลสัมฤทธิ์คณิตศาสตร์"
                  required
                />
              </Field>
              <Field label="วันครบกำหนด" required hint="ห้ามย้อนหลัง">
                <input
                  className="input"
                  type="date"
                  min={inputDate(asOf)}
                  value={taskDue}
                  onChange={(e) => setTaskDue(e.target.value)}
                  required
                />
              </Field>
              <div className="form__actions">
                <button type="submit" className="btn btn--primary">มอบหมายงาน</button>
                <button type="button" className="btn btn--ghost" onClick={() => setTaskOpen(false)}>ยกเลิก</button>
              </div>
            </form>
          )}

          <div className="stack" style={{ marginTop: 18 }}>
            <Link className="btn btn--ghost" to={`/record/assessment?class=${classroom.id}`}>เปิดฟอร์มผลประเมิน</Link>
            <Link className="btn btn--ghost" to={`/record/behaviour?class=${classroom.id}`}>บันทึกพฤติกรรม</Link>
            <Link className="btn btn--ghost" to={`/record/parent?class=${classroom.id}`}>บันทึกการมีส่วนร่วมผู้ปกครอง</Link>
          </div>
        </Card>
      </div>

      <p className="small muted" style={{ marginTop: 20 }}>
        จุดตรวจของภาคเรียนนี้: {CHECKPOINT_DATES.map((d, i) => `CP${i + 1} ${thaiDate(d)}`).join(' · ')}
      </p>
    </div>
  );
}
