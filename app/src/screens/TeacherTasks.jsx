import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp, useActions } from '../store/AppContext';
import { visibleTasks, taskStatus, visibleClassrooms } from '../lib/rules';
import { TASK_STATUS, ROLES } from '../data/constants';
import { thaiDate, inputDate, daysBetween } from '../lib/format';
import { Card, CardLabel, Badge, Field, Empty, Notice } from '../components/Ui';

/** S6 - Module 02 in its MVP form. Status is derived by R8; teachers only tick "done". */
export default function TeacherTasks() {
  const { db, user, semesterId, asOf } = useApp();
  const { createTask, toggleTaskDone } = useActions();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [assignees, setAssignees] = useState([]);
  const [classId, setClassId] = useState('');
  const [due, setDue] = useState(inputDate(new Date(asOf.getTime() + 7 * 86400000)));

  const tasks = useMemo(() => visibleTasks(db, user, semesterId), [db, user, semesterId]);
  const withStatus = useMemo(
    () => tasks.map((t) => ({ task: t, status: taskStatus(t, asOf) }))
      .sort((a, b) => new Date(a.task.dueDate) - new Date(b.task.dueDate)),
    [tasks, asOf],
  );

  const shown = filter === 'all' ? withStatus : withStatus.filter((t) => t.status.key === filter);
  const counts = Object.keys(TASK_STATUS).reduce((acc, k) => {
    acc[k] = withStatus.filter((t) => t.status.key === k).length;
    return acc;
  }, {});

  const teachers = db.teachers.filter((t) => t.role === 'teacher');
  const classes = visibleClassrooms(db, user, semesterId);

  function submit(e) {
    e.preventDefault();
    if (!title.trim() || !assignees.length) return;
    createTask({
      title: title.trim(),
      assigneeIds: assignees,
      classroomId: classId || null,
      dueDate: new Date(due).toISOString(),
      source: 'manual',
      createdBy: user.id,
    });
    setTitle(''); setAssignees([]); setClassId(''); setOpen(false);
  }

  return (
    <div className="wrap page">
      <div className="page__head">
        <div className="page__titles">
          <span className="eyebrow">MODULE 02 · TEACHER TASKS</span>
          <h1 className="page__title">งานของครู</h1>
          <span className="page__sub">
            {user.role === 'teacher' ? 'งานที่มอบหมายให้คุณ' : 'มอบหมายงาน ติดตามสถานะ และปิดงาน'} ·
            สถานะคำนวณจากวันครบกำหนดตามกฎ R8
          </span>
        </div>
        <div className="page__tools">
          {ROLES[user.role].canAssignTasks && (
            <button type="button" className="btn btn--primary" onClick={() => setOpen((v) => !v)}>
              {open ? 'ปิดฟอร์ม' : '+ มอบหมายงาน'}
            </button>
          )}
        </div>
      </div>

      {open && (
        <Card accent style={{ marginBottom: 22 }}>
          <CardLabel sub="ผู้รับผิดชอบรายคนหรือหลายคน · วันครบกำหนดห้ามย้อนหลัง">มอบหมายงานใหม่</CardLabel>
          <form className="form" onSubmit={submit}>
            <Field label="ชื่องาน" required hint="ไม่เกิน 120 ตัวอักษร">
              <input className="input" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} required />
            </Field>

            <Field label="ผู้รับผิดชอบ" required hint="กด Ctrl หรือ Cmd เพื่อเลือกหลายคน">
              <select
                className="select"
                multiple
                size={6}
                style={{ height: 'auto', padding: 8 }}
                value={assignees}
                onChange={(e) => setAssignees(Array.from(e.target.selectedOptions, (o) => o.value))}
              >
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.nameTh}</option>)}
              </select>
            </Field>

            <div className="form__grid">
              <Field label="ห้องเรียนที่เกี่ยวข้อง" hint="ไม่บังคับ">
                <select className="select" value={classId} onChange={(e) => setClassId(e.target.value)}>
                  <option value="">— ไม่ระบุ —</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="วันครบกำหนด" required>
                <input className="input" type="date" min={inputDate(asOf)} value={due} onChange={(e) => setDue(e.target.value)} required />
              </Field>
            </div>

            <div className="form__actions">
              <button type="submit" className="btn btn--primary">มอบหมายงาน</button>
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>ยกเลิก</button>
            </div>
          </form>
        </Card>
      )}

      <div className="tabs">
        <button type="button" className={`tab${filter === 'all' ? ' is-active' : ''}`} onClick={() => setFilter('all')}>
          ทั้งหมด · {withStatus.length}
        </button>
        {Object.values(TASK_STATUS).map((s) => (
          <button
            key={s.key}
            type="button"
            className={`tab${filter === s.key ? ' is-active' : ''}`}
            onClick={() => setFilter(s.key)}
          >
            {s.th} · {counts[s.key]}
          </button>
        ))}
      </div>

      {counts.overdue > 0 && filter === 'all' && (
        <div style={{ marginBottom: 18 }}>
          <Notice tone="warn">
            มีงานเลยกำหนด {counts.overdue} รายการ · งานที่ค้างจะแสดงบน Dashboard ด้วย
          </Notice>
        </div>
      )}

      <div className="panel">
        {shown.length === 0 ? (
          <Empty>ไม่มีงานในตัวกรองนี้</Empty>
        ) : shown.map(({ task, status }) => {
          const assigned = task.assigneeIds.map((id) => db.teachers.find((t) => t.id === id)).filter(Boolean);
          const cls = task.classroomId ? db.classrooms.find((c) => c.id === task.classroomId) : null;
          const days = daysBetween(task.dueDate, asOf);
          const mine = task.assigneeIds.includes(user.id);

          return (
            <div className="task" key={task.id}>
              <input
                className="checkbox"
                type="checkbox"
                checked={!!task.completedAt}
                disabled={!(mine || user.role === 'director')}
                onChange={() => toggleTaskDone(task.id)}
                aria-label={`ทำเครื่องหมายว่า ${task.title} เสร็จแล้ว`}
              />

              <div style={{ minWidth: 0 }}>
                <div className="task__title">{task.title}</div>
                <div className="task__meta">
                  {assigned.map((t) => t.nameTh).join(', ')}
                  {cls && <> · <Link to={`/class/${cls.id}`}>{cls.name}</Link></>}
                  {task.source === 'action_item' && <> · มาจากรายการที่ต้องจัดการ</>}
                  {task.attachments.length > 0 && <> · แนบ {task.attachments.length} ไฟล์</>}
                </div>
              </div>

              <span className="task__due">
                {thaiDate(task.dueDate)}
                <br />
                <span className="muted small">
                  {task.completedAt
                    ? `เสร็จ ${thaiDate(task.completedAt)}`
                    : days === 0 ? 'ครบกำหนดวันนี้' : days > 0 ? `อีก ${days} วัน` : `เลยมา ${Math.abs(days)} วัน`}
                </span>
              </span>

              <span className="right">
                <Badge tone={status.tone}>{status.th}</Badge>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
