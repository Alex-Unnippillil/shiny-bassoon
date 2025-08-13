import React, { useRef, useEffect, useState } from 'react';
import { useGameStore } from '../store';
import type { WorkerResponse } from '../types';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

function pieceSymbol(piece: { type: 'P'; color: 'w' | 'b' } | undefined): string | null {
  if (!piece) return null;
  const symbols: Record<string, string> = {
    wP: '♙',
    bP: '♟︎',
  };
  return symbols[piece.color + piece.type];
}

export default function ChessGame(): JSX.Element {
  const { board, moves, playerMove, aiMove, undo, reset } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const workerRef = useRef<Worker | null>(null);

  if (!workerRef.current) {
    workerRef.current = new Worker('./aiWorker.ts');
  }

  useEffect(() => {
    const worker = workerRef.current!;
    worker.onmessage = (e: { data: WorkerResponse }) => {
      const data = e.data;
      if (data.type === 'AI_MOVE') {
        aiMove(data.from, data.to);
      }
    };
    return () => worker.terminate();
  }, [aiMove]);

  const handleSquareClick = (sq: string) => {
    if (selected) {
      playerMove(selected, sq);
      workerRef.current?.postMessage({
        type: 'PLAYER_MOVE',
        from: selected,
        to: sq,
      });
      setSelected(null);
    } else if (board[sq]) {
      setSelected(sq);
    }
  };

  return (
    <div>
      <div
        className="board"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 40px)',
          width: 320,
        }}
      >
        {ranks.flatMap((r) =>
          files.map((f, fileIdx) => {
            const sq = f + r;
            const piece = board[sq];
            const isDark = (fileIdx + r) % 2 === 1;
            return (
              <div
                key={sq}
                data-square={sq}
                onClick={() => handleSquareClick(sq)}
                style={{
                  width: 40,
                  height: 40,
                  backgroundColor: isDark ? '#769656' : '#eeeed2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {piece && <span className="piece">{pieceSymbol(piece)}</span>}
              </div>
            );
          })
        )}
      </div>
      <div data-testid="move-list">{moves.join(' ')}</div>
      <button onClick={undo}>Undo</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
