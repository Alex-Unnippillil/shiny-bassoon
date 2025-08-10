import React from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../useGameStore';

export function ChessGame() {
  const { fen, moves, playerMove, aiMove, undo, reset } = useGameStore();
  const workerRef = React.useRef<Worker | null>(null);

  React.useEffect(() => {
    workerRef.current = new Worker(new URL('../worker.js', import.meta.url));
    const worker = workerRef.current;
    worker.onmessage = (e: MessageEvent) => {
      if (e.data) {
        aiMove(e.data);
      }
    };
    return () => {
      worker.terminate();
    };
  }, [aiMove]);

  const onDrop = (source: string, target: string) => {
    const moved = playerMove(source, target);
    if (moved && workerRef.current) {
      workerRef.current.postMessage({ fen: useGameStore.getState().fen });
    }
    return moved;
  };

  return (
    <div>
      <Chessboard position={fen} onPieceDrop={onDrop} />
      <div>
        <h3>Moves</h3>
        <ol>
          {moves.map((m, i) => (
            <li key={i}>{m.san}</li>
          ))}
        </ol>
      </div>
      <button onClick={undo}>Undo</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}

export default ChessGame;

