const path = require('path');

function runWorker(input) {
  return new Promise((resolve) => {
    const workerPath = path.resolve(__dirname, '../worker.js');
    const originalSelf = global.self;
    const mockSelf = {
      onmessage: null,
      postMessage: (data) => resolve(data),
    };
    global.self = mockSelf;
    jest.resetModules();
    require(workerPath);
    mockSelf.onmessage({ data: input });
    global.self = originalSelf;
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
