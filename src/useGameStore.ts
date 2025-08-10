import { create } from 'zustand';
import { Chess } from 'chess.js';

interface GameState {
  chess: Chess;
  moves: string[];
  makeMove: (from: string, to: string) => boolean;
  undo: () => void;
  reset: () => void;
  getFen: () => string;
}

const useGameStore = create<GameState>((set, get) => ({
  chess: new Chess(),
  moves: [],
  makeMove: (from, to) => {
    const move = get().chess.move({ from, to, promotion: 'q' });
    if (move) {
      set((state) => ({ moves: [...state.moves, move.san] }));
      return true;
    }
    return false;
  },
  undo: () => {
    const move = get().chess.undo();
    if (move) {
      set((state) => ({ moves: state.moves.slice(0, -1) }));
    }
  },
  reset: () => set({ chess: new Chess(), moves: [] }),
  getFen: () => get().chess.fen(),
}));

export default useGameStore;
