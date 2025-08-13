import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useBoardState, useBoardActions } from './boardStore';
import type { Piece, WorkerRequest, WorkerResponse } from './types';
import { INITIAL_FEN } from './constants';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

function pieceSymbol(piece: Piece | undefined): string | null {
  if (!piece) return null;
  const symbols: Record<string, string> = {
    wP: '♙',
    bP: '♟︎',
    wK: '♔',
    bK: '♚',
  };
  return symbols[piece.color + piece.type];
}

export default function App(): JSX.Element {
  const { board, orientation } = useBoardState();
  const { playerMove, aiMove, flipOrientation } = useBoardActions();
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const squareRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const workerRef = useRef<Worker | null>(null);


  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./aiWorker.ts', import.meta.url));
    workerRef.current.postMessage({ type: 'INIT', fen: INITIAL_FEN } satisfies WorkerRequest);
  }

  useEffect(() => {
    const worker = workerRef.current!;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      switch (msg.type) {
        case 'AI_MOVE':
          aiMove(msg.from, msg.to);
          setAnnouncement(`AI moved ${msg.from} to ${msg.to}`);
          setStatus('');
          break;
        case 'CHECKMATE':
          setStatus(`Checkmate! ${msg.winner === 'w' ? 'White' : 'Black'} wins.`);
          break;
        case 'STALEMATE':
          setStatus('Stalemate.');
          break;
        case 'ERROR':
          setStatus(msg.message);
          break;
        default:
          break;
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

  const handleMove = (from: string, to: string): void => {
    playerMove(from, to);
    workerRef.current?.postMessage({ type: 'PLAYER_MOVE', from, to });
    setStatus('AI thinking...');
    setAnnouncement(`Player moved ${from} to ${to}`);
  };

  const handleSquareClick = (square: string): void => {
    if (selected) {
      handleMove(selected, square);
      setSelected(null);
    } else if (board[square]) {
      setSelected(square);
    }
  };

  const handleKeyDown = (
    square: string,
    e: React.KeyboardEvent<HTMLButtonElement>,
  ): void => {
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

  const handleFlip = () => {
    const newOrientation = orientation === 'white' ? 'black' : 'white';
    flipOrientation();
    setAnnouncement(`Board orientation is now ${newOrientation} at bottom`);
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box
        display="grid"
        gridTemplateColumns="repeat(8, 1fr)"
        role="grid"
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
              role="gridcell"
              ref={(el) => {
                squareRefs.current[sq] = el as HTMLButtonElement | null;
              }}
              tabIndex={0}
              aria-label={`square ${sq}${piece ? ' with ' + (piece.color === 'w' ? 'white' : 'black') + ' ' + (piece.type === 'P' ? 'pawn' : 'king') : ''}`}
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
      <Typography data-testid="announcer" aria-live="polite">
        {announcement}
      </Typography>
      {status && <Typography>{status}</Typography>}
      <Button
        variant="contained"
        onClick={handleFlip}
        aria-label="Toggle board orientation"
      >
        Flip Board
      </Button>
    </Box>
  );
}
