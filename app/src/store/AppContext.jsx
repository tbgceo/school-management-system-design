/**
 * Session and data for the whole app.
 *
 * The fixture is gone: everything here comes from Supabase, scoped by row level
 * security. There is no role switcher any more, because a role is now a real
 * sign-in — to see the app as a teacher you log in as that teacher, and the
 * database, not the UI, decides what comes back.
 *
 * Every write goes through a named action so that swapping a query never means
 * touching a screen.
 */

import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AppContext } from './context.js';
import { supabase, isConfigured, describeError } from '../lib/supabase.js';
import * as api from '../lib/api.js';
import { CURRENT_SEMESTER } from '../data/constants.js';

export function AppProvider({ children }) {
  const [session, setSession] = useState(null);
  const [me, setMe] = useState(null);
  const [workspace, setWorkspace] = useState(null);
  const [status, setStatus] = useState(isConfigured ? 'booting' : 'unconfigured');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const [semesterId, setSemesterId] = useState(CURRENT_SEMESTER);
  const [level, setLevel] = useState('all');

  /* -------------------------------------------------------------- *
   * Session
   * -------------------------------------------------------------- */
  useEffect(() => {
    if (!isConfigured) return undefined;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      if (!data.session) setStatus('signed-out');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next ?? null);
      if (!next) {
        setMe(null);
        setWorkspace(null);
        setStatus('signed-out');
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  /* -------------------------------------------------------------- *
   * Data
   * -------------------------------------------------------------- */
  const refresh = useCallback(async () => {
    if (!session) return;
    setStatus('loading');
    setError(null);
    try {
      const { me: staffRow } = await api.loadMe();
      setMe(staffRow);

      // An account with no matching staff row is not an error: RLS simply shows
      // it nothing, and the app says so rather than rendering an empty school.
      if (!staffRow) {
        setWorkspace(null);
        setStatus('unlinked');
        return;
      }

      setWorkspace(await api.loadWorkspace(semesterId));
      setStatus('ready');
    } catch (err) {
      setError(describeError(err));
      setStatus('error');
    }
  }, [session, semesterId]);

  useEffect(() => { refresh(); }, [refresh]);

  /* -------------------------------------------------------------- *
   * Actions. Each one writes, then reloads what the write affected.
   * -------------------------------------------------------------- */
  const run = useCallback(async (fn, successText) => {
    try {
      await fn();
      if (successText) setToast({ kind: 'success', text: successText });
      await refresh();
      return true;
    } catch (err) {
      setToast({ kind: 'error', text: describeError(err) });
      return false;
    }
  }, [refresh]);

  const ctx = useMemo(() => {
    const term = workspace?.term;
    const base = { schoolId: term?.school_id, termId: term?.id, meId: me?.id };

    return {
      status,
      error,
      toast,
      session,
      user: me,
      semesterId,
      level,
      isConfigured,

      // Workspace, with empty defaults so a screen never has to null-check.
      term,
      rows: workspace?.rows ?? [],
      bands: workspace?.bands ?? null,
      parentRates: workspace?.parentRates ?? [],
      openActionItems: workspace?.actionItems ?? [],
      tasks: workspace?.tasks ?? [],
      classrooms: workspace?.classrooms ?? [],
      students: workspace?.students ?? [],
      behaviour: workspace?.behaviour ?? [],
      subjects: workspace?.subjects ?? [],
      parentChannels: workspace?.parentChannels ?? [],
      observationTopics: workspace?.observationTopics ?? [],
      incidentTypes: workspace?.incidentTypes ?? [],
      incidentLevels: workspace?.incidentLevels ?? [],
      targets: workspace?.targets ?? {},
      importBatches: workspace?.importBatches ?? [],
      teachers: workspace?.teachers ?? [],

      setSemester: setSemesterId,
      setLevel,
      setToast,
      refresh,

      signIn: async (email, password) => {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) return describeError(signInError);
        return null;
      },
      signOut: () => supabase.auth.signOut(),

      closeActionItem: (id) => run(
        () => api.closeActionItem(id, me.id),
        'ปิดรายการแล้ว · บันทึกว่าใครปิดและเมื่อไร',
      ),
      submitMarks: (payload) => run(
        () => api.submitMarks({ ...base, ...payload }),
        'บันทึกผลประเมินแล้ว',
      ),
      logBehaviour: (payload) => run(
        () => api.logBehaviour({ ...base, ...payload }),
        'บันทึกพฤติกรรมแล้ว',
      ),
      logObservation: (payload) => run(
        () => api.logObservation({ ...base, ...payload }),
        'บันทึกผลนิเทศแล้ว',
      ),
      saveParentEngagement: (payload) => run(
        () => api.saveParentEngagement({ ...base, ...payload }),
        'บันทึกการมีส่วนร่วมผู้ปกครองแล้ว',
      ),
      createTask: (payload) => run(
        () => api.createTask({ ...base, ...payload }),
        'มอบหมายงานแล้ว',
      ),
      toggleTaskDone: (taskId, done) => run(() => api.setTaskDone(taskId, done, me.id)),
      confirmImport: (payload) => run(
        () => api.confirmImport({ ...base, ...payload }),
        `นำเข้าสำเร็จ ${payload.rowsOk} แถว`,
      ),
    };
  }, [status, error, toast, session, me, workspace, semesterId, level, refresh, run]);

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** Kept so screens can carry on importing actions separately from state. */
export function useActions() {
  return useApp();
}
