import React, { createContext, useReducer, useContext, useMemo } from 'react';
import { Chess } from 'chess.js';

function boardFromChess(game) {
  const board = {};
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rows = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = rows[r][c];
      if (piece) {
        const sq = files[c] + (8 - r);
        board[sq] = { type: piece.type.toUpperCase(), color: piece.color };
      }
    }
  }
  return board;
}

function initialState() {
  const chess = new Chess();
  return {
    chess,
    board: boardFromChess(chess),
    orientation: 'white',
    history: [],
    turn: chess.turn(),
  };
}

function reducer(state, action) {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE': {
      const result = state.chess.move({ from: action.from, to: action.to, promotion: 'q' });
      if (!result) return state;
      return {
        ...state,
        board: boardFromChess(state.chess),
        history: state.chess.history(),
        turn: state.chess.turn(),
      };
    }
    case 'UNDO': {
      state.chess.undo();
      return {
        ...state,
        board: boardFromChess(state.chess),
        history: state.chess.history(),
        turn: state.chess.turn(),
      };
    }
    case 'RESET': {
      state.chess.reset();
      return {
        ...state,
        board: boardFromChess(state.chess),
        history: [],
        turn: state.chess.turn(),
      };
    }
    case 'IMPORT_FEN': {
      try {
        state.chess.load(action.fen);
      } catch {
        return state;
      }
      return {
        ...state,
        board: boardFromChess(state.chess),
        history: [],
        turn: state.chess.turn(),
      };
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

const BoardContext = createContext(null);

export function BoardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);

  const actions = useMemo(
    () => ({
      playerMove: (from, to) => dispatch({ type: 'PLAYER_MOVE', from, to }),
      aiMove: (from, to) => dispatch({ type: 'AI_MOVE', from, to }),
      undo: () => dispatch({ type: 'UNDO' }),
      reset: () => dispatch({ type: 'RESET' }),
      importFEN: (fen) => dispatch({ type: 'IMPORT_FEN', fen }),
      flipOrientation: () => dispatch({ type: 'FLIP_ORIENTATION' }),
      exportPGN: () => state.chess.pgn(),
      exportFEN: () => state.chess.fen(),
    }),
    [dispatch, state.chess]
  );

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return <BoardContext.Provider value={value}>{children}</BoardContext.Provider>;
}

export function useBoardState() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardState must be used within BoardProvider');
  }
  return context.state;
}

export function useBoardActions() {
  const context = useContext(BoardContext);
  if (!context) {
    throw new Error('useBoardActions must be used within BoardProvider');
  }
  return context.actions;
}

// Export reducer and initialState for testing
export { reducer, initialState };
