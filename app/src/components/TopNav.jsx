import { NavLink } from 'react-router-dom';
import { MODULES, ROLES } from '../data/constants';
import { useApp, useActions } from '../store/AppContext';

/** The data-entry screens (S1, S4, S5) sit beside the module tabs rather than inside them. */
const QUICK_LINKS = [
  { path: '/record/assessment', label: 'บันทึกข้อมูล' },
  { path: '/import', label: 'นำเข้าข้อมูลหลัก' },
];

/**
 * Black command bar from design 1a.
 *
 * The role picker is a prototype affordance, not a product feature: the spec has three roles
 * with different permissions (S2), and switching here is the quickest way to see each one.
 * In M7 the signed-in user comes from the session instead.
 */
export default function TopNav() {
  const { user, db } = useApp();
  const { setUser } = useActions();

  const options = [
    db.teachers.find((t) => t.role === 'director'),
    db.teachers.find((t) => t.role === 'staff'),
    ...db.classrooms.slice(0, 3).map((c) => db.teachers.find((t) => t.id === c.homeroomTeacherId)),
  ].filter(Boolean);

  return (
    <header className="nav">
      <span className="nav__mark">TBG SCHOOL OS</span>

      <nav className="nav__items">
        {MODULES.map((m) => (m.live ? (
          <NavLink
            key={m.no}
            to={m.path}
            end={m.path === '/'}
            className={({ isActive }) => `nav__item${isActive ? ' is-active' : ''}`}
          >
            {m.no} {m.label}
          </NavLink>
        ) : (
          <span key={m.no} className="nav__item is-locked" title="ยังไม่อยู่ใน MVP · อยู่ใน Roadmap">
            {m.no} {m.label}
          </span>
        )))}

        <span className="nav__divider" aria-hidden="true" />

        {QUICK_LINKS.map((q) => (
          <NavLink
            key={q.path}
            to={q.path}
            className={({ isActive }) => `nav__item nav__item--util${isActive ? ' is-active' : ''}`}
          >
            {q.label}
          </NavLink>
        ))}
      </nav>

      <div className="nav__user">
        <span className="nav__who">
          {user.nameTh} · {ROLES[user.role].th}
        </span>
        <select
          className="nav__role"
          value={user.id}
          onChange={(e) => setUser(e.target.value)}
          aria-label="สลับผู้ใช้เพื่อดูสิทธิ์แต่ละบทบาท"
        >
          {options.map((t) => (
            <option key={t.id} value={t.id}>
              {ROLES[t.role].th} · {t.nameTh}
            </option>
          ))}
        </select>
        <span className="nav__avatar" aria-hidden="true" />
      </div>
    </header>
  );
}
