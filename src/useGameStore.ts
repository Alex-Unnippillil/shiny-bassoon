import React, { useState, useEffect, useCallback } from 'react';

const FEN_KEY = 'game_fen';
const HISTORY_KEY = 'game_history';

function safeJSONParse<T>(str: string | null, fallback: T): T {
  try {
    return str ? (JSON.parse(str) as T) : fallback;
  } catch {
    return fallback;
  }
}

interface GameStore {
  fen: string;
  setFen: React.Dispatch<React.SetStateAction<string>>;
  history: string[];
  addMove: (move: string) => void;
  exportPGN: () => string;
  importFEN: (newFen: string) => void;
}

export default function useGameStore(): GameStore {
  // initialise state from localStorage when available
  const [fen, setFen] = useState<string>(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(FEN_KEY) || '';
    }
    return '';
  });

  const [history, setHistory] = useState<string[]>(() => {
    if (typeof localStorage !== 'undefined') {
      return safeJSONParse<string[]>(localStorage.getItem(HISTORY_KEY), []);
    }
    return [];
  });

  // persist FEN whenever it changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FEN_KEY, fen);
    }
  }, [fen]);

  // persist move history whenever it changes
  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  // add a move to history
  const addMove = useCallback((move: string) => {
    setHistory((h) => [...h, move]);
  }, []);

  // export the move history as a simple PGN string
  const exportPGN = useCallback(() => {
    return history.join(' ');
  }, [history]);

  // import a FEN position and reset move history
  const importFEN = useCallback((newFen: string) => {
    setFen(newFen);
    setHistory([]);
  }, []);

  return { fen, setFen, history, addMove, exportPGN, importFEN };
}
