import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { Chess } from 'chess.js';
import { useBoardState, useBoardActions } from './boardStore';
import type { Piece, WorkerRequest, WorkerResponse, Board } from './types';
import { INITIAL_FEN } from './constants';
import useGameStore from './useGameStore';

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

function boardFromFen(fen: string): Board {
  const game = new Chess(fen);
  const result: Board = {};
  const b = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = b[r][f];
      if (piece) {
        const square = files[f] + (8 - r);
        const type = piece.type.toUpperCase() as 'P' | 'K';
        if (type === 'P' || type === 'K') {
          result[square] = { type, color: piece.color };
        }
      }
    }
  }
  return result;
}

export default function App(): JSX.Element {
  const { board, orientation } = useBoardState();
  const { playerMove, aiMove, flipOrientation, setBoard } = useBoardActions();
  const { fen, setFen, history, addMove, exportPGN, importFEN } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const [fenInput, setFenInput] = useState('');
  const squareRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const workerRef = useRef<Worker | null>(null);
  const gameRef = useRef(new Chess(fen || INITIAL_FEN));

  useEffect(() => {
    const worker = new Worker(new URL('./aiWorker.ts', import.meta.url));
    workerRef.current = worker;
    worker.postMessage({ type: 'INIT', fen: fen || INITIAL_FEN } satisfies WorkerRequest);
    if (!fen) setFen(INITIAL_FEN);

    worker.onmessage = e => {
      const data = e.data as WorkerResponse;
      switch (data.type) {
        case 'AI_MOVE': {
          aiMove(data.from, data.to);
          const move = gameRef.current.move({ from: data.from, to: data.to, promotion: 'q' });
          if (move) {
            addMove(move.san);
            setFen(gameRef.current.fen());
          }
          break;
        }
        case 'CHECKMATE':
          setStatus(`Checkmate! ${data.winner === 'w' ? 'White' : 'Black'} wins`);
          break;
        case 'STALEMATE':
          setStatus('Stalemate');
          break;
        case 'ERROR':
          setStatus(data.message);
          break;
        default:
          break;
      }
    };

    return () => worker.terminate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const orderedSquares = useMemo(() => {
    const fileOrder = orientation === 'white' ? files : [...files].reverse();
    const rankOrder = orientation === 'white' ? [...ranks].reverse() : ranks;
    const squares = [] as string[];
    for (const r of rankOrder) {
      for (const f of fileOrder) {
        squares.push(f + r);
      }
    }
    return squares;
  }, [orientation]);

  const handleMove = (from: string, to: string): void => {
    const move = gameRef.current.move({ from, to, promotion: 'q' });
    if (!move) {
      setStatus('Illegal move');
      return;
    }
    playerMove(from, to);
    addMove(move.san);
    setFen(gameRef.current.fen());
    workerRef.current?.postMessage({ type: 'PLAYER_MOVE', from, to } satisfies WorkerRequest);
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

  const handleDownload = () => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFen = () => {
    if (!fenInput) return;
    importFEN(fenInput);
    gameRef.current = new Chess(fenInput);
    setFen(gameRef.current.fen());
    setBoard(boardFromFen(fenInput));
    workerRef.current?.postMessage({ type: 'INIT', fen: fenInput } satisfies WorkerRequest);
    setFenInput('');
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
      <Button
        variant="contained"
        onClick={handleFlip}
        aria-label="Toggle board orientation"
      >
        Flip Board
      </Button>
      <Button variant="contained" onClick={handleDownload}>
        Download PGN
      </Button>
      <Box display="flex" gap={1}>
        <input
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          placeholder="Enter FEN"
        />
        <Button variant="contained" onClick={handleImportFen}>
          Load FEN
        </Button>
      </Box>
      {history.length > 0 && (
        <Typography>{history.join(' ')}</Typography>
      )}
      {status && <Typography>{status}</Typography>}
      {announcement && (
        <Typography aria-live="polite" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
          {announcement}
        </Typography>
      )}
    </Box>
  );
}
