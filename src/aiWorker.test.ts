import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { transformSync } from '@babel/core';
import type { WorkerRequest, WorkerResponse } from './types';
import { INITIAL_FEN } from './constants';

class MockWorker {
  _onmessage: ((e: { data: WorkerRequest }) => void) | null;
  onmessage: ((e: { data: WorkerResponse }) => void) | null;

  constructor(url: string) {
    const filePath = path.resolve(__dirname, url);
    const codeTs = fs.readFileSync(filePath, 'utf8');
    const { code } = transformSync(codeTs, {
      filename: filePath,
      presets: ['@babel/preset-env', '@babel/preset-typescript'],
    })!;
    const sandbox: {
      self: {
        postMessage: (data: WorkerResponse) => void;
        onmessage: ((e: { data: WorkerRequest }) => void) | null;
      };
      exports: Record<string, unknown>;
      module: { exports: Record<string, unknown> };
      require: NodeRequire;
    } = {
      self: {
        postMessage: (data: WorkerResponse) => {
          if (this.onmessage) {
            this.onmessage({ data });
          }
        },
        onmessage: null,
      },
      exports: {},
      module: { exports: {} },
      require,
    };
    vm.runInNewContext(code || '', sandbox, { filename: filePath });
    this._onmessage = sandbox.self.onmessage;
    this.onmessage = null;
  }

  postMessage(data: WorkerRequest) {
    this._onmessage?.({ data });
  }

  terminate() {}
}

function createWorker() {
  const globalObj = globalThis as unknown as { Worker: unknown };
  const OriginalWorker = globalObj.Worker as unknown;
  globalObj.Worker = MockWorker as unknown;
  const worker = new Worker('./aiWorker.ts') as unknown as {
    onmessage: ((e: { data: WorkerResponse }) => void) | null;
    postMessage: (msg: WorkerRequest) => void;
    terminate: () => void;
  };
  (globalObj as { Worker: unknown }).Worker = OriginalWorker;
  return worker;
}

function post(worker: ReturnType<typeof createWorker>, msg: WorkerRequest): Promise<WorkerResponse> {
  return new Promise((resolve) => {
    worker.onmessage = (e) => resolve(e.data);
    worker.postMessage(msg);
  });
}

test('rejects illegal move', async () => {
  const worker = createWorker();
  worker.postMessage({ type: 'INIT', fen: INITIAL_FEN, difficulty: 1 });
  const res = await post(worker, {
    type: 'PLAYER_MOVE',
    from: 'e2',
    to: 'e5',
    difficulty: 1,
  });
  expect(res).toEqual({
    type: 'ERROR',
    message: 'Illegal move',
    legalMoves: ['e3', 'e4'],
    difficulty: 1,
  });
});

test('allows knight move', async () => {
  const worker = createWorker();
  worker.postMessage({ type: 'INIT', fen: INITIAL_FEN, difficulty: 1 });
  const res = await post(worker, {
    type: 'PLAYER_MOVE',
    from: 'g1',
    to: 'f3',
    difficulty: 1,
  });
  expect(res.type).toBe('AI_MOVE');
});

test('allows capture', async () => {
  const worker = createWorker();
  worker.postMessage({
    type: 'INIT',
    fen: 'k7/8/8/3p4/4P3/8/8/7K w - - 0 1',
    difficulty: 1,
  });
  const res = await post(worker, {
    type: 'PLAYER_MOVE',
    from: 'e4',
    to: 'd5',
    difficulty: 1,
  });
  expect(res.type).toBe('AI_MOVE');
});

test('reports checkmate', async () => {
  const worker = createWorker();
  worker.postMessage({
    type: 'INIT',
    fen: '6k1/5Q2/7K/8/8/8/8/8 w - - 0 1',
    difficulty: 1,
  });
  const res = await post(worker, {
    type: 'PLAYER_MOVE',
    from: 'f7',
    to: 'g7',
    difficulty: 1,
  });
  expect(res).toEqual({ type: 'CHECKMATE', winner: 'w', difficulty: 1 });
});

test('reports stalemate', async () => {
  const worker = createWorker();
  worker.postMessage({
    type: 'INIT',
    fen: '8/8/8/8/8/1Q6/K7/k7 w - - 0 1',
    difficulty: 1,
  });
  const res = await post(worker, {
    type: 'PLAYER_MOVE',
    from: 'a2',
    to: 'a3',
    difficulty: 1,
  });
  expect(res).toEqual({ type: 'STALEMATE', difficulty: 1 });
});

test('different difficulties produce different moves', async () => {
  const worker = createWorker();
  const startFen = 'rnbqkbnr/p1pp1ppp/8/1p2p3/8/5N1P/PPPPPPP1/RNBQKB1R w KQkq - 0 3';
  const moves: string[] = [];
  const expectMoves: Record<number, string> = {
    1: 'c6',
    2: 'e4',
    3: 'b7',
  };
  for (const d of [1, 2, 3] as const) {
    worker.postMessage({ type: 'INIT', fen: startFen, difficulty: d });
    const res = await post(worker, {
      type: 'PLAYER_MOVE',
      from: 'g2',
      to: 'g3',
      difficulty: d,
    });
    expect(res).toEqual({
      type: 'AI_MOVE',
      from: d === 1 ? 'b8' : d === 2 ? 'e5' : 'c8',
      to: expectMoves[d],
      difficulty: d,
    });
    moves.push(res.from + res.to);
  }
  expect(new Set(moves).size).toBe(3);
});
