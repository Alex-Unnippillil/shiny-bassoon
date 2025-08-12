import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Box, Button } from '@mui/material';
import { useBoardState, useBoardActions } from './boardStore.jsx';

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
  const { playerMove, aiMove, flipOrientation } = useBoardActions();
  const [selected, setSelected] = useState(null);
  const [announcement, setAnnouncement] = useState('');
  const squareRefs = useRef({});
  const workerRef = useRef(null);

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./aiWorker.js', window.location.href));
  }

  useEffect(() => {
    const worker = workerRef.current;
    worker.onmessage = (event) => {
      const { type, from, to } = event.data || {};
      if (type === 'AI_MOVE') {
        aiMove(from, to);
        setAnnouncement(`AI moved from ${from} to ${to}`);
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

  const handleMove = (from, to) => {
    playerMove(from, to);
    setAnnouncement(`Player moved from ${from} to ${to}`);
    workerRef.current.postMessage({ type: 'PLAYER_MOVE', from, to });
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
        role="grid"
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
              role="gridcell"
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
        onClick={() => {
          flipOrientation();
          setAnnouncement(
            `Board orientation ${orientation === 'white' ? 'black' : 'white'}`
          );
        }}
        aria-label="Toggle board orientation"
      >
        Flip Board
      </Button>
      <Box
        aria-live="polite"
        sx={{
          position: 'absolute',
          width: 1,
          height: 1,
          overflow: 'hidden',
          clip: 'rect(1px, 1px, 1px, 1px)'
        }}
      >
        {announcement}
      </Box>
    </Box>
  );
}
