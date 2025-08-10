const React = require('react');

const FEN_KEY = 'game_fen';
const HISTORY_KEY = 'game_history';

function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (_) {
    return fallback;
  }
}

function useGameStore() {
  // initialise state from localStorage when available
  const [fen, setFen] = React.useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(FEN_KEY) || '';
    }
    return '';
  });

  const [history, setHistory] = React.useState(() => {
    if (typeof localStorage !== 'undefined') {
      return safeJSONParse(localStorage.getItem(HISTORY_KEY), []);
    }
    return [];
  });

  // persist FEN whenever it changes
  React.useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FEN_KEY, fen);
    }
  }, [fen]);

  // persist move history whenever it changes
  React.useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  // add a move to history
  const addMove = React.useCallback((move) => {
    setHistory((h) => [...h, move]);
  }, []);

  // export the move history as a simple PGN string
  const exportPGN = React.useCallback(() => {
    return history.join(' ');
  }, [history]);

  // import a FEN position and reset move history
  const importFEN = React.useCallback((newFen) => {
    setFen(newFen);
    setHistory([]);
  }, []);

  return { fen, setFen, history, addMove, exportPGN, importFEN };
}

module.exports = useGameStore;
