import { Card, Badge } from './Ui';
import { metricText, targetText, deltaText } from '../lib/format';

/**
 * Checkpoint sparkline.
 *
 * The mockup drew ten bars from an invented series. Here there is one bar per assessment
 * checkpoint (A2 puts four in a semester), because that is the real cadence the data has.
 * A checkpoint with nothing submitted yet renders as a flat grey stub rather than a gap.
 */
function Sparkline({ series }) {
  const points = series.filter((p) => p != null);
  const max = points.length ? Math.max(...points) : 1;
  const min = points.length ? Math.min(...points) : 0;
  const span = max - min || 1;

  return (
    <div className="spark" aria-hidden="true">
      {series.map((v, i) => (
        <span
          key={i}
          className={`spark__bar${v == null ? ' is-empty' : ''}`}
          style={{ height: v == null ? '4px' : `${24 * (0.35 + 0.65 * ((v - min) / span))}px` }}
        />
      ))}
    </div>
  );
}

export default function KpiCard({ metric, value, series, status }) {
  return (
    <Card accent>
      <div className="kpi">
        <div className="row row--between" style={{ gap: 8 }}>
          <span className="card__label">{metric.label}</span>
          <Badge tone={status.tone}>{status.th}</Badge>
        </div>
        <span className="kpi__th">{metric.th}</span>

        <div className="kpi__row">
          <span className="kpi__value">{metricText(value, metric)}</span>
          <span className="kpi__delta">{deltaText(series, metric)}</span>
        </div>

        <Sparkline series={series} />

        <span className="kpi__target">
          Target {targetText(metric)} · เป้าหมายภาคเรียน
        </span>
      </div>
    </Card>
  );
}
