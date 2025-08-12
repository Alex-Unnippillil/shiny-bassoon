import { createGameStore, WorkerLike } from './useGameStore';

describe('useGameStore', () => {
  let store: ReturnType<typeof createGameStore>;
  let mockWorker: WorkerLike & { postMessage: jest.Mock };

  beforeEach(() => {
    mockWorker = { postMessage: jest.fn() };
    store = createGameStore(mockWorker);
  });

  test('sequence of valid moves updates board and history', () => {
    store.makeMove(0); // X
    store.makeMove(1); // O

    expect(store.board[0]).toBe('X');
    expect(store.board[1]).toBe('O');
    expect(store.history).toHaveLength(3); // initial + two moves
    expect(store.history[1][0]).toBe('X');
    expect(store.history[2][1]).toBe('O');
    expect(mockWorker.postMessage).toHaveBeenCalledTimes(2);
  });

  test('undoMove reverts to the previous state', () => {
    store.makeMove(0);
    store.makeMove(1);

    store.undoMove();

    expect(store.board[1]).toBeNull();
    expect(store.board[0]).toBe('X');
    expect(store.history).toHaveLength(2);
    expect(store.currentPlayer).toBe('O');
  });

  test('resetGame clears the board and history', () => {
    store.makeMove(0);
    store.resetGame();

    expect(store.board).toEqual(Array(9).fill(null));
    expect(store.history).toEqual([Array(9).fill(null)]);
    expect(store.currentPlayer).toBe('X');
  });
});
