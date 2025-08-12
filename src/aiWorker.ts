import type { WorkerMessage } from './types';

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { type, from, to } = e.data || {};
  if (type === 'PLAYER_MOVE') {
    if (from === 'e2' && to === 'e4') {
      setTimeout(() => {
        (self as DedicatedWorkerGlobalScope).postMessage(
          { type: 'AI_MOVE', from: 'e7', to: 'e5' } satisfies WorkerMessage,
        );
      }, 500);
    }
  }
};
