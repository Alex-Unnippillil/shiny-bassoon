import { Chess } from 'chess.js';
import { create } from 'zustand';

type Move = {
  san: string;
};

interface GameState {
  game: Chess;
  moves: Move[];
  fen: string;
  playerMove: (from: string, to: string) => boolean;
  aiMove: (move: { from: string; to: string; promotion?: string }) => void;
  undo: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  game: new Chess(),
  moves: [],
  fen: new Chess().fen(),
  playerMove: (from, to) => {
    const game = get().game;
    const move = game.move({ from, to, promotion: 'q' });
    if (move) {
      set({ moves: [...get().moves, { san: move.san }], fen: game.fen() });
      return true;
    }
    return false;
  },
  aiMove: (move) => {
    const game = get().game;
    const result = game.move(move);
    if (result) {
      set({ moves: [...get().moves, { san: result.san }], fen: game.fen() });
    }
  },
  undo: () => {
    const game = get().game;
    const undone = game.undo();
    if (undone) {
      set({ moves: get().moves.slice(0, -1), fen: game.fen() });
    }
  },
  reset: () => {
    const game = new Chess();
    set({ game, moves: [], fen: game.fen() });
  },
}));

