const INITIAL_BOARD = Array(9).fill(null);

function createGameStore(worker) {
  const aiWorker = worker || { postMessage: () => {} };
  let board = [...INITIAL_BOARD];
  let history = [ [...board] ];
  let currentPlayer = 'X';

  function makeMove(index) {
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
    history = [ [...board] ];
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

module.exports = { createGameStore, useGameStore: createGameStore() };
