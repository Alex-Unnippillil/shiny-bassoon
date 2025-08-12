let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL('../workers/engineWorker.ts', import.meta.url), {
      type: 'module'
    });
  }
  return worker;
}

interface Piece {
  type: 'P';
  color: 'w' | 'b';
}

type Board = Record<string, Piece>;

export function getAIMove(board: Board, color: 'w' | 'b'): Promise<{ from: string; to: string; }> {
  return new Promise((resolve) => {
    const w = getWorker();

    function handleMessage(event: MessageEvent) {
      const data = event.data;
      if (data && data.type === 'aiMove') {
        w.removeEventListener('message', handleMessage);
        resolve({ from: data.from, to: data.to });
      }
    }

    w.addEventListener('message', handleMessage);
    w.postMessage({ type: 'move', board, color });
  });
}

