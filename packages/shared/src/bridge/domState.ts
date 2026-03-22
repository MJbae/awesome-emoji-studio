// ===================================================================
// DOM State — data-* attribute synchronization on document root
// ===================================================================

import { useAppStore } from '@/store/appStore';

export function syncDomState(state: {
  stage: string;
  jobStatus: string;
  mode: string;
}): void {
  const root = document.documentElement;
  root.setAttribute('data-stage', state.stage);
  root.setAttribute('data-job-status', state.jobStatus);
  root.setAttribute('data-mode', state.mode);
}

let unsubscribe: (() => void) | null = null;

export function startDomSync(): void {
  if (unsubscribe) return;

  const currentState = useAppStore.getState();
  syncDomState({
    stage: currentState.stage,
    jobStatus: currentState.activeJobId
      ? (currentState.jobs[currentState.activeJobId]?.status ?? 'idle')
      : 'idle',
    mode: currentState.mode,
  });

  unsubscribe = useAppStore.subscribe((state) => {
    const jobStatus = state.activeJobId
      ? (state.jobs[state.activeJobId]?.status ?? 'idle')
      : 'idle';

    syncDomState({
      stage: state.stage,
      jobStatus,
      mode: state.mode,
    });
  });
}

export function stopDomSync(): void {
  if (unsubscribe) {
    unsubscribe();
    unsubscribe = null;
  }
}
