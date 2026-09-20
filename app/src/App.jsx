import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store/AppContext';
import TopNav from './components/TopNav';
import { Toast } from './components/Ui';
import Dashboard from './screens/Dashboard';
import ClassDetail from './screens/ClassDetail';
import RecordForms from './screens/RecordForms';
import TeacherTasks from './screens/TeacherTasks';
import ImportData from './screens/ImportData';

function Shell() {
  const { toast } = useApp();

  return (
    <div className="app">
      <TopNav />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/class/:classId" element={<ClassDetail />} />
          <Route path="/tasks" element={<TeacherTasks />} />
          <Route path="/record" element={<Navigate to="/record/assessment" replace />} />
          <Route path="/record/:kind" element={<RecordForms />} />
          <Route path="/import" element={<ImportData />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Toast toast={toast} />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AppProvider>
  );
}
