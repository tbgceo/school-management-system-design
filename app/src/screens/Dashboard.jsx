import { useMemo, useState } from 'react';
import { useApp } from '../store/AppContext';
import { METRICS, statusFor } from '../lib/rules';
import { SEMESTERS, LEVEL_FILTERS, CHECKPOINTS, WEEK_ITEMS, ROLES } from '../data/constants';
import { metricText } from '../lib/format';
import { Card, CardLabel, Notice, Empty } from '../components/Ui';
import KpiCard from '../components/KpiCard';
import ClassTable from '../components/ClassTable';
import MatrixTable, { MATRIX_LEGEND } from '../components/MatrixTable';
import ActionItemList from '../components/ActionItemList';

/**
 * S2 — the director's landing screen.
 *
 * Every figure here arrives already computed from `v_class_metrics` and
 * `class_metric_series`. The level filter and the school-wide means are the only
 * arithmetic left in the browser, because both depend on which classes are in
 * view and the database does not know about the filter.
 */
export default function Dashboard() {
  const {
    rows: allRows, bands, parentRates, openActionItems, targets, term,
    user, semesterId, level, status, setSemester, setLevel,
  } = useApp();
  const [view, setView] = useState('table');

  const semester = SEMESTERS.find((s) => s.id === semesterId) || SEMESTERS[0];

  // Targets live in metric_targets, so a school that changes its pass mark moves
  // every band here without a deploy.
  const metrics = useMemo(() => Object.fromEntries(
    Object.entries(METRICS).map(([key, m]) => [key, { ...m, target: targets[key] ?? m.target }]),
  ), [targets]);

  const rows = useMemo(
    () => (level === 'all' ? allRows : allRows.filter((r) => r.classroom.level === level)),
    [allRows, level],
  );

  const kpis = useMemo(() => Object.values(metrics).map((m) => {
    const values = rows.map((r) => r[m.key]).filter((v) => v != null);
    const value = values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
    const series = CHECKPOINTS.map((_, i) => {
      const points = rows.map((r) => r.series[m.key][i]).filter((v) => v != null);
      return points.length ? points.reduce((a, b) => a + b, 0) / points.length : null;
    });
    return { metric: m, value, series, status: statusFor(value, m, series) };
  }), [rows, metrics]);

  const visibleIds = new Set(rows.map((r) => r.classroom.id));
  const items = openActionItems.filter((a) => !a.classroomId || visibleIds.has(a.classroomId));

  const studentTotal = rows.reduce((sum, r) => sum + r.studentCount, 0);
  const channelTotals = useMemo(() => {
    const byChannel = new Map();
    parentRates.forEach((r) => {
      const prev = byChannel.get(r.channel_id) || { name: r.name_th, done: 0, of: 0 };
      byChannel.set(r.channel_id, {
        name: r.name_th,
        done: prev.done + Number(r.done_count),
        of: prev.of + Number(r.guardian_count),
      });
    });
    return [...byChannel.values()];
  }, [parentRates]);

  function exportCsv() {
    const header = ['Class', 'Homeroom', 'Students', 'Assessment', 'Behaviour', 'Observation', 'ParentEngagement', 'Index', 'Status'];
    const body = rows.map((r) => [
      r.classroom.name, r.homeroom.nameTh, r.studentCount,
      metricText(r.assessment, metrics.assessment),
      metricText(r.behaviour, metrics.behaviour),
      metricText(r.observation, metrics.observation),
      metricText(r.parent, metrics.parent),
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
            ภาพรวมผลการดำเนินงานของโรงเรียน · {term?.label || semester.label}
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
          <button type="button" className="btn btn--primary" onClick={exportCsv} disabled={!rows.length}>EXPORT</button>
        </div>
      </div>

      {user?.role === 'teacher' && (
        <div style={{ marginBottom: 20 }}>
          <Notice>
            คุณเข้าใช้งานในบทบาท <b>ครู</b> · {ROLES.teacher.sees} — ฐานข้อมูลส่งเฉพาะห้องของคุณมาให้
            ไม่ใช่การกรองในหน้าจอ
          </Notice>
        </div>
      )}

      {status === 'ready' && rows.length === 0 && (
        <Notice tone="warn">
          ไม่มีห้องเรียนที่คุณมีสิทธิ์เห็นในตัวกรองนี้
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
                  ผลการดำเนินงานรายชั้นเรียน · {rows.length} ห้องเรียน · {studentTotal} นักเรียน
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
              <span className="panel__stamp">LIVE · SUPABASE</span>
            </div>
          </div>

          <div className="stack">
            <div className="row" style={{ gap: 12, alignItems: 'baseline' }}>
              <span className="section-title">Needs a decision</span>
              <span className="small muted">
                ต้องตัดสินใจสัปดาห์นี้ · {items.length} รายการ · สร้างอัตโนมัติตามกฎ R7
              </span>
            </div>
            <ActionItemList items={items} />
          </div>
        </div>

        <aside className="rail">
          <Card>
            <CardLabel sub={`คะแนนนิเทศการสอน · ${bands?.teachers_scored ?? 0} ครู`}>Teacher observation</CardLabel>
            {!bands ? <Empty>ยังไม่มีผลนิเทศที่คุณมีสิทธิ์เห็น</Empty> : [
              { label: '4.5 – 5.0', count: bands.band_4_5_to_5_0 },
              { label: '4.0 – 4.4', count: bands.band_4_0_to_4_4 },
              { label: '3.5 – 3.9', count: bands.band_3_5_to_3_9 },
              { label: 'below 3.5', count: bands.band_below_3_5 },
            ].map((b) => (
              <div className="band" key={b.label}>
                <span className="band__label">{b.label}</span>
                <span className="band__track">
                  <span
                    className="band__fill"
                    style={{ width: `${bands.teachers_scored ? (b.count / bands.teachers_scored) * 100 : 0}%` }}
                  />
                </span>
                <span className="band__count">{b.count}</span>
              </div>
            ))}
            {bands && (
              <span className="card__sub" style={{ margin: '14px 0 0', paddingTop: 14, borderTop: '1px solid var(--ink-100)' }}>
                ครู {bands.band_below_3_5} คนต่ำกว่าเกณฑ์ {targets.coaching ?? 3.5} ต้องเข้ารอบโค้ชในภาคเรียนนี้
              </span>
            )}
          </Card>

          <Card>
            <CardLabel sub="การมีส่วนร่วมของผู้ปกครอง · ถ่วงน้ำหนักตามกฎ R4">Parent engagement</CardLabel>
            {channelTotals.length === 0 ? <Empty>ยังไม่มีข้อมูล</Empty> : channelTotals.map((c) => (
              <div className="prow" key={c.name}>
                <span className="prow__label">{c.name}</span>
                <span className="prow__value">{c.of ? Math.round((c.done / c.of) * 100) : 0}%</span>
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
