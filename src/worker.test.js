/** @jest-environment node */

import path from 'path';
import { pathToFileURL } from 'url';
import { Worker } from 'worker_threads';

function runWorker(input) {
  return new Promise((resolve, reject) => {
    const workerUrl = pathToFileURL(path.resolve(__dirname, './worker.js')).href;
    const worker = new Worker(
      `
        import { parentPort } from 'worker_threads';
        const self = {
          postMessage: (data) => parentPort.postMessage(data),
          onmessage: null,
        };
        globalThis.self = self;
        await import('${workerUrl}');
        parentPort.on('message', (data) => self.onmessage({ data }));
      `,
      { eval: true, type: 'module' },
    );

    worker.on('message', (data) => resolve(data));
    worker.on('error', reject);
    worker.postMessage(input);
  });
}

test('pawn moves two squares from starting rank', async () => {
  const result = await runWorker({ board: { e7: { type: 'P', color: 'b' } }, color: 'b' });
  expect(result).toEqual({ move: { from: 'e7', to: 'e5' } });
});

test('pawn moves one square when double step is blocked', async () => {
  const board = {
    e7: { type: 'P', color: 'b' },
    e5: { type: 'P', color: 'w' },
  };
  const result = await runWorker({ board, color: 'b' });
  expect(result).toEqual({ move: { from: 'e7', to: 'e6' } });
});

test('pawn captures diagonally', async () => {
  const board = {
    e4: { type: 'P', color: 'w' },
    d5: { type: 'P', color: 'b' },
  };
  const result = await runWorker({ board, color: 'w' });
  expect(result).toEqual({ move: { from: 'e4', to: 'd5' } });
});

