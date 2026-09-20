import { NavLink } from 'react-router-dom';
import { MODULES, ROLES } from '../data/constants';
import { useApp } from '../store/AppContext';

/** The data-entry screens (S1, S4, S5) sit beside the module tabs. */
const QUICK_LINKS = [
  { path: '/record/assessment', label: 'บันทึกข้อมูล', roles: ['director', 'teacher', 'staff'] },
  { path: '/import', label: 'นำเข้าข้อมูลหลัก', roles: ['staff'] },
];

/**
 * Black command bar from design 1a.
 *
 * The role picker that used to sit here is gone. A role is a real sign-in now,
 * so switching means signing in as someone else — and the database, not this
 * component, decides what they see.
 */
export default function TopNav() {
  const { user, signOut } = useApp();
  const role = user ? ROLES[user.role] : null;

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

        {QUICK_LINKS
          .filter((q) => !user || q.roles.includes(user.role))
          .map((q) => (
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
          {user ? `${user.nameTh} · ${role.th}` : '—'}
        </span>
        <button type="button" className="nav__signout" onClick={signOut}>
          ออกจากระบบ
        </button>
        <span className="nav__avatar" aria-hidden="true" />
      </div>
    </header>
  );
}
