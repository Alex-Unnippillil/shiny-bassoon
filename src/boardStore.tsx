import React, {
  createContext,
  useReducer,
  useContext,
  useMemo,
  ReactNode,
} from 'react';
import { Chess } from 'chess.js';
import { INITIAL_FEN } from './constants';
import type { Board, Piece } from './types';

          type: piece.type.toUpperCase() as Piece['type'],
          color: piece.color as Piece['color'],
        };
      }
    }
  }

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
  | { type: 'SET_BOARD'; board: Board }
  | { type: 'FLIP_ORIENTATION' };

interface BoardState {
  board: Board;
  orientation: Orientation;
}

interface BoardActions {
  playerMove: (from: string, to: string) => void;
  aiMove: (from: string, to: string) => void;
  setBoard: (board: Board) => void;
  flipOrientation: () => void;
}

function reducer(state: BoardState, action: Action): BoardState {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE':
      return { ...state, board: movePiece(state.board, action.from, action.to) };
    case 'SET_BOARD':
      return { ...state, board: action.board };
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

export function BoardProvider({ children }: { children: ReactNode }): JSX.Element {
  const [state, dispatch] = useReducer(reducer, {
    board: initialBoard(),
    orientation: 'white' as Orientation,
  });

  const actions = useMemo<BoardActions>(
    () => ({
      playerMove: (from, to) => dispatch({ type: 'PLAYER_MOVE', from, to }),
      aiMove: (from, to) => dispatch({ type: 'AI_MOVE', from, to }),
      setBoard: (board) => dispatch({ type: 'SET_BOARD', board }),
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
