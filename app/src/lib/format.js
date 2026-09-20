/** Display helpers. Formatting only - no business logic lives here. */

const TH_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
const EN_MONTHS_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export const toDate = (v) => (v instanceof Date ? v : new Date(v));

/** 19 ก.ย. 2569 */
export function thaiDate(value) {
  const d = toDate(value);
  return `${d.getDate()} ${TH_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear() + 543}`;
}

/** 19 SEP 2026 · 08:40 */
export function stampDate(value, withTime = false) {
  const d = toDate(value);
  const base = `${d.getDate()} ${EN_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return base;
  return `${base} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/** yyyy-mm-dd, for <input type="date"> */
export function inputDate(value) {
  const d = toDate(value);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function daysBetween(a, b) {
  return Math.round((toDate(a).getTime() - toDate(b).getTime()) / 86400000);
}

/** Renders a metric the way its card and its table cell both expect. */
export function metricText(value, metric) {
  if (value == null) return '—';
  if (metric.key === 'observation') return value.toFixed(1);
  return `${Math.round(value)}${metric.unit}`;
}

export function targetText(metric) {
  if (metric.key === 'observation') return metric.target.toFixed(1);
  return `${metric.target}${metric.unit}`;
}

/** "+3 pts" / "−2 pts" against the first usable point in the series. */
export function deltaText(series, metric) {
  const points = series.filter((p) => p != null);
  if (points.length < 2) return 'ยังไม่มีข้อมูลเปรียบเทียบ';
  const change = points[points.length - 1] - points[0];
  const sign = change >= 0 ? '+' : '−';
  const abs = Math.abs(change);
  const body = metric.key === 'observation' ? abs.toFixed(1) : abs.toFixed(1);
  return `${sign}${body} ${metric.key === 'observation' ? '' : 'pts '}vs จุดตรวจแรก`.trim();
}

export const pct = (v, digits = 0) => (v == null ? '—' : `${v.toFixed(digits)}%`);
