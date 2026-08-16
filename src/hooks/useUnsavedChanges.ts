import { useCallback, useEffect } from 'react';
import { useBlocker, type BlockerFunction } from 'react-router-dom';

const MESSAGE = 'You have unsaved changes. Are you sure you want to leave?';

/**
 * Guards a dirty form against losing work, on both exits:
 *  - closing / reloading the tab  → the browser's native beforeunload prompt
 *  - navigating inside the SPA    → React Router's blocker + a confirm dialog
 */
export function useUnsavedChanges(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Browsers show their own wording; a non-empty value is what triggers it.
      event.returnValue = MESSAGE;
      return MESSAGE;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const shouldBlock = useCallback<BlockerFunction>(
    ({ currentLocation, nextLocation }) => isDirty && currentLocation.pathname !== nextLocation.pathname,
    [isDirty],
  );

  const blocker = useBlocker(shouldBlock);

  useEffect(() => {
    if (blocker.state !== 'blocked') return;

    if (window.confirm(MESSAGE)) {
      blocker.proceed();
    } else {
      blocker.reset();
    }
  }, [blocker]);
}

export const UNSAVED_CHANGES_MESSAGE = MESSAGE;
