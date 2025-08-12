import path from 'path';
import { pathToFileURL } from 'url';

let handler = null;

async function loadWorker() {
  if (handler) return handler;
  const bootstrap = { postMessage: () => {}, onmessage: null };
  global.self = bootstrap;
  await import(pathToFileURL(path.resolve(__dirname, './worker.js')));
  handler = bootstrap.onmessage;
  delete global.self;
  return handler;
}

async function runWorker(input) {
  const workerHandler = await loadWorker();
  return new Promise((resolve) => {
    const tempSelf = {
      postMessage: (data) => {
        resolve(data);
      },
      onmessage: null,
    };
    global.self = tempSelf;
    workerHandler({ data: input });
    delete global.self;
  });
}

test('generates ai move and returns status', async () => {
  const board = {
    e2: { type: 'P', color: 'w' },
    e7: { type: 'P', color: 'b' },
    e1: { type: 'K', color: 'w' },
    e8: { type: 'K', color: 'b' },
  };
  const result = await runWorker({ board, move: { from: 'e2', to: 'e4' }, playerColor: 'w' });
  expect(result.playerMove).toEqual({ from: 'e2', to: 'e4' });
  expect(result.aiMove).toBeDefined();
  expect(result.status).toBe('ongoing');
  expect(Array.isArray(result.legalMoves)).toBe(true);
});

test('rejects illegal moves', async () => {
  const board = {
    e2: { type: 'P', color: 'w' },
    e3: { type: 'P', color: 'b' },
    e1: { type: 'K', color: 'w' },
    e8: { type: 'K', color: 'b' },
  };
  const result = await runWorker({ board, move: { from: 'e2', to: 'e4' }, playerColor: 'w' });
  expect(result.error).toBe('Illegal move');
  expect(Array.isArray(result.legalMoves)).toBe(true);
});

test('detects checkmate', async () => {
  const board = {
    h8: { type: 'K', color: 'b' },
    f6: { type: 'K', color: 'w' },
    g6: { type: 'Q', color: 'w' },
  };
  const result = await runWorker({ board, move: { from: 'g6', to: 'g7' }, playerColor: 'w' });
  expect(result.status).toBe('checkmate');
  expect(result.aiMove).toBeUndefined();
});

test('detects stalemate', async () => {
  const board = {
    h8: { type: 'K', color: 'b' },
    f7: { type: 'K', color: 'w' },
    f6: { type: 'Q', color: 'w' },
  };
  const result = await runWorker({ board, move: { from: 'f6', to: 'g6' }, playerColor: 'w' });
  expect(result.status).toBe('stalemate');
  expect(result.aiMove).toBeUndefined();
});
