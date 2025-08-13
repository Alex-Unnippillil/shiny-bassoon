import React, { createContext, useContext, useReducer } from 'react';
import { Chess } from 'chess.js';
import { INITIAL_FEN } from '../constants';
import type { Piece, Board } from '../types';

function initialBoard(): Board {
  const chess = new Chess(INITIAL_FEN);
  const board: Board = {};
  const files = 'abcdefgh';
  const grid = chess.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = grid[r][c];
      if (piece) {
        const square = `${files[c]}${8 - r}`;
        board[square] = {
          type: piece.type.toUpperCase() as Piece['type'],
          color: piece.color,
        };
      }
    }
  }
  return board;
}

interface State {
  board: Board;
  history: Board[];
  moves: string[];
}

function movePiece(board: Board, from: string, to: string): Board {
  const piece = board[from];
  const newBoard: Board = { ...board };
  if (piece) {
    newBoard[to] = piece;
    delete newBoard[from];
  }
  return newBoard;
}

const initialState: State = {
  board: initialBoard(),
  history: [initialBoard()],
  moves: [],
};

type Action =
  | { type: 'PLAYER_MOVE'; from: string; to: string }
  | { type: 'AI_MOVE'; from: string; to: string }
  | { type: 'UNDO' }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE': {
      const board = movePiece(state.board, action.from, action.to);
      return {
        board,
        history: [...state.history, board],
        moves: [...state.moves, action.to],
      };
    }
    case 'UNDO': {
      if (state.history.length > 1) {
        const newHistory = state.history.slice(0, -2);
        const board = newHistory[newHistory.length - 1] || initialBoard();
        return {
          board,
          history: newHistory.length ? newHistory : [initialBoard()],
          moves: state.moves.slice(0, -2),
        };
      }
      return state;
    }
    case 'RESET': {
      const board = initialBoard();
      return { board, history: [board], moves: [] };
    }
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

interface GameStore extends State {
  playerMove: (from: string, to: string) => void;
  aiMove: (from: string, to: string) => void;
  undo: () => void;
  reset: () => void;
}

export function useGameStore(): GameStore {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGameStore must be used within GameProvider');
  }
  const { state, dispatch } = context;
  const playerMove = (from: string, to: string) =>
    dispatch({ type: 'PLAYER_MOVE', from, to });
  const aiMove = (from: string, to: string) =>
    dispatch({ type: 'AI_MOVE', from, to });
  const undo = () => dispatch({ type: 'UNDO' });
  const reset = () => dispatch({ type: 'RESET' });
  return { ...state, playerMove, aiMove, undo, reset };
}

export type { Piece, Board };
