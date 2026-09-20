import { createContext } from 'react';

/**
 * The context object lives in its own module on purpose.
 *
 * If it were created inside AppContext.jsx, every hot update to that file would mint a fresh
 * context while already-mounted consumers still held the previous one, and they would throw
 * "must be used inside AppProvider" until a full reload. Keeping it here gives the provider
 * and its consumers one stable identity across HMR.
 */
export const AppContext = createContext(null);
