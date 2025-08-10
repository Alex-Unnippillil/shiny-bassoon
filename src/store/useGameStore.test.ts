const { renderHook, act } = require('@testing-library/react');
const { useGameStore } = require('./useGameStore');

// Mock the worker/AI layer so tests remain synchronous
class MockWorker {
  onmessage = null;
  postMessage() {
    // no-op for synchronous tests
  }
  terminate() {
    // no-op
  }
}

// @ts-ignore
global.Worker = MockWorker;

describe('useGameStore', () => {
  test('sequence of valid moves updates board and history', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.makeMove('e2', 'e4');
      result.current.makeMove('e7', 'e5');
    });

    const board = result.current.board;
    const history = result.current.history;

    // Expect pieces to have moved
    expect(board[4][4]?.type).toBe('p'); // white pawn on e4
    expect(board[6][4]).toBeNull(); // e2 should now be empty
    expect(board[3][4]?.type).toBe('p'); // black pawn on e5
    expect(board[1][4]).toBeNull(); // e7 should now be empty

    expect(history).toHaveLength(2);
  });

  test('undoMove reverts to the previous state', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.makeMove('e2', 'e4');
      result.current.makeMove('e7', 'e5');
      result.current.undoMove();
    });

    const board = result.current.board;

    // e5 should be empty again and e7 restored
    expect(board[3][4]).toBeNull();
    expect(board[1][4]?.type).toBe('p');

    expect(result.current.history).toHaveLength(1);
  });

  test('resetGame clears the board and history', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.makeMove('e2', 'e4');
      result.current.resetGame();
    });

    const board = result.current.board;

    // After reset, the initial pawn should be back at e2 and e4 empty
    expect(board[6][4]?.type).toBe('p');
    expect(board[4][4]).toBeNull();
    expect(result.current.history).toHaveLength(0);
  });
});
