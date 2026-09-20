import { useNavigate } from 'react-router-dom';
import { METRICS } from '../lib/rules';
import { metricText } from '../lib/format';

/**
 * Class x metric heat grid, from design 1c.
 * The heat steps are shared by every cell so one colour means the same thing across metrics
 * (R6); each metric is first normalised against its own ceiling.
 */
const CEILING = { assessment: 100, behaviour: 100, observation: 5, parent: 100 };

function heat(value, key) {
  if (value == null) return { background: 'var(--ink-050)', color: 'var(--ink-400)' };
  const p = value / CEILING[key];
  if (p >= 0.88) return { background: 'var(--tbg-blue-200)', color: 'var(--tbg-blue-950)' };
  if (p >= 0.78) return { background: 'var(--tbg-blue-100)', color: 'var(--tbg-blue-900)' };
  if (p >= 0.66) return { background: 'var(--ink-050)', color: 'var(--ink-700)' };
  return { background: 'var(--status-danger-soft)', color: 'var(--status-danger)' };
}

export const MATRIX_LEGEND = [
  { label: 'Strong', style: { background: 'var(--tbg-blue-200)' } },
  { label: 'On track', style: { background: 'var(--tbg-blue-100)' } },
  { label: 'Watch', style: { background: 'var(--ink-050)', border: '1px solid var(--ink-200)' } },
  { label: 'At risk', style: { background: 'var(--status-danger-soft)' } },
];

const KEYS = ['assessment', 'behaviour', 'observation', 'parent'];

export default function MatrixTable({ rows }) {
  const navigate = useNavigate();

  return (
    <div className="panel">
      <div className="matrix__head">
        <span>Class / teacher</span>
        <span style={{ textAlign: 'center' }}>Assessment</span>
        <span style={{ textAlign: 'center' }}>Behaviour</span>
        <span style={{ textAlign: 'center' }}>Observation</span>
        <span style={{ textAlign: 'center' }}>Parent eng.</span>
        <span style={{ textAlign: 'right' }}>Index</span>
      </div>

      {rows.map((r) => {
        const trend = r.status.key === 'risk' ? '▼' : r.status.key === 'watch' ? '—' : '▲';
        return (
          <div
            key={r.classroom.id}
            className="matrix__row"
            role="link"
            tabIndex={0}
            onClick={() => navigate(`/class/${r.classroom.id}`)}
            onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/class/${r.classroom.id}`); }}
            style={{ cursor: 'pointer' }}
          >
            <div className="matrix__name">
              <b>{r.classroom.name}</b>
              <span>{r.homeroom.nameTh} · {r.studentCount} นร.</span>
            </div>

            {KEYS.map((key) => (
              <div
                key={key}
                className="matrix__cell"
                data-label={METRICS[key].th}
                style={heat(r[key], key)}
              >
                <span>{metricText(r[key], METRICS[key])}</span>
              </div>
            ))}

            <div className="matrix__index">
              <b>{r.index ?? '—'}</b>
              <span>{trend}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
