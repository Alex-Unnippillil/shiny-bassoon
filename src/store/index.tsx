import React, { createContext, useContext, useReducer } from 'react';

type Piece = { type: 'P'; color: 'w' | 'b' };
type Board = Record<string, Piece>;
type Orientation = 'white' | 'black';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function initialBoard(): Board {
  return {
    e2: { type: 'P', color: 'w' },
    e7: { type: 'P', color: 'b' },
  };
}

function boardToFEN(board: Board): string {
  const rows: string[] = [];
  for (let r = 8; r >= 1; r--) {
    let empty = 0;
    let row = '';
    for (const f of files) {
      const piece = board[f + r];
      if (piece) {
        if (empty) {
          row += empty;
          empty = 0;
        }
        const char = piece.color === 'w' ? 'P' : 'p';
        row += char;
      } else {
        empty++;
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return rows.join('/');
}

function boardFromFEN(fen: string): Board {
  const board: Board = {};
  const [placement] = fen.split(' ');
  const rows = placement.split('/');
  for (let r = 8; r >= 1; r--) {
    const row = rows[8 - r] || '';
    let fileIdx = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) {
        fileIdx += parseInt(ch, 10);
      } else {
        const file = files[fileIdx];
        const color = ch === ch.toUpperCase() ? 'w' : 'b';
        board[file + r] = { type: 'P', color };
        fileIdx++;
      }
    }
  }
  return board;
}

interface State {
  board: Board;
  history: Board[];
  moves: string[];
  orientation: Orientation;
  fen: string;
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

const initialBoardState = initialBoard();
const initialState: State = {
  board: initialBoardState,
  history: [initialBoardState],
  moves: [],
  orientation: 'white',
  fen: boardToFEN(initialBoardState),
};

type Action =
  | { type: 'PLAYER_MOVE'; from: string; to: string }
  | { type: 'AI_MOVE'; from: string; to: string }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'FLIP_ORIENTATION' }
  | { type: 'IMPORT_FEN'; fen: string };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE': {
      const board = movePiece(state.board, action.from, action.to);
      return {
        ...state,
        board,
        history: [...state.history, board],
        moves: [...state.moves, action.from + action.to],
        fen: boardToFEN(board),
      };
    }
    case 'UNDO': {
      if (state.history.length > 1) {
        const newHistory = state.history.slice(0, -1);
        const board = newHistory[newHistory.length - 1];
        return {
          ...state,
          board,
          history: newHistory,
          moves: state.moves.slice(0, -1),
          fen: boardToFEN(board),
        };
      }
      return state;
    }
    case 'RESET': {
      const board = initialBoard();
      return {
        ...state,
        board,
        history: [board],
        moves: [],
        fen: boardToFEN(board),
      };
    }
    case 'FLIP_ORIENTATION': {
      return {
        ...state,
        orientation: state.orientation === 'white' ? 'black' : 'white',
      };
    }
    case 'IMPORT_FEN': {
      const board = boardFromFEN(action.fen);
      return {
        ...state,
        board,
        history: [board],
        moves: [],
        fen: action.fen,
      };
    }
    default:
      return state;
  }
}

const GameContext = createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGameStore() {
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
  const flipOrientation = () => dispatch({ type: 'FLIP_ORIENTATION' });
  const importFEN = (fen: string) => dispatch({ type: 'IMPORT_FEN', fen });
  const exportFEN = () => state.fen;
  const exportPGN = () => state.moves.join(' ');
  return {
    ...state,
    playerMove,
    aiMove,
    undo,
    reset,
    flipOrientation,
    exportFEN,
    exportPGN,
    importFEN,
  };
}

export type { Piece, Board };

