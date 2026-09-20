import { useNavigate } from 'react-router-dom';
import { Badge, Empty } from './Ui';
import { METRICS } from '../lib/rules';
import { metricText } from '../lib/format';

/** Performance by class - the main table from design 1a. Rows drill through to S3. */
export default function ClassTable({ rows }) {
  const navigate = useNavigate();

  if (!rows.length) return <Empty>ไม่มีห้องเรียนที่ตรงกับตัวกรองนี้</Empty>;

  return (
    <div>
      <div className="ctable__head">
        <span>Class</span>
        <span>Homeroom teacher</span>
        <span style={{ textAlign: 'right' }}>Assess.</span>
        <span style={{ textAlign: 'right' }}>Behaviour</span>
        <span style={{ textAlign: 'right' }}>Observation</span>
        <span style={{ textAlign: 'right' }}>Parent eng.</span>
        <span style={{ textAlign: 'right' }}>Status</span>
      </div>

      {rows.map((r) => (
        <div
          key={r.classroom.id}
          className="ctable__row"
          role="link"
          tabIndex={0}
          onClick={() => navigate(`/class/${r.classroom.id}`)}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate(`/class/${r.classroom.id}`); } }}
        >
          <span className="ctable__cls">{r.classroom.name}</span>

          <span className="ctable__teacher">
            <b>{r.homeroom.nameEn}</b>
            <span>{r.studentCount} students · {r.homeroom.nameTh}</span>
          </span>

          <span className="num">{metricText(r.assessment, METRICS.assessment)}</span>
          <span className="num">{metricText(r.behaviour, METRICS.behaviour)}</span>
          <span className="num">{metricText(r.observation, METRICS.observation)}</span>
          <span className="num">{metricText(r.parent, METRICS.parent)}</span>

          <span className="ctable__mobile">
            <span>ผล {metricText(r.assessment, METRICS.assessment)}</span>
            <span>พฤติกรรม {metricText(r.behaviour, METRICS.behaviour)}</span>
            <span>นิเทศ {metricText(r.observation, METRICS.observation)}</span>
            <span>ผู้ปกครอง {metricText(r.parent, METRICS.parent)}</span>
          </span>

          <span className="right">
            <Badge tone={r.status.tone}>{r.status.label}</Badge>
          </span>
        </div>
      ))}
    </div>
  );
}
