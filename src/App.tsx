import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button, TextField, Typography } from '@mui/material';
import { useBoardState, useBoardActions } from './boardStore';
import type { Piece, WorkerMessage } from './types';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

function pieceSymbol(piece: Piece | undefined): string | null {
  if (!piece) return null;
  const symbols: Record<string, string> = {
    wP: '♙',
    wR: '♖',
    wN: '♘',
    wB: '♗',
    wQ: '♕',
    wK: '♔',
    bP: '♟︎',
    bR: '♜',
    bN: '♞',
    bB: '♝',
    bQ: '♛',
    bK: '♚',
  };
  return symbols[piece.color + piece.type];
}

export default function App() {
  const { board, orientation, history } = useBoardState();
  const {
    playerMove,
    aiMove,
    flipOrientation,
    undo,
    reset,
    importFEN,
    exportFEN,
    exportPGN,
  } = useBoardActions();
  const [selected, setSelected] = useState<string | null>(null);
  const squareRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const workerRef = useRef<Worker | null>(null);
  const [fenInput, setFenInput] = useState('');

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./aiWorker.ts', import.meta.url));
  }

  useEffect(() => {
    const worker = workerRef.current!;
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, from, to } = event.data || {};
      if (type === 'AI_MOVE') {
        aiMove(from, to);
      }
    };
    return () => worker.terminate();
  }, [aiMove]);

  const orderedSquares = useMemo(() => {
    const fileOrder = orientation === 'white' ? files : [...files].reverse();
    const rankOrder = orientation === 'white' ? [...ranks].reverse() : ranks;
    const squares = [];
    for (const r of rankOrder) {
      for (const f of fileOrder) {
        squares.push(f + r);
      }
    }
    return squares;
  }, [orientation]);

  const handleMove = (from: string, to: string) => {
    playerMove(from, to);
    workerRef.current?.postMessage({ type: 'PLAYER_MOVE', from, to } satisfies WorkerMessage);
  };

  const handleSquareClick = (square: string) => {
    if (selected) {
      handleMove(selected, square);
      setSelected(null);
    } else if (board[square]) {
      setSelected(square);
    }
  };

  const handleKeyDown = (square: string, e: React.KeyboardEvent<HTMLButtonElement>) => {
    const index = orderedSquares.indexOf(square);
    let target: string | undefined;
    switch (e.key) {
      case 'ArrowRight':
        target = orderedSquares[index + 1];
        break;
      case 'ArrowLeft':
        target = orderedSquares[index - 1];
        break;
      case 'ArrowUp':
        target = orderedSquares[index - 8];
        break;
      case 'ArrowDown':
        target = orderedSquares[index + 8];
        break;
      case 'Enter':
      case ' ': // space
        e.preventDefault();
        handleSquareClick(square);
        return;
      default:
        return;
    }
    if (target) {
      e.preventDefault();
      squareRefs.current[target]?.focus();
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(8, 1fr)"
        sx={{
          width: '100%',
          maxWidth: 400,
          aspectRatio: '1 / 1',
          border: '1px solid #333'
        }}
      >
        {orderedSquares.map((sq, idx) => {
          const piece = board[sq];
          const isDark = Math.floor(idx / 8) % 2 === idx % 2;
          return (
            <Box
              key={sq}
              component="button"
              data-square={sq}
              ref={(el) => {
                squareRefs.current[sq] = el as HTMLButtonElement | null;
              }}
              tabIndex={0}
              aria-label={`square ${sq}${
                piece ? ' with ' + (piece.color === 'w' ? 'white' : 'black') + ' ' + piece.type : ''
              }`}
              onClick={() => handleSquareClick(sq)}
              onKeyDown={e => handleKeyDown(sq, e)}
              sx={{
                backgroundColor: isDark ? '#769656' : '#eeeed2',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                padding: 0,
                fontSize: 32,
              }}
            >
              {piece && <span className="piece">{pieceSymbol(piece)}</span>}
            </Box>
          );
        })}
      </Box>
      <Box display="flex" gap={1}>
        <Button variant="contained" onClick={flipOrientation} aria-label="Toggle board orientation">
          Flip Board
        </Button>
        <Button variant="contained" onClick={undo} aria-label="Undo last move">
          Undo
        </Button>
        <Button variant="contained" onClick={reset} aria-label="Reset game">
          Reset
        </Button>
      </Box>
      <Box display="flex" flexDirection="column" alignItems="center" gap={1}>
        <Typography variant="h6">Move History</Typography>
        <Box component="ol" sx={{ maxHeight: 100, overflowY: 'auto', m: 0, p: 0 }}>
          {history.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </Box>
      </Box>
      <Box display="flex" gap={1} alignItems="center">
        <TextField
          size="small"
          label="FEN"
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
        />
        <Button variant="outlined" onClick={() => fenInput && importFEN(fenInput)}>
          Load FEN
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigator.clipboard?.writeText(exportFEN())}
        >
          Copy FEN
        </Button>
        <Button
          variant="outlined"
          onClick={() => {
            const pgn = exportPGN();
            const blob = new Blob([pgn], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'game.pgn';
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          Download PGN
        </Button>
      </Box>
    </Box>
  );
}
