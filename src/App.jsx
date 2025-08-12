import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useBoardState, useBoardActions } from './boardStore.js';

const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ranks = [1, 2, 3, 4, 5, 6, 7, 8];

function pieceSymbol(piece) {
  if (!piece) return null;
  const symbols = {
    wP: '♙',
    bP: '♟︎'
  };
  return symbols[piece.color + piece.type];
}

export default function App() {
  const { board, orientation } = useBoardState();
  const { playerMove: applyPlayerMove, aiMove: applyAiMove, flipOrientation } = useBoardActions();
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('ongoing');
  const squareRefs = useRef({});
  const workerRef = useRef(null);

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url));
  }

  useEffect(() => {
    const worker = workerRef.current;
    worker.onmessage = (event) => {
      const { error, playerMove, aiMove, status } = event.data || {};
      if (error) {
        setError(error);
        return;
      }
      setError(null);
      if (playerMove) {
        applyPlayerMove(playerMove.from, playerMove.to);
      }
      if (aiMove) {
        applyAiMove(aiMove.from, aiMove.to);
      }
      if (status) {
        setStatus(status);
      }
    };
    return () => worker.terminate();
  }, [applyPlayerMove, applyAiMove]);

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

  const handleMove = (from, to) => {
    workerRef.current.postMessage({
      board,
      move: { from, to },
      playerColor: 'w'
    });
  };

  const handleSquareClick = square => {
    if (selected) {
      handleMove(selected, square);
      setSelected(null);
    } else if (board[square]) {
      setSelected(square);
    }
  };

  const handleKeyDown = (square, e) => {
    const index = orderedSquares.indexOf(square);
    let target;
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
              ref={el => (squareRefs.current[sq] = el)}
              tabIndex={0}
              aria-label={`square ${sq}${piece ? ' with ' + (piece.color === 'w' ? 'white' : 'black') + ' pawn' : ''}`}
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
        onClick={flipOrientation}
        aria-label="Toggle board orientation"
      >
        Flip Board
      </Button>
      {error && (
        <Box color="error.main" role="alert">
          {error}
        </Box>
      )}
      {status !== 'ongoing' && !error && (
        <Box role="status">{status}</Box>
      )}
    </Box>
  );
}
