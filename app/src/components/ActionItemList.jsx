import { Link } from 'react-router-dom';
import { Badge, Empty } from './Ui';
import { useApp } from '../store/AppContext';
import { ROLES } from '../data/constants';

/**
 * R7 — "รายการที่ต้องจัดการ".
 *
 * Raised by refresh_action_items(), never created by hand: action_items has no
 * INSERT policy at all. Closing goes through close_action_item(), which the
 * database refuses for anyone but the director — so the button below is a
 * convenience, not the enforcement.
 */
export default function ActionItemList({ items, limit }) {
  const { user, closeActionItem } = useApp();
  const shown = limit ? items.slice(0, limit) : items;

  if (!shown.length) {
    return <Empty>ไม่มีรายการที่ต้องจัดการในตัวกรองนี้ · ทุกห้องอยู่ในเกณฑ์</Empty>;
  }

  return (
    <div className="signals">
      {shown.map((a) => (
        <article key={a.id} className="signal">
          <span className={`signal__rule signal__rule--${a.tone}`} aria-hidden="true" />

          <span className="signal__cls">{a.classroomName || 'ALL'}</span>

          <div className="signal__body">
            <div className="row" style={{ gap: 10 }}>
              <span className="signal__title">{a.title}</span>
              <Badge tone={a.tone}>
                {a.tone === 'danger' ? 'At risk' : a.tone === 'warning' ? 'Watch' : 'Follow up'}
              </Badge>
            </div>
            <span className="signal__detail">{a.detail}</span>
            <span className="signal__th">{a.titleTh}</span>
          </div>

          <div className="signal__side">
            <span className="signal__owner">{a.owner}</span>
            {a.classroomId && (
              <Link className="btn btn--outline btn--sm" to={`/class/${a.classroomId}`}>
                {a.action}
              </Link>
            )}
            {user && ROLES[user.role].canCloseActionItems && (
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => closeActionItem(a.id)}>
                ปิดรายการ
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
