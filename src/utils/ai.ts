let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/engineWorker.ts', import.meta.url), {
      type: 'module'
    });
  }
  return worker;
}

export function getAIMove(fen: string): Promise<string> {
  return new Promise((resolve) => {
    const w = getWorker();

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (data && data.type === 'aiMove') {
        w.removeEventListener('message', handleMessage);
        resolve(data.move);
      }
    }

    w.addEventListener('message', handleMessage);
    w.postMessage({ type: 'move', fen });
  });
}
