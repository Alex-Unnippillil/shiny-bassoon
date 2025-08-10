import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Chess, Move } from 'chess.js';
import { StoreApi, createStore } from 'zustand';
import { useStore } from 'zustand';

interface GameState {
  chess: Chess;
  moves: Move[];
  makeMove: (from: string, to: string, isAi?: boolean) => void;
  undoMove: () => void;
  resetGame: () => void;
}

export type GameStore = StoreApi<GameState>;

let aiWorker: Worker | null = null;

function initAiWorker(store: GameStore) {
  const worker = new Worker(new URL('../worker.js', import.meta.url));
  worker.onmessage = (e: MessageEvent<{ from: string; to: string }>) => {
    const { from, to } = e.data || {};
    if (from && to) {
      store.getState().makeMove(from, to, true);
    }
  };
  return worker;
}

export const createGameStore = () =>
  createStore<GameState>((set, get) => ({
    chess: new Chess(),
    moves: [],
    makeMove: (from, to, isAi = false) => {
      const { chess } = get();
      const move = chess.move({ from, to });
      if (move) {
        set((state) => ({ moves: [...state.moves, move] }));
        if (!isAi) {
          aiWorker?.postMessage({ fen: chess.fen() });
        }
      }
    },
    undoMove: () => {
      const { chess } = get();
      chess.undo();
      set((state) => ({ moves: state.moves.slice(0, -1) }));
    },
    resetGame: () => {
      set({ chess: new Chess(), moves: [] });
    },
  }));

const GameStoreContext = createContext<GameStore | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<GameStore>();
  if (!storeRef.current) {
    storeRef.current = createGameStore();
  }
  useEffect(() => {
    aiWorker = initAiWorker(storeRef.current!);
    return () => {
      aiWorker?.terminate();
      aiWorker = null;
    };
  }, []);
  return (
    <GameStoreContext.Provider value={storeRef.current}>
      {children}
    </GameStoreContext.Provider>
  );
}

export function useGameStore<T>(selector: (state: GameState) => T): T {
  const store = useContext(GameStoreContext);
  if (!store) {
    throw new Error('useGameStore must be used within GameProvider');
  }
  return useStore(store, selector);
}
