import { useMemo, useState } from 'react';
import { useApp, useActions } from '../store/AppContext';
import {
  allClassMetrics, schoolMetrics, observationBands, parentChannelRates, visibleClassrooms, METRICS,
} from '../lib/rules';
import { SEMESTERS, LEVEL_FILTERS, TARGETS, ROLES } from '../data/constants';
import { WEEK_ITEMS } from '../data/mockData';
import { stampDate, metricText } from '../lib/format';
import { Card, CardLabel, Notice } from '../components/Ui';
import KpiCard from '../components/KpiCard';
import ClassTable from '../components/ClassTable';
import MatrixTable, { MATRIX_LEGEND } from '../components/MatrixTable';
import ActionItemList from '../components/ActionItemList';

/** S2 - the director's landing screen. Four indicators, every class, and what needs deciding. */
export default function Dashboard() {
  const { db, user, semesterId, level, asOf, openActionItems, school } = useApp();
  const { setSemester, setLevel } = useActions();
  const [view, setView] = useState('table');

  const semester = SEMESTERS.find((s) => s.id === semesterId);

  // A teacher only ever sees their own classes (S2 permissions).
  const allowed = useMemo(() => visibleClassrooms(db, user, semesterId), [db, user, semesterId]);
  const rows = useMemo(
    () => allClassMetrics(db, semesterId, level, asOf).filter((r) => allowed.some((c) => c.id === r.classroom.id)),
    [db, semesterId, level, asOf, allowed],
  );

  const kpis = useMemo(() => schoolMetrics(rows), [rows]);
  const bands = useMemo(() => observationBands(db, semesterId, asOf), [db, semesterId, asOf]);
  const parents = useMemo(() => parentChannelRates(db, semesterId), [db, semesterId]);

  const visibleIds = new Set(rows.map((r) => r.classroom.id));
  const items = openActionItems.filter((a) => !a.classroomId || visibleIds.has(a.classroomId));

  const studentTotal = rows.reduce((sum, r) => sum + r.studentCount, 0);
  const teacherTotal = db.teachers.filter((t) => t.role === 'teacher').length;

  function exportCsv() {
    const header = ['Class', 'Homeroom', 'Students', 'Assessment', 'Behaviour', 'Observation', 'ParentEngagement', 'Index', 'Status'];
    const body = rows.map((r) => [
      r.classroom.name, r.homeroom.nameTh, r.studentCount,
      metricText(r.assessment, METRICS.assessment),
      metricText(r.behaviour, METRICS.behaviour),
      metricText(r.observation, METRICS.observation),
      metricText(r.parent, METRICS.parent),
      r.index, r.status.label,
    ]);
    const csv = [header, ...body].map((line) => line.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `class-performance-${semesterId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="wrap page">
      <div className="page__head">
        <div className="page__titles">
          <span className="eyebrow">MODULE 01 · SCHOOL PERFORMANCE</span>
          <h1 className="page__title">School at a glance</h1>
          <span className="page__sub">
            ภาพรวมผลการดำเนินงานของ{school.nameTh} · {semester.label}
          </span>
        </div>

        <div className="page__tools">
          <select
            className="btn btn--outline"
            value={semesterId}
            onChange={(e) => setSemester(e.target.value)}
            aria-label="ภาคเรียน"
          >
            {SEMESTERS.map((s) => <option key={s.id} value={s.id}>{s.short}</option>)}
          </select>

          <select className="select" value={level} onChange={(e) => setLevel(e.target.value)} aria-label="ระดับชั้น">
            {LEVEL_FILTERS.map((l) => <option key={l.id} value={l.id}>{l.en} · {l.th}</option>)}
          </select>

          <button type="button" className="btn btn--ghost" onClick={() => window.print()}>พิมพ์ PDF</button>
          <button type="button" className="btn btn--primary" onClick={exportCsv}>EXPORT</button>
        </div>
      </div>

      {user.role === 'teacher' && (
        <div style={{ marginBottom: 20 }}>
          <Notice>
            คุณเข้าใช้งานในบทบาท <b>ครู</b> · {ROLES.teacher.sees} — ตัวเลขด้านล่างคิดจากห้องของคุณเท่านั้น
          </Notice>
        </div>
      )}

      {rows.length === 0 && (
        <Notice tone="warn">
          ภาคเรียนนี้ยังไม่มีข้อมูลในชุดตัวอย่าง · เลือก S1 / 2569 เพื่อดูข้อมูลเต็ม
        </Notice>
      )}

      <div className="kpis">
        {kpis.map((k) => (
          <KpiCard key={k.metric.key} metric={k.metric} value={k.value} series={k.series} status={k.status} />
        ))}
      </div>

      <div className="dash">
        <div className="stack stack--lg">
          <div className="panel">
            <div className="panel__head">
              <div className="panel__titles">
                <span className="panel__title">
                  {view === 'table' ? 'Performance by class' : 'Class × metric'}
                </span>
                <span className="panel__sub">
                  ผลการดำเนินงานรายชั้นเรียน · {rows.length} ห้องเรียน · {studentTotal} นักเรียน · {teacherTotal} ครู
                </span>
              </div>
              <div className="row" style={{ gap: 6 }}>
                <button
                  type="button"
                  className={`btn btn--sm ${view === 'table' ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setView('table')}
                >TABLE</button>
                <button
                  type="button"
                  className={`btn btn--sm ${view === 'matrix' ? 'btn--primary' : 'btn--ghost'}`}
                  onClick={() => setView('matrix')}
                >MATRIX</button>
              </div>
            </div>

            {view === 'table' ? <ClassTable rows={rows} /> : <MatrixTable rows={rows} />}

            <div className="panel__foot row row--between">
              <span>
                {view === 'matrix' ? (
                  <span className="legend">
                    <span className="eyebrow" style={{ letterSpacing: '0.16em' }}>SCALE</span>
                    {MATRIX_LEGEND.map((l) => (
                      <span key={l.label} className="legend__item">
                        <span className="legend__swatch" style={l.style} />{l.label}
                      </span>
                    ))}
                  </span>
                ) : 'คลิกที่แถวเพื่อเปิดหน้ารายห้อง'}
              </span>
              <span className="panel__stamp">UPDATED {stampDate(asOf, true)}</span>
            </div>
          </div>

          <div className="stack">
            <div className="row" style={{ gap: 12, alignItems: 'baseline' }}>
              <span className="section-title">Needs a decision</span>
              <span className="small muted">ต้องตัดสินใจสัปดาห์นี้ · {items.length} รายการ · สร้างอัตโนมัติตามกฎ R7</span>
            </div>
            <ActionItemList items={items} />
          </div>
        </div>

        <aside className="rail">
          <Card>
            <CardLabel sub={`คะแนนนิเทศการสอน · ${bands.total} ครู`}>Teacher observation</CardLabel>
            {bands.bands.map((b) => (
              <div className="band" key={b.label}>
                <span className="band__label">{b.label}</span>
                <span className="band__track">
                  <span
                    className="band__fill"
                    style={{ width: `${bands.total ? (b.count / bands.total) * 100 : 0}%` }}
                  />
                </span>
                <span className="band__count">{b.count}</span>
              </div>
            ))}
            <span className="card__sub" style={{ margin: '14px 0 0', paddingTop: 14, borderTop: '1px solid var(--ink-100)' }}>
              ครู {bands.belowThreshold} คนต่ำกว่าเกณฑ์ {TARGETS.coaching} ต้องเข้ารอบโค้ชในภาคเรียนนี้
            </span>
          </Card>

          <Card>
            <CardLabel sub="การมีส่วนร่วมของผู้ปกครอง · ถ่วงน้ำหนักตามกฎ R4">Parent engagement</CardLabel>
            {parents.map((p) => (
              <div className="prow" key={p.channel.id}>
                <span className="prow__label">{p.channel.th}</span>
                <span className="prow__value">{p.rate.toFixed(0)}%</span>
              </div>
            ))}
          </Card>

          <Card variant="inverse">
            <span className="card__label">Needs attention</span>
            <span className="attn__value">{items.length}</span>
            <span className="attn__body">
              {items.filter((a) => a.trigger === 'class_at_risk').length} ห้องต่ำกว่าเป้าผลประเมิน ·{' '}
              {items.filter((a) => a.trigger === 'observation_low').length} ครูต้องเข้ารอบโค้ช ·{' '}
              {items.filter((a) => a.trigger === 'submission_late').length} รายการส่งผลประเมินล่าช้า
            </span>
          </Card>

          <Card variant="flat">
            <CardLabel>This week</CardLabel>
            {WEEK_ITEMS.map((w) => (
              <div className="prow" key={w.label}>
                <span className="prow__label">{w.label}</span>
                <span className="prow__value">{w.when}</span>
              </div>
            ))}
          </Card>
        </aside>
      </div>
    </div>
  );
}
