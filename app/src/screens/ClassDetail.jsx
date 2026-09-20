import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { METRICS } from '../lib/rules';
import { CHECKPOINTS, ROLES } from '../data/constants';
import { loadStruggling } from '../lib/api';
import { metricText, targetText, thaiDate, inputDate } from '../lib/format';
import { Card, CardLabel, Badge, Empty, Field, Notice } from '../components/Ui';

/**
 * One metric's checkpoint-by-checkpoint bars, from class_metric_series().
 *
 * Bar height is a shape indicator on a floored scale, the same treatment the
 * design uses for its sparklines. Every bar carries its value above it and the
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

/** S3 — where every click from the dashboard lands. */
export default function ClassDetail() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const {
    rows, behaviour, students, incidentTypes, incidentLevels, parentRates,
    parentChannels, targets, openActionItems, user, createTask,
  } = useApp();

  const [taskOpen, setTaskOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDue, setTaskDue] = useState(inputDate(new Date(Date.now() + 7 * 86400000)));
  const [struggling, setStruggling] = useState([]);

  const metrics = rows.find((r) => r.classroom.id === classId);

  // v_struggling_students is per class and only needed on this screen, so it is
  // fetched here rather than loaded with the workspace.
  useEffect(() => {
    let live = true;
    if (classId) loadStruggling(classId).then((s) => { if (live) setStruggling(s); }).catch(() => {});
    return () => { live = false; };
  }, [classId]);

  const metricDefs = useMemo(() => Object.fromEntries(
    Object.entries(METRICS).map(([key, m]) => [key, { ...m, target: targets[key] ?? m.target }]),
  ), [targets]);

  if (!metrics) {
    return (
      <div className="wrap page">
        <Notice tone="warn">
          ไม่พบห้องเรียนนี้ หรือบทบาทของคุณไม่มีสิทธิ์เปิด — RLS เป็นผู้ตัดสิน ไม่ใช่หน้าจอ ·{' '}
          <Link to="/">กลับหน้า Dashboard</Link>
        </Notice>
      </div>
    );
  }

  const incidents = behaviour.filter((b) => b.classroomId === classId).slice(0, 20);
  const classItems = openActionItems.filter((a) => a.classroomId === classId);
  const channels = parentRates.filter((r) => r.classroom_id === classId);
  const keys = ['assessment', 'behaviour', 'observation', 'parent'];

  async function submitTask(e) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    const ok = await createTask({
      title: taskTitle.trim(),
      classroomId: classId,
      dueDate: taskDue,
      assigneeIds: [metrics.classroom.homeroomTeacherId],
    });
    if (ok) {
      setTaskTitle('');
      setTaskOpen(false);
      navigate('/tasks');
    }
  }

  return (
    <div className="wrap page">
      <Link className="crumb" to="/">← DASHBOARD</Link>

      <section className="detail__hero" style={{ marginTop: 14 }}>
        <span className="detail__glow" aria-hidden="true" />
        <div style={{ position: 'relative' }}>
          <span className="eyebrow" style={{ color: 'rgba(255,255,255,.6)' }}>
            MODULE 01 · CLASS DETAIL
          </span>
          <h1 className="detail__name" style={{ margin: '10px 0 8px' }}>{metrics.classroom.name}</h1>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,.72)' }}>
            ครูประจำชั้น {metrics.homeroom.nameTh} · {metrics.studentCount} นักเรียน · ดัชนีรวม {metrics.index}
          </span>

          <div className="detail__metrics">
            {keys.map((key) => (
              <div className="detail__metric" key={key}>
                <b>{metricText(metrics[key], metricDefs[key])}</b>
                <i>{metricDefs[key].label}</i>
                <span>
                  {metricDefs[key].th} · target {targetText(metricDefs[key])} · {metrics.statuses[key].th}
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
              <CardLabel>{metricDefs[key].label}</CardLabel>
              <Badge tone={metrics.statuses[key].tone}>{metrics.statuses[key].th}</Badge>
            </div>
            <span className="card__sub">{metricDefs[key].th} · รายจุดตรวจของภาคเรียนนี้</span>
            <Trend series={metrics.series[key]} metric={metricDefs[key]} />
          </Card>
        ))}
      </div>

      <div className="cols2">
        <Card>
          <CardLabel sub={`ต่ำกว่าเกณฑ์ผ่าน ${targets.passing_score ?? 70} คะแนน · ${struggling.length} คน`}>
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
            const type = incidentTypes.find((t) => t.id === b.typeId);
            const lvl = incidentLevels.find((l) => l.level === b.level);
            const student = students.find((s) => s.id === b.studentId);
            return (
              <div className="list__row" key={b.id}>
                <span className="list__main">
                  <b>{student ? student.nameTh : '—'}</b>
                  <span>{type?.th} · {thaiDate(b.occurredAt)}</span>
                </span>
                <Badge tone={b.level === 3 ? 'danger' : b.level === 2 ? 'warning' : 'neutral'}>
                  ระดับ {b.level} · {lvl?.th}
                </Badge>
              </div>
            );
          })}
        </Card>
      </div>

      <div className="cols2" style={{ marginTop: 20 }}>
        <Card>
          <CardLabel sub="หกช่องทางตามกฎ R4 · เฉพาะห้องนี้">การมีส่วนร่วมผู้ปกครอง</CardLabel>
          {channels.length === 0 ? <Empty>ยังไม่มีข้อมูล</Empty> : channels
            .slice()
            .sort((a, b) => (parentChannels.findIndex((c) => c.id === a.channel_id))
              - (parentChannels.findIndex((c) => c.id === b.channel_id)))
            .map((p) => (
              <div className="prow" key={p.channel_id}>
                <span className="prow__label">
                  {p.name_th} <span className="muted small">(น้ำหนัก {p.weight}%)</span>
                </span>
                <span className="prow__value">
                  {Math.round(Number(p.rate_pct))}% · {p.done_count}/{p.guardian_count}
                </span>
              </div>
            ))}
        </Card>

        <Card variant="flat">
          <CardLabel sub="มอบหมายงานให้ครูประจำชั้นของห้องนี้">มอบหมายงาน</CardLabel>
          {!user || !ROLES[user.role].canAssignTasks ? (
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
                  min={inputDate(new Date())}
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
            <Link className="btn btn--ghost" to={`/record/assessment?class=${classId}`}>เปิดฟอร์มผลประเมิน</Link>
            <Link className="btn btn--ghost" to={`/record/behaviour?class=${classId}`}>บันทึกพฤติกรรม</Link>
            <Link className="btn btn--ghost" to={`/record/parent?class=${classId}`}>บันทึกการมีส่วนร่วมผู้ปกครอง</Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
