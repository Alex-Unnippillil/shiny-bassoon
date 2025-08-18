import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button, TextField, List, ListItem, ListItemText } from '@mui/material';
import { Chess } from 'chess.js';
import { useBoardState, useBoardActions } from './boardStore';
import useGameStore from './useGameStore';
import useClock from './useClock';
import type { Piece, WorkerRequest, WorkerResponse, Board } from './types';
import { INITIAL_FEN } from './constants';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

const pieceNames: Record<Piece['type'], string> = {
  P: 'pawn',
  K: 'king',
  Q: 'queen',
  R: 'rook',
  B: 'bishop',
  N: 'knight',
};

function pieceSymbol(piece: Piece | undefined): string | null {
  if (!piece) return null;
  const symbols: Record<string, string> = {
    wP: '♙',
    bP: '♟︎',
    wK: '♔',
    bK: '♚',
    wQ: '♕',
    bQ: '♛',
    wR: '♖',
    bR: '♜',
    wB: '♗',
    bB: '♝',
    wN: '♘',
    bN: '♞',
  };
  return symbols[piece.color + piece.type];
}

function boardFromGame(game: Chess): Board {
  const newBoard: Board = {};
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece) {
        const file = files[f];
        const rank = 8 - r;
        newBoard[file + rank] = {
          type: piece.type.toUpperCase() as Piece['type'],
          color: piece.color as Piece['color'],
        };
      }
    }
  }
  return newBoard;
}


}

export default function App(): JSX.Element {
  const { board, orientation } = useBoardState();
  const { playerMove, aiMove, flipOrientation, setBoard } = useBoardActions();
  const { fen, setFen, history, addMove, exportPGN, importFEN } = useGameStore();
  const [selected, setSelected] = useState<string | null>(null);

  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [fenInput, setFenInput] = useState('');
  const squareRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const workerRef = useRef<Worker | null>(null);
  const gameRef = useRef(new Chess(fen || INITIAL_FEN));
  const { white, black, start, pause, reset } = useClock(300);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    start('white');
  }, [start]);

  useEffect(() => {
    if (white === 0) {
      setAnnouncement('White ran out of time. Black wins.');
      setGameOver(true);
      pause();
    } else if (black === 0) {
      setAnnouncement('Black ran out of time. White wins.');
      setGameOver(true);
      pause();
    }
  }, [white, black, pause]);

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./aiWorker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const data = e.data;
      switch (data.type) {
        case 'AI_MOVE':
          aiMove(data.from, data.to);
          gameRef.current.move({ from: data.from, to: data.to, promotion: 'q' });
          addMove(data.to);
          setFen(gameRef.current.fen());
          setAnnouncement(`AI moved ${data.from} to ${data.to}`);
          start('white');
          break;
        case 'CHECKMATE':
          setAnnouncement(`Checkmate: ${data.winner === 'w' ? 'White' : 'Black'} wins`);
          break;
        case 'STALEMATE':
          setAnnouncement('Stalemate');
          break;

        case 'ERROR':
          setAnnouncement(data.message);
          if (data.legalMoves) {
            const moves = data.legalMoves.map(m => {
              const match = m.match(/[a-h][1-8]/g);
              return match ? match[match.length - 1] : m;
            });
            setLegalMoves(moves);
          }
          break;
        default:
          break;
      }
    };
    workerRef.current.postMessage({
      type: 'INIT',
      fen: fen || INITIAL_FEN,
    } as WorkerRequest);
  }

  useEffect(() => {
    return () => workerRef.current?.terminate();
  }, []);

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
    if (!legalMoves.includes(to)) return;
    const move = gameRef.current.move({ from, to, promotion: 'q' });
    if (!move) return;
    playerMove(from, to);
    workerRef.current?.postMessage({ type: 'PLAYER_MOVE', from, to } as WorkerRequest);
    addMove(to);
    setFen(gameRef.current.fen());
    setAnnouncement(`Player moved ${from} to ${to}`);
    setLegalMoves([]);
    start('black');
  };

  const handleSquareClick = (square: string) => {

      setSelected(square);
      workerRef.current?.postMessage({
        type: 'GET_LEGAL_MOVES',
        square,
      } as WorkerRequest);
      return;
    }

    if (square === selected) {
      setSelected(null);
      setLegalMoves([]);
      return;
    }

    handleMove(selected, square);
    setSelected(null);
    setLegalMoves([]);
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

  const handleUndo = () => {
    const g = gameRef.current;
    if (g.history().length < 2) return; // ensure both player & AI moves exist
    g.undo(); // undo AI move
    g.undo(); // undo player move
    const newBoard = boardFromGame(g);
    setBoard(newBoard);
    const newHistory = history.slice(0, -2);
    importFEN(g.fen());
    newHistory.forEach((m) => addMove(m));
    workerRef.current?.postMessage({ type: 'INIT', fen: g.fen() } as WorkerRequest);
    setAnnouncement('Undo last move');
  };

  const handleReset = () => {
    const g = new Chess(INITIAL_FEN);
    gameRef.current = g;
    setBoard(boardFromGame(g));
    importFEN(INITIAL_FEN);
    workerRef.current?.postMessage({ type: 'INIT', fen: INITIAL_FEN } as WorkerRequest);
    setAnnouncement('Game reset');
    reset();
    setGameOver(false);
    start('white');
  };

  const handleExport = () => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      const g = new Chess(fenInput);
      gameRef.current = g;
      setBoard(boardFromGame(g));
      importFEN(fenInput);
      workerRef.current?.postMessage({ type: 'INIT', fen: fenInput } as WorkerRequest);
      setAnnouncement('FEN imported');
    } catch {
      setAnnouncement('Invalid FEN');
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
      <Box data-testid="black-timer">{formatTime(black)}</Box>
      <Box
        display="flex"
        gap={2}
        width="100%"
        maxWidth={600}
        flexDirection={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'center', sm: 'flex-start' }}
        justifyContent="center"
      >
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
            const isLegal = legalMoves.includes(sq);
            return (
              <Box
                key={sq}
                component="button"
                data-square={sq}
                data-legal={isLegal ? 'true' : undefined}
                role="gridcell"
                ref={(el) => {
                  squareRefs.current[sq] = el as HTMLButtonElement | null;
                }}
                tabIndex={0}
                aria-label={`square ${sq}${
                  piece
                    ?
                        ' with ' +
                        (piece.color === 'w' ? 'white' : 'black') +
                        ' ' +
                        pieceNames[piece.type]
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
                {legalMoves.includes(sq) && (
                  <Box
                    data-legal-marker="true"
                    component="span"
                    sx={{
                      position: 'absolute',
                      display: 'block',
                      width: '60%',
                      height: '60%',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    }}
                  />
                )}
              </Box>
            );
          })}
        </Box>
        <MoveHistory history={history} />
      </Box>
      <Box data-testid="white-timer">{formatTime(white)}</Box>
      <Button
        variant="contained"
        onClick={handleFlip}
        aria-label="Toggle board orientation"
      >
        Flip Board
      </Button>
      <Box display="flex" gap={1} flexWrap="wrap" justifyContent="center">
        <Button variant="contained" onClick={handleUndo}>
          Undo
        </Button>
        <Button variant="contained" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="contained" onClick={handleExport}>
          Export PGN
        </Button>
        <TextField
          size="small"
          value={fenInput}
          onChange={(e) => setFenInput(e.target.value)}
          placeholder="FEN"
        />
        <Button variant="contained" onClick={handleImport}>
          Import FEN
        </Button>
      </Box>
      <div data-testid="announcer" aria-live="polite">
        {announcement}
      </div>
    </Box>
  );
}

