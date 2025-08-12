const INITIAL_BOARD = Array(9).fill(null);

export function createGameStore(worker?: { postMessage: (msg: any) => void }) {
  const aiWorker = worker || { postMessage: () => {} };
  let board = [...INITIAL_BOARD];
  let history = [[...board]];
  let currentPlayer = 'X';

  function makeMove(index: number) {
    if (board[index] !== null) return;
    board[index] = currentPlayer;
    history.push([...board]);
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (aiWorker && typeof aiWorker.postMessage === 'function') {
      aiWorker.postMessage({ board: [...board], player: currentPlayer });
    }
  }

  function undoMove() {
    if (history.length > 1) {
      history.pop();
      board = [...history[history.length - 1]];
      currentPlayer = history.length % 2 === 1 ? 'X' : 'O';
    }
  }

  function resetGame() {
    board = [...INITIAL_BOARD];
    history = [[...board]];
    currentPlayer = 'X';
  }

  return {
    get board() {
      return board;
    },
    get history() {
      return history;
    },
    get currentPlayer() {
      return currentPlayer;
    },
    makeMove,
    undoMove,
    resetGame,
  };
}

export const useGameStore = createGameStore();
