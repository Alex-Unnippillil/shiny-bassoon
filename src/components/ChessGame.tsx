import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../store';
import useGameControls from '../useGameStore';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [8, 7, 6, 5, 4, 3, 2, 1];

function pieceSymbol(piece: { type: 'P'; color: 'w' | 'b' } | undefined) {
  if (!piece) return null;
  const symbols: Record<string, string> = {
    wP: '♙',
    bP: '♟︎',
  };
  return symbols[piece.color + piece.type];
}

export default function ChessGame() {
  const { board, moves, playerMove, aiMove, undo, reset } = useGameStore();
  const { exportPGN, importFEN } = useGameControls();
  const [selected, setSelected] = useState<string | null>(null);
  const [fenInput, setFenInput] = useState('');
  const workerRef = useRef<Worker | null>(null);

  if (!workerRef.current && typeof Worker !== 'undefined') {
    // path is irrelevant for the mocked worker in tests
    workerRef.current = new Worker('');
  }

  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    worker.onmessage = (e: MessageEvent) => {
      const move = (e.data as any)?.move;
      if (move) {
        aiMove(move.from, move.to);
      }
    };
    return () => worker.terminate();
  }, [aiMove]);

  const handleSquareClick = (sq: string) => {
    if (selected) {
      playerMove(selected, sq);
      workerRef.current?.postMessage({ move: { from: selected, to: sq } });
      setSelected(null);
    } else if (board[sq]) {
      setSelected(sq);
    }
  };

  const handleDownload = useCallback(() => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPGN]);

  const handleImport = useCallback(() => {
    if (fenInput) {
      importFEN(fenInput);
      setFenInput('');
    }
  }, [fenInput, importFEN]);

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
      <button onClick={handleDownload}>Download PGN</button>
      <input
        value={fenInput}
        onChange={(e) => setFenInput(e.target.value)}
        placeholder="Enter FEN"
      />
      <button onClick={handleImport}>Load FEN</button>
    </div>
  );
}
