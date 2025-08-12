import React, {
  createContext,
  useReducer,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import type { Board, Color, Piece } from './types';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

function initialBoard(): Board {
  const board: Board = {};
  const backRank: Piece['type'][] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
  for (let i = 0; i < 8; i++) {
    const file = files[i];
    board[file + '1'] = { type: backRank[i], color: 'w' };
    board[file + '2'] = { type: 'P', color: 'w' };
    board[file + '7'] = { type: 'P', color: 'b' };
    board[file + '8'] = { type: backRank[i], color: 'b' };
  }
  return board;
}

function boardToFEN(board: Board, turn: Color): string {
  const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
  const rows = ranks.map((rank) => {
    let row = '';
    let empty = 0;
    for (const file of files) {
      const piece = board[file + rank];
      if (piece) {
        if (empty) {
          row += empty;
          empty = 0;
        }
        const char = piece.type;
        row += piece.color === 'w' ? char : char.toLowerCase();
      } else {
        empty += 1;
      }
    }
    if (empty) row += empty;
    return row;
  });
  return rows.join('/') + ` ${turn === 'w' ? 'w' : 'b'} - - 0 1`;
}

function boardFromFEN(fen: string): { board: Board; turn: Color } {
  const [placement, active] = fen.trim().split(' ');
  const rows = placement.split('/');
  const board: Board = {};
  rows.forEach((row, rIdx) => {
    let fileIdx = 0;
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        fileIdx += Number(char);
      } else {
        const color: Color = char === char.toUpperCase() ? 'w' : 'b';
        const type = char.toUpperCase() as Piece['type'];
        const square = files[fileIdx] + (8 - rIdx);
        board[square] = { type, color };
        fileIdx += 1;
      }
    }
  });
  const turn: Color = active === 'b' ? 'b' : 'w';
  return { board, turn };
}

function applyPGN(pgn: string): {
  board: Board;
  history: string[];
  boardHistory: Board[];
  turn: Color;
} {
  const moves = pgn
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  let board = initialBoard();
  const history: string[] = [];
  const boardHistory: Board[] = [board];
  let turn: Color = 'w';
  for (const mv of moves) {
    const from = mv.slice(0, 2);
    const to = mv.slice(2, 4);
    board = movePiece(board, from, to);
    history.push(mv);
    boardHistory.push(board);
    turn = turn === 'w' ? 'b' : 'w';
  }
  return { board, history, boardHistory, turn };
}

function movePiece(board: Board, from: string, to: string): Board {
  const moving = board[from];
  const newBoard = { ...board };
  newBoard[to] = moving;
  delete newBoard[from];
  return newBoard;
}

type Orientation = 'white' | 'black';

type Action =
  | { type: 'PLAYER_MOVE'; from: string; to: string }
  | { type: 'AI_MOVE'; from: string; to: string }
  | { type: 'FLIP_ORIENTATION' }
  | { type: 'UNDO' }
  | { type: 'RESET' }
  | { type: 'LOAD_FEN'; fen: string }
  | { type: 'LOAD_PGN'; pgn: string };

interface BoardState {
  board: Board;
  orientation: Orientation;
  turn: Color;
  history: string[];
  boardHistory: Board[];
}

interface BoardActions {
  playerMove: (from: string, to: string) => void;
  aiMove: (from: string, to: string) => void;
  flipOrientation: () => void;
  undo: () => void;
  reset: () => void;
  importFEN: (fen: string) => void;
  exportFEN: () => string;
  importPGN: (pgn: string) => void;
  exportPGN: () => string;
}

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE': {
      const newBoard = movePiece(state.board, action.from, action.to);
      const move = action.from + action.to;
      return {
        ...state,
        board: newBoard,
        turn: state.turn === 'w' ? 'b' : 'w',
        history: [...state.history, move],
        boardHistory: [...state.boardHistory, newBoard],
      };
    }
    case 'UNDO': {
      if (state.boardHistory.length <= 1) return state;
      const newBoardHistory = state.boardHistory.slice(0, -1);
      const board = newBoardHistory[newBoardHistory.length - 1];
      const history = state.history.slice(0, -1);
      const turn: Color = history.length % 2 === 0 ? 'w' : 'b';
      return { ...state, board, boardHistory: newBoardHistory, history, turn };
    }
    case 'RESET': {
      const board = initialBoard();
      return {
        ...state,
        board,
        boardHistory: [board],
        history: [],
        turn: 'w',
      };
    }
    case 'LOAD_FEN': {
      const { board, turn } = boardFromFEN(action.fen);
      return {
        ...state,
        board,
        boardHistory: [board],
        history: [],
        turn,
      };
    }
    case 'LOAD_PGN': {
      const { board, history, boardHistory, turn } = applyPGN(action.pgn);
      return { ...state, board, history, boardHistory, turn };
    }
    case 'FLIP_ORIENTATION':
      return {
        ...state,
        orientation: state.orientation === 'white' ? 'black' : 'white',
      };
    default:
      return state;
  }
}

const BoardContext = createContext<
  { state: BoardState; actions: BoardActions } | null
>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const initial = initialBoard();
  const [state, dispatch] = useReducer(reducer, {
    board: initial,
    orientation: 'white' as Orientation,
    turn: 'w' as Color,
    history: [] as string[],
    boardHistory: [initial],
  });

  const actions = useMemo<BoardActions>(
    () => ({
      playerMove: (from, to) => dispatch({ type: 'PLAYER_MOVE', from, to }),
      aiMove: (from, to) => dispatch({ type: 'AI_MOVE', from, to }),
      flipOrientation: () => dispatch({ type: 'FLIP_ORIENTATION' }),
      undo: () => dispatch({ type: 'UNDO' }),
      reset: () => dispatch({ type: 'RESET' }),
      importFEN: (fen: string) => dispatch({ type: 'LOAD_FEN', fen }),
      exportFEN: () => boardToFEN(state.board, state.turn),
      importPGN: (pgn: string) => dispatch({ type: 'LOAD_PGN', pgn }),
      exportPGN: () => state.history.join(' '),
    }),
    [dispatch, state],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardState(): BoardState {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardState must be used within BoardProvider');
  }
  return context.state;
}

export function useBoardActions(): BoardActions {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardActions must be used within BoardProvider');
  }
  return context.actions;
}
