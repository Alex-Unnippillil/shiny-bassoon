import { useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import useGameStore from '../useGameStore';

const ChessGame = () => {
  const makeMove = useGameStore((s) => s.makeMove);
  const undo = useGameStore((s) => s.undo);
  const reset = useGameStore((s) => s.reset);
  const getFen = useGameStore((s) => s.getFen);
  const fen = useGameStore((s) => s.getFen());
  const moves = useGameStore((s) => s.moves);

  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(new URL('../aiWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current.onmessage = (e: MessageEvent<{ from: string; to: string }>) => {
      const { from, to } = e.data;
      makeMove(from, to);
    };
    return () => workerRef.current?.terminate();
  }, [makeMove]);

  const onDrop = (source: string, target: string) => {
    const valid = makeMove(source, target);
    if (valid) {
      workerRef.current?.postMessage({ fen: getFen() });
    }
    return valid;
  };

  return (
    <div>
      <Chessboard position={fen} onPieceDrop={onDrop} boardWidth={400} />
      <ol>
        {moves.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ol>
      <button onClick={undo}>Undo</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
};

export default ChessGame;
