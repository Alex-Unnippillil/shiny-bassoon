/** @jest-environment node */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const esbuild = require('esbuild');

class MockWorker {
  constructor(url) {
    const code = fs.readFileSync(path.resolve(__dirname, url), 'utf8');
    const { code: js } = esbuild.transformSync(code, { loader: 'ts' });
    const sandbox = {
      self: {
        postMessage: (data) => {
          if (this.onmessage) {
            this.onmessage({ data });
          }
        },
        onmessage: null,
      },
    };
    vm.runInNewContext(js, sandbox);
    this._onmessage = sandbox.self.onmessage;
    this.onmessage = null;
  }

  postMessage(data) {
    if (this._onmessage) {
      this._onmessage({ data });
    }
  }

  terminate() {}
}

function runWorker(fen) {
  return new Promise((resolve) => {
    const OriginalWorker = global.Worker;
    global.Worker = MockWorker;
    const worker = new Worker('./workers/engineWorker.ts');
    worker.onmessage = (event) => {
      resolve(event.data);
      global.Worker = OriginalWorker;
    };
    worker.postMessage({ type: 'move', fen });
  });
}

test('engine responds with e7e5 to opening move', async () => {
  const fen = 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1';
  const result = await runWorker(fen);
  expect(result).toEqual({ type: 'aiMove', move: 'e7e5' });
});
