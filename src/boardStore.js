import React, {
  createContext,
  useReducer,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback,
} from 'react';

const FEN_KEY = 'game_fen';
const HISTORY_KEY = 'game_history';

function safeJSONParse(str, fallback) {
  try {
    return JSON.parse(str);
  } catch (_) {
    return fallback;
  }
}

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
  const [boardState, dispatch] = useReducer(reducer, {
    board: initialBoard(),
    orientation: 'white'
  });

  const [fen, setFen] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem(FEN_KEY) || '';
    }
    return '';
  });

  const [history, setHistory] = useState(() => {
    if (typeof localStorage !== 'undefined') {
      return safeJSONParse(localStorage.getItem(HISTORY_KEY), []);
    }
    return [];
  });

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(FEN_KEY, fen);
    }
  }, [fen]);

  useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    }
  }, [history]);

  const addMove = useCallback(move => {
    setHistory(h => [...h, move]);
  }, []);

  const exportPGN = useCallback(() => history.join(' '), [history]);

  const importFEN = useCallback(newFen => {
    setFen(newFen);
    setHistory([]);
  }, []);

  const actions = useMemo(() => ({
    playerMove: (from, to) => dispatch({ type: 'PLAYER_MOVE', from, to }),
    aiMove: (from, to) => dispatch({ type: 'AI_MOVE', from, to }),
    flipOrientation: () => dispatch({ type: 'FLIP_ORIENTATION' }),
    setFen,
    addMove,
    exportPGN,
    importFEN
  }), [dispatch, setFen, addMove, exportPGN, importFEN]);

  const state = useMemo(() => ({ ...boardState, fen, history }), [boardState, fen, history]);

  const value = useMemo(() => ({ state, actions }), [state, actions]);

  return React.createElement(BoardContext.Provider, { value }, children);
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
