import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { transformSync } from '@babel/core';
import type { WorkerRequest, WorkerResponse, Board } from './types';

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

function runWorker(input: WorkerRequest): Promise<WorkerResponse> {
  return new Promise((resolve) => {
    const globalObj = globalThis as unknown as {
      Worker: unknown;
    };
    const OriginalWorker = globalObj.Worker as unknown;
    globalObj.Worker = MockWorker as unknown;
    const worker = new Worker('./worker.ts') as unknown as {
      onmessage: ((e: { data: WorkerResponse }) => void) | null;
      postMessage: (msg: WorkerRequest) => void;
    };
    worker.onmessage = (event) => {
      resolve(event.data);
      (globalObj as { Worker: unknown }).Worker = OriginalWorker;
    };
    worker.postMessage(input);
  });
}

test('pawn moves two squares from starting rank', async () => {
  const result = await runWorker({
    board: { e7: { type: 'P', color: 'b' } } as const,
    color: 'b',
  });
  expect(result).toEqual({ move: { from: 'e7', to: 'e5' } });
});

test('pawn moves one square when double step is blocked', async () => {
  const board: Board = {
    e7: { type: 'P', color: 'b' },
    e5: { type: 'P', color: 'w' },
  };
  const result = await runWorker({ board, color: 'b' });
  expect(result).toEqual({ move: { from: 'e7', to: 'e6' } });
});

test('pawn captures diagonally', async () => {
  const board: Board = {
    e4: { type: 'P', color: 'w' },
    d5: { type: 'P', color: 'b' },
  };
  const result = await runWorker({ board, color: 'w' });
  expect(result).toEqual({ move: { from: 'e4', to: 'd5' } });
});
