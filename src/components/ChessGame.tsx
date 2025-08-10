import React, { useReducer, useRef, useEffect, useContext, useState } from 'react';

// Simple store implementation using React context
interface State {
  moves: string[];
  board: string;
}

type Action =
  | { type: 'MOVE'; move: string }
  | { type: 'UNDO' }
  | { type: 'RESET' };

const initialState: State = { moves: [], board: 'initial' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'MOVE':
      return { moves: [...state.moves, action.move], board: action.move };
    case 'UNDO': {
      const moves = state.moves.slice(0, -1);
      return { moves, board: moves[moves.length - 1] || 'initial' };
    }
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const StoreCtx = React.createContext<{
  state: State;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const ChessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return <StoreCtx.Provider value={{ state, dispatch }}>{children}</StoreCtx.Provider>;
};

function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('Store not found');
  return ctx;
}

export const ChessGame: React.FC = () => {
  const { state, dispatch } = useStore();
  const [move, setMove] = useState('');
  const workerRef = useRef<Worker | null>(null);

  if (!workerRef.current) {
    workerRef.current = new Worker('worker.js');
  }

  useEffect(() => {
    const worker = workerRef.current!;
    worker.onmessage = (e: MessageEvent) => {
      dispatch({ type: 'MOVE', move: String(e.data) });
    };
    return () => worker.terminate();
  }, [dispatch]);

  const submit = () => {
    if (!move) return;
    dispatch({ type: 'MOVE', move });
    workerRef.current!.postMessage(move);
    setMove('');
  };

  return (
    <div>
      <div data-testid="board">Board: {state.board}</div>
      <input
        data-testid="move-input"
        value={move}
        onChange={e => setMove(e.target.value)}
      />
      <button onClick={submit}>Submit</button>
      <button onClick={() => dispatch({ type: 'UNDO' })}>Undo</button>
      <button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
      <ul data-testid="move-list">
        {state.moves.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
};

export default ChessGame;
