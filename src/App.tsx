import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import { Chess } from 'chess.js';
import {
  useBoardState,
  useBoardActions,
} from './boardStore';
import {
  INITIAL_FEN,
} from './constants';
import type {
  Piece,
  Board,
  WorkerRequest,
  WorkerResponse,
} from './types';
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

function boardFromChess(game: Chess): Board {
  const result: Board = {};
  const b = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = b[r][c];
      if (p && (p.type === 'k' || p.type === 'p')) {
        const square = files[c] + (8 - r);
        result[square] = {
          type: p.type.toUpperCase() as 'K' | 'P',
          color: p.color as 'w' | 'b',
        };
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
  const [announcement, setAnnouncement] = useState('');
  const [fenHistory, setFenHistory] = useState<string[]>([
    fen || INITIAL_FEN,
  ]);
  const [fenInput, setFenInput] = useState('');

  const workerRef = useRef<Worker | null>(null);
  const gameRef = useRef(new Chess(fen || INITIAL_FEN));
  const squareRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./aiWorker.ts', import.meta.url));
    workerRef.current.postMessage({
      type: 'INIT',
      fen: fen || INITIAL_FEN,
    } satisfies WorkerRequest);
  }

  useEffect(() => {
    const worker = workerRef.current!;
    worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data;
      switch (data.type) {
        case 'AI_MOVE': {
          aiMove(data.from, data.to);
          gameRef.current.move({
            from: data.from,
            to: data.to,
            promotion: 'q',
          });
          addMove(`${data.from} to ${data.to}`);
          const newFen = gameRef.current.fen();
          setFen(newFen);
          setFenHistory((h) => [...h, newFen]);
          setAnnouncement(`AI moved ${data.from} to ${data.to}`);
          break;
        }
        case 'ERROR': {
          setAnnouncement(
            `Illegal move. Legal moves: ${data.legalMoves?.join(', ')}`,
          );
          break;
        }
        case 'CHECKMATE': {
          setAnnouncement(
            `Checkmate! ${data.winner === 'w' ? 'White' : 'Black'} wins`,
          );
          break;
        }
        case 'STALEMATE': {
          setAnnouncement('Stalemate');
          break;
        }
        default:
          break;
      }
    };
    return () => worker.terminate();
  }, [aiMove, addMove, setFen]);

  const orderedSquares = useMemo(() => {
    const fileOrder = orientation === 'white' ? files : [...files].reverse();
    const rankOrder = orientation === 'white' ? [...ranks].reverse() : ranks;
    const squares: string[] = [];
    for (const r of rankOrder) {
      for (const f of fileOrder) {
        squares.push(f + r);
      }
    }
    return squares;
  }, [orientation]);

  const handleMove = (from: string, to: string) => {
    const move = gameRef.current.move({ from, to, promotion: 'q' });
    if (!move) {
      setAnnouncement('Illegal move');
      return;
    }
    playerMove(from, to);
    addMove(`${from} to ${to}`);
    const newFen = gameRef.current.fen();
    setFen(newFen);
    setFenHistory((h) => [...h, newFen]);
    setAnnouncement(`Player moved ${from} to ${to}`);
    workerRef.current?.postMessage({
      type: 'PLAYER_MOVE',
      from,
      to,
    } satisfies WorkerRequest);
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

  const handleFlip = (): void => {
    const newOrientation = orientation === 'white' ? 'black' : 'white';
    flipOrientation();
    setAnnouncement(`Board orientation is now ${newOrientation} at bottom`);
  };

  const handleUndo = (): void => {
    setFenHistory((h) => {
      if (h.length <= 1) return h;
      const newHistory = h.slice(0, -1);
      const newFen = newHistory[newHistory.length - 1];
      setFen(newFen);
      gameRef.current = new Chess(newFen);
      setBoard(boardFromChess(gameRef.current));
      workerRef.current?.postMessage({
        type: 'INIT',
        fen: newFen,
      } satisfies WorkerRequest);
      return newHistory;
    });
  };

  const handleReset = (): void => {
    importFEN(INITIAL_FEN);
    gameRef.current = new Chess(INITIAL_FEN);
    setFenHistory([INITIAL_FEN]);
    setBoard(boardFromChess(gameRef.current));
    workerRef.current?.postMessage({
      type: 'INIT',
      fen: INITIAL_FEN,
    } satisfies WorkerRequest);
  };

  const handleExport = (): void => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (): void => {
    if (!fenInput) return;
    importFEN(fenInput);
    gameRef.current = new Chess(fenInput);
    setFenHistory([fenInput]);
    setBoard(boardFromChess(gameRef.current));
    workerRef.current?.postMessage({
      type: 'INIT',
      fen: fenInput,
    } satisfies WorkerRequest);
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
          border: '1px solid #333',
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
              aria-label={`square ${sq}${
                piece
                  ? ' with ' +
                    (piece.color === 'w' ? 'white' : 'black') +
                    ' ' +
                    (piece.type === 'P' ? 'pawn' : 'king')
                  : ''
              }`}
              onClick={() => handleSquareClick(sq)}
              onKeyDown={(e) => handleKeyDown(sq, e)}
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
      <Typography data-testid="announcer">{announcement}</Typography>
      <Button
        variant="contained"
        onClick={handleFlip}
        aria-label="Toggle board orientation"
      >
        Flip Board
      </Button>
      <Box display="flex" gap={1} alignItems="center">
        <Button onClick={handleUndo}>Undo</Button>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={handleExport}>Export PGN</Button>
        <TextField
          size="small"
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          placeholder="FEN"
        />
        <Button onClick={handleImport}>Import FEN</Button>
      </Box>
    </Box>
  );
}

