import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import TopNav from './components/TopNav';
import { Toast, Notice, Empty } from './components/Ui';
import Login from './screens/Login';
import Dashboard from './screens/Dashboard';
import ClassDetail from './screens/ClassDetail';
import RecordForms from './screens/RecordForms';
import TeacherTasks from './screens/TeacherTasks';
import ImportData from './screens/ImportData';

function Booting({ text }) {
  return (
    <div className="wrap page">
      <Empty>{text}</Empty>
    </div>
  );
}

function Shell() {
  const { status, error, toast, user, signOut } = useApp();

  // Nothing is rendered from a cached fixture any more, so every state the
  // session can be in gets its own answer rather than an empty dashboard.
  if (status === 'unconfigured' || status === 'signed-out') return <Login />;
  if (status === 'booting') return <Booting text="กำลังตรวจสอบสถานะการเข้าสู่ระบบ…" />;

  if (status === 'unlinked') {
    return (
      <div className="app">
        <TopNav />
        <main className="app-main">
          <div className="wrap page">
            <Notice tone="warn">
              เข้าสู่ระบบสำเร็จ แต่อีเมลนี้ยังไม่ตรงกับทะเบียนครูคนไหน · RLS จึงไม่แสดงข้อมูลใด ๆ
              ให้ผู้ดูแลเพิ่มอีเมลนี้ในตาราง <code>teachers</code> แล้วเข้าสู่ระบบใหม่
              {' · '}
              <button type="button" className="btn btn--ghost btn--sm" onClick={signOut}>ออกจากระบบ</button>
            </Notice>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <TopNav />
      <main className="app-main">
        {status === 'error' && (
          <div className="wrap" style={{ paddingTop: 20 }}>
            <Notice tone="warn">โหลดข้อมูลไม่สำเร็จ · {error}</Notice>
          </div>
        )}
        {status === 'loading' && !user ? <Booting text="กำลังโหลดข้อมูล…" /> : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/class/:classId" element={<ClassDetail />} />
            <Route path="/tasks" element={<TeacherTasks />} />
            <Route path="/record" element={<Navigate to="/record/assessment" replace />} />
            <Route path="/record/:kind" element={<RecordForms />} />
            <Route path="/import" element={<ImportData />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        )}
      </main>
      <Toast toast={toast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      {/* BASE_URL is '/' in dev and '/<repo>/' in a GitHub Pages build, so the
          router and the asset paths agree wherever the bundle is served from. */}
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Shell />
      </BrowserRouter>
    </AppProvider>
  );
}
