import { useCallback, useEffect, useState } from 'react';

const FEN_KEY = 'game_fen';
const HISTORY_KEY = 'game_history';

function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

export default function useGameStore() {
  const [fen, setFen] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(FEN_KEY) || '';
    }
    return '';
  });

  const [history, setHistory] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return safeJSONParse(localStorage.getItem(HISTORY_KEY), []);
    }
    return [];
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FEN_KEY, fen);
    }
  }, [fen]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  const addMove = useCallback((move) => {
    setHistory((h) => [...h, move]);
  }, []);

  const exportPGN = useCallback(() => {
    return history.join(' ');
  }, [history]);

  const importFEN = useCallback((newFen) => {
    setFen(newFen);
    setHistory([]);
  }, []);

  return { fen, setFen, history, addMove, exportPGN, importFEN };
}
