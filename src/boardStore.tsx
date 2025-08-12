import React, {
  createContext,
  useReducer,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import type { Board } from './types';

function initialBoard(): Board {
  return {
    a8: { type: 'K', color: 'b' },
    e7: { type: 'P', color: 'b' },
    e2: { type: 'P', color: 'w' },
    h1: { type: 'K', color: 'w' },
  };
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
  | { type: 'FLIP_ORIENTATION' };

interface BoardState {
  board: Board;
  orientation: Orientation;
}

interface BoardActions {
  playerMove: (from: string, to: string) => void;
  aiMove: (from: string, to: string) => void;
  flipOrientation: () => void;
}

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE':
      return { ...state, board: movePiece(state.board, action.from, action.to) };
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
  const [state, dispatch] = useReducer(reducer, {
    board: initialBoard(),
    orientation: 'white' as Orientation,
  });

  const actions = useMemo<BoardActions>(
    () => ({
      playerMove: (from, to) => dispatch({ type: 'PLAYER_MOVE', from, to }),
      aiMove: (from, to) => dispatch({ type: 'AI_MOVE', from, to }),
      flipOrientation: () => dispatch({ type: 'FLIP_ORIENTATION' }),
    }),
    [dispatch],
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
