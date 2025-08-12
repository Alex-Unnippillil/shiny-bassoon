const INITIAL_BOARD: (string | null)[] = Array(9).fill(null);

interface GameStore {
  readonly board: (string | null)[];
  readonly history: (string | null)[][];
  readonly currentPlayer: string;
  makeMove: (index: number) => void;
  undoMove: () => void;
  resetGame: () => void;
}

export function createGameStore(
  worker?: { postMessage: (msg: unknown) => void },
): GameStore {
  const aiWorker = worker || { postMessage: () => {} };
  let board = [...INITIAL_BOARD];
  let history = [[...board]];
  let currentPlayer: 'X' | 'O' = 'X';

  function makeMove(index: number): void {
    if (board[index] !== null) return;
    board[index] = currentPlayer;
    history.push([...board]);
    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (typeof aiWorker.postMessage === 'function') {
      aiWorker.postMessage({ board: [...board], player: currentPlayer });
    }
  }

  function undoMove(): void {
    if (history.length > 1) {
      history.pop();
      board = [...history[history.length - 1]];
      currentPlayer = history.length % 2 === 1 ? 'X' : 'O';
    }
  }

  function resetGame(): void {
    board = [...INITIAL_BOARD];
    history = [[...board]];
    currentPlayer = 'X';
  }

  const store: GameStore = {
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

  return store;
}

export const useGameStore: GameStore = createGameStore();
