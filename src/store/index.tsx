import React, { createContext, useContext, useReducer } from 'react';

type Piece = { type: 'P'; color: 'w' | 'b' };
type Board = Record<string, Piece>;

function initialBoard(): Board {
  return {
    e2: { type: 'P', color: 'w' },
    e7: { type: 'P', color: 'b' },
  };
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
        const newHistory = state.history.slice(0, -1);
        const board = newHistory[newHistory.length - 1] || initialBoard();
        return {
          board,
          history: newHistory.length ? newHistory : [initialBoard()],
          moves: state.moves.slice(0, -1),
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

export function GameProvider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
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
