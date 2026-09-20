/**
 * Single in-memory store for the prototype.
 *
 * Every write goes through a named action here rather than being scattered across screens,
 * so in M7 each action body becomes one API call and the components stay as they are.
 * State is not persisted: a reload returns to the seeded dataset.
 */

import { useContext, useMemo, useReducer, useCallback } from 'react';
import { db as seed, SCHOOL, DIRECTOR, STAFF } from '../data/mockData';
import { AS_OF, CURRENT_SEMESTER, EDIT_WINDOW_DAYS } from '../data/constants';
import { buildActionItems } from '../lib/rules';
import { AppContext } from './context';

let counter = 0;
const nextId = (prefix) => {
  counter += 1;
  return `${prefix}-new-${counter}`;
};

const initialState = {
  db: seed,
  userId: DIRECTOR.id,
  semesterId: CURRENT_SEMESTER,
  level: 'all',
  closedActionItems: {},
  toast: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'setUser':
      return { ...state, userId: action.userId };

    case 'setSemester':
      return { ...state, semesterId: action.semesterId };

    case 'setLevel':
      return { ...state, level: action.level };

    case 'toast':
      return { ...state, toast: action.toast };

    case 'closeActionItem':
      return {
        ...state,
        closedActionItems: { ...state.closedActionItems, [action.id]: new Date().toISOString() },
        toast: { kind: 'success', text: 'ปิดรายการแล้ว · บันทึกว่าใครปิดและเมื่อไร' },
      };

    case 'submitAssessment': {
      const { classroomId, checkpoint, subjectId, scores, note, teacherId, recordedBy } = action.payload;
      const kept = state.db.assessments.filter(
        (r) => !(r.classroomId === classroomId && r.checkpoint === checkpoint
          && r.subjectId === subjectId && r.semesterId === state.semesterId),
      );
      const rows = Object.entries(scores)
        .filter(([, v]) => v !== '' && v != null)
        .map(([studentId, v]) => ({
          id: nextId('asm'),
          schoolId: SCHOOL.id,
          semesterId: state.semesterId,
          classroomId,
          studentId,
          subjectId,
          checkpoint,
          score: Number(v),
          recordedAt: new Date().toISOString(),
          teacherId,
          recordedBy,
          onBehalf: recordedBy !== teacherId,
          note: note || null,
        }));
      return {
        ...state,
        db: { ...state.db, assessments: [...kept, ...rows] },
        toast: { kind: 'success', text: `บันทึกผลประเมินแล้ว ${rows.length} คน · จุดตรวจที่ ${checkpoint}` },
      };
    }

    case 'logBehaviour': {
      const row = {
        id: nextId('bhv'),
        schoolId: SCHOOL.id,
        semesterId: state.semesterId,
        occurredAt: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        db: { ...state.db, behaviour: [...state.db.behaviour, row] },
        toast: { kind: 'success', text: `บันทึกพฤติกรรมระดับ ${row.level} แล้ว` },
      };
    }

    case 'logObservation': {
      const row = {
        id: nextId('obs'),
        schoolId: SCHOOL.id,
        semesterId: state.semesterId,
        recordedAt: new Date().toISOString(),
        ...action.payload,
      };
      return {
        ...state,
        db: { ...state.db, observations: [...state.db.observations, row] },
        toast: { kind: 'success', text: 'บันทึกผลนิเทศแล้ว' },
      };
    }

    case 'logParentEngagement': {
      const { classroomId, guardianId, entries, recordedBy } = action.payload;
      const kept = state.db.parentEngagement.filter(
        (r) => !(r.guardianId === guardianId && r.semesterId === state.semesterId),
      );
      const rows = Object.entries(entries).map(([channelId, done]) => ({
        id: nextId('pae'),
        schoolId: SCHOOL.id,
        semesterId: state.semesterId,
        classroomId,
        guardianId,
        channelId,
        done,
        recordedAt: new Date().toISOString(),
        recordedBy,
      }));
      return {
        ...state,
        db: { ...state.db, parentEngagement: [...kept, ...rows] },
        toast: { kind: 'success', text: 'บันทึกการมีส่วนร่วมผู้ปกครองแล้ว' },
      };
    }

    case 'createTask': {
      const row = {
        id: nextId('tsk'),
        schoolId: SCHOOL.id,
        semesterId: state.semesterId,
        completedAt: null,
        createdAt: new Date().toISOString(),
        attachments: [],
        sourceActionItemId: null,
        ...action.payload,
      };
      return {
        ...state,
        db: { ...state.db, tasks: [...state.db.tasks, row] },
        toast: { kind: 'success', text: 'มอบหมายงานแล้ว' },
      };
    }

    case 'toggleTaskDone': {
      const tasks = state.db.tasks.map((t) => (
        t.id === action.id ? { ...t, completedAt: t.completedAt ? null : new Date().toISOString() } : t
      ));
      return { ...state, db: { ...state.db, tasks } };
    }

    case 'confirmImport': {
      const row = {
        id: nextId('imp'),
        schoolId: SCHOOL.id,
        semesterId: state.semesterId,
        uploadedAt: new Date().toISOString(),
        state: 'confirmed',
        ...action.payload,
      };
      return {
        ...state,
        db: { ...state.db, importBatches: [row, ...state.db.importBatches] },
        toast: { kind: 'success', text: `นำเข้าสำเร็จ ${row.rowsOk} แถว` },
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const user = useMemo(
    () => state.db.teachers.find((t) => t.id === state.userId) || DIRECTOR,
    [state.db.teachers, state.userId],
  );

  const actionItems = useMemo(
    () => buildActionItems(state.db, state.semesterId, state.closedActionItems, AS_OF),
    [state.db, state.semesterId, state.closedActionItems],
  );

  const openActionItems = useMemo(() => actionItems.filter((a) => !a.closedAt), [actionItems]);

  const value = useMemo(() => ({
    ...state,
    user,
    school: SCHOOL,
    director: DIRECTOR,
    staff: STAFF,
    asOf: AS_OF,
    editWindowDays: EDIT_WINDOW_DAYS,
    actionItems,
    openActionItems,
    dispatch,
  }), [state, user, actionItems, openActionItems]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

/** Convenience wrapper so screens dispatch by name instead of building action objects. */
export function useActions() {
  const { dispatch } = useApp();
  return {
    setUser: useCallback((userId) => dispatch({ type: 'setUser', userId }), [dispatch]),
    setSemester: useCallback((semesterId) => dispatch({ type: 'setSemester', semesterId }), [dispatch]),
    setLevel: useCallback((level) => dispatch({ type: 'setLevel', level }), [dispatch]),
    toast: useCallback((toast) => dispatch({ type: 'toast', toast }), [dispatch]),
    closeActionItem: useCallback((id) => dispatch({ type: 'closeActionItem', id }), [dispatch]),
    submitAssessment: useCallback((payload) => dispatch({ type: 'submitAssessment', payload }), [dispatch]),
    logBehaviour: useCallback((payload) => dispatch({ type: 'logBehaviour', payload }), [dispatch]),
    logObservation: useCallback((payload) => dispatch({ type: 'logObservation', payload }), [dispatch]),
    logParentEngagement: useCallback((payload) => dispatch({ type: 'logParentEngagement', payload }), [dispatch]),
    createTask: useCallback((payload) => dispatch({ type: 'createTask', payload }), [dispatch]),
    toggleTaskDone: useCallback((id) => dispatch({ type: 'toggleTaskDone', id }), [dispatch]),
    confirmImport: useCallback((payload) => dispatch({ type: 'confirmImport', payload }), [dispatch]),
  };
}
