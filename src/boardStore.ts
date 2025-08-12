import React, { createContext, useReducer, useContext, useMemo } from 'react';

interface Piece {
  type: 'P';
  color: 'w' | 'b';
}

type Board = Record<string, Piece>;

interface State {
  board: Board;
  orientation: 'white' | 'black';
}

type Action =
  | { type: 'PLAYER_MOVE' | 'AI_MOVE'; from: string; to: string }
  | { type: 'FLIP_ORIENTATION' };

function initialBoard(): Board {
  return {
    e2: { type: 'P', color: 'w' },
    e7: { type: 'P', color: 'b' },
  };
}

function movePiece(board: Board, from: string, to: string): Board {
  const moving = board[from];
  const newBoard = { ...board };
  newBoard[to] = moving;
  delete newBoard[from];
  return newBoard;
}

function reducer(state: State, action: Action): State {
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

interface ContextValue {
  state: State;
  actions: {
    playerMove: (from: string, to: string) => void;
    aiMove: (from: string, to: string) => void;
    flipOrientation: () => void;
  };
}

const BoardContext = createContext<ContextValue | null>(null);

export function BoardProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, {
    board: initialBoard(),
    orientation: 'white',
  });

  const actions = useMemo(
    () => ({
      playerMove: (from: string, to: string) =>
        dispatch({ type: 'PLAYER_MOVE', from, to }),
      aiMove: (from: string, to: string) => dispatch({ type: 'AI_MOVE', from, to }),
      flipOrientation: () => dispatch({ type: 'FLIP_ORIENTATION' }),
    }),
    [dispatch],
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardState(): State {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardState must be used within BoardProvider');
  }
  return context.state;
}

export function useBoardActions(): ContextValue['actions'] {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardActions must be used within BoardProvider');
  }
  return context.actions;
}
