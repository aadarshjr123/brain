'use client';

import { useEffect } from 'react';

import { useController } from '@/features/explore/context';

import { useAppDispatch, useAppSelector } from './provider';
import { conceptViewed } from './slices';

/**
 * Connects the two stores without coupling them (ADR-0006): when the map's selection changes,
 * record a view in Redux. Starts after storage has loaded, so the replay cannot overwrite a fresh view.
 */
export function ProgressBridge() {
  const controller = useController();
  const dispatch = useAppDispatch();
  const session = useAppSelector((s) => s.session);

  useEffect(() => {
    if (!session.hydrated) return;
    if (session.storage === 'unavailable') {
      controller.store
        .getState()
        .notify('Progress will not be saved: this browser blocks storage for the site.');
    }
    let last = controller.store.getState().selectedId;
    if (last) dispatch(conceptViewed(last));
    return controller.store.subscribe((state) => {
      if (state.selectedId && state.selectedId !== last) dispatch(conceptViewed(state.selectedId));
      last = state.selectedId;
    });
  }, [controller, dispatch, session.hydrated, session.storage]);

  return null;
}
