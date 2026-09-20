import { Link } from 'react-router-dom';
import { Badge, Empty } from './Ui';
import { useApp, useActions } from '../store/AppContext';
import { ROLES } from '../data/constants';

/**
 * R7 - "รายการที่ต้องจัดการ".
 *
 * Raised by the rules, never created by hand. Only the director can close one, and closing
 * records who did it and when. Styling follows the "needs a decision" block in design 1b.
 */
export default function ActionItemList({ items, limit }) {
  const { user, db } = useApp();
  const { closeActionItem } = useActions();
  const shown = limit ? items.slice(0, limit) : items;

  if (!shown.length) {
    return <Empty>ไม่มีรายการที่ต้องจัดการในตัวกรองนี้ · ทุกห้องอยู่ในเกณฑ์</Empty>;
  }

  return (
    <div className="signals">
      {shown.map((a) => {
        const cls = a.classroomId ? db.classrooms.find((c) => c.id === a.classroomId) : null;
        return (
          <article key={a.id} className="signal">
            <span className={`signal__rule signal__rule--${a.tone}`} aria-hidden="true" />

            <span className="signal__cls">{cls ? cls.name : 'ALL'}</span>

            <div className="signal__body">
              <div className="row" style={{ gap: 10 }}>
                <span className="signal__title">{a.title}</span>
                <Badge tone={a.tone}>{a.tone === 'danger' ? 'At risk' : a.tone === 'warning' ? 'Watch' : 'Follow up'}</Badge>
              </div>
              <span className="signal__detail">{a.detail}</span>
              <span className="signal__th">{a.titleTh}</span>
            </div>

            <div className="signal__side">
              <span className="signal__owner">{a.owner}</span>
              {cls && (
                <Link className="btn btn--outline btn--sm" to={`/class/${cls.id}`}>
                  {a.action}
                </Link>
              )}
              {ROLES[user.role].canCloseActionItems && (
                <button type="button" className="btn btn--ghost btn--sm" onClick={() => closeActionItem(a.id)}>
                  ปิดรายการ
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
