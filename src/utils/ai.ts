let worker: Worker | null = null;

export function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/engineWorker.ts', import.meta.url), {
      type: 'module'
    });
  }
  return worker;
}

export function requestAIMove(from: string, to: string): Promise<{ from: string; to: string }> {
  return new Promise((resolve) => {
    const w = getWorker();

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (data && data.type === 'AI_MOVE') {
        w.removeEventListener('message', handleMessage);
        resolve({ from: data.from, to: data.to });
      }
    }

    w.addEventListener('message', handleMessage);
    w.postMessage({ type: 'PLAYER_MOVE', from, to });
  });
}
