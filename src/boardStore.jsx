import React, { createContext, useReducer, useContext, useMemo } from 'react';

function initialBoard() {
  return {
    e2: { type: 'P', color: 'w' },
    e7: { type: 'P', color: 'b' }
  };
}

function movePiece(board, from, to) {
  const moving = board[from];
  const newBoard = { ...board };
  newBoard[to] = moving;
  delete newBoard[from];
  return newBoard;
}

function reducer(state, action) {
  switch (action.type) {
    case 'PLAYER_MOVE':
    case 'AI_MOVE':
      return { ...state, board: movePiece(state.board, action.from, action.to) };
    case 'FLIP_ORIENTATION':
      return { ...state, orientation: state.orientation === 'white' ? 'black' : 'white' };
    default:
      return state;
  }
}

const BoardContext = createContext(null);

export function BoardProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, {
    board: initialBoard(),
    orientation: 'white'
  });

  const actions = useMemo(() => ({
    playerMove: (from, to) => dispatch({ type: 'PLAYER_MOVE', from, to }),
    aiMove: (from, to) => dispatch({ type: 'AI_MOVE', from, to }),
    flipOrientation: () => dispatch({ type: 'FLIP_ORIENTATION' })
  }), [dispatch]);

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
