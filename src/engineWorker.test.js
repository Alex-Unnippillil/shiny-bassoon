const fs = require('fs');
const path = require('path');
const vm = require('vm');
const ts = require('typescript');

class MockWorker {
  constructor(url) {
    const tsCode = fs.readFileSync(path.resolve(__dirname, url), 'utf8');
    const { outputText: code } = ts.transpileModule(tsCode, { compilerOptions: { module: ts.ModuleKind.CommonJS } });
    const sandbox = {
      exports: {},
      module: { exports: {} },
      self: {
        postMessage: (data) => {
          if (this.onmessage) {
            this.onmessage({ data });
          }
        },
        onmessage: null,
      },
    };
    vm.runInNewContext(code, sandbox);
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

function runWorker(input) {
  return new Promise((resolve) => {
    const OriginalWorker = global.Worker;
    global.Worker = MockWorker;
    const worker = new Worker('./workers/engineWorker.ts');
    worker.onmessage = (event) => {
      resolve(event.data);
      global.Worker = OriginalWorker;
    };
    worker.postMessage({ type: 'move', ...input });
  });
}

test('pawn moves two squares from starting rank', async () => {
  const result = await runWorker({ board: { e7: { type: 'P', color: 'b' } }, color: 'b' });
  expect(result).toEqual({ type: 'aiMove', from: 'e7', to: 'e5' });
});

test('pawn moves one square when double step is blocked', async () => {
  const board = {
    e7: { type: 'P', color: 'b' },
    e5: { type: 'P', color: 'w' },
  };
  const result = await runWorker({ board, color: 'b' });
  expect(result).toEqual({ type: 'aiMove', from: 'e7', to: 'e6' });
});

test('pawn captures diagonally', async () => {
  const board = {
    e4: { type: 'P', color: 'w' },
    d5: { type: 'P', color: 'b' },
  };
  const result = await runWorker({ board, color: 'w' });
  expect(result).toEqual({ type: 'aiMove', from: 'e4', to: 'd5' });
});

