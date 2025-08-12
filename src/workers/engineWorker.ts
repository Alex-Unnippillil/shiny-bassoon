interface Piece {
  type: 'P';
  color: 'w' | 'b';
}

interface Board {
  [square: string]: Piece;
}

interface Move {
  from: string;
  to: string;
}

interface MoveMessage {
  type: 'move';
  board: Board;
  color: 'w' | 'b';
}

interface AIMoveMessage {
  type: 'aiMove';
  from: string;
  to: string;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

function generatePawnMoves(from: string, board: Board, color: 'w' | 'b'): Move[] {
  const moves: Move[] = [];
  const file = from.charCodeAt(0);
  const rank = parseInt(from[1], 10);
  const forward = color === 'w' ? 1 : -1;
  const startRank = color === 'w' ? 2 : 7;
  const targetRank = rank + forward;

  if (targetRank >= 1 && targetRank <= 8) {
    const leftFile = file - 1;
    const rightFile = file + 1;

    if (leftFile >= 97) {
      const leftSq = String.fromCharCode(leftFile) + targetRank;
      if (board[leftSq] && board[leftSq].color !== color) {
        moves.push({ from, to: leftSq });
      }
    }

    if (rightFile <= 104) {
      const rightSq = String.fromCharCode(rightFile) + targetRank;
      if (board[rightSq] && board[rightSq].color !== color) {
        moves.push({ from, to: rightSq });
      }
    }

    const forwardOne = String.fromCharCode(file) + targetRank;
    const forwardTwo = String.fromCharCode(file) + (rank + forward * 2);

    if (rank === startRank && !board[forwardOne] && !board[forwardTwo]) {
      moves.push({ from, to: forwardTwo });
    }

    if (!board[forwardOne]) {
      moves.push({ from, to: forwardOne });
    }
  }

  return moves;
}

export function computeAIMove(board: Board, color: 'w' | 'b'): Move | null {
  const squares = Object.keys(board).sort();
  for (const sq of squares) {
    const piece = board[sq];
    if (piece.type === 'P' && piece.color === color) {
      const moves = generatePawnMoves(sq, board, color);
      if (moves.length) return moves[0];
    }
  }
  return null;
}

self.onmessage = function (event: MessageEvent<MoveMessage>) {
  const { board, color } = event.data || {};
  if (!board || !color) {
    const message: ErrorMessage = { type: 'error', message: 'Invalid input' };
    (self as unknown as Worker).postMessage(message);
    return;
  }
  const move = computeAIMove(board, color);
  if (move) {
    const message: AIMoveMessage = { type: 'aiMove', from: move.from, to: move.to };
    (self as unknown as Worker).postMessage(message);
  } else {
    const message: ErrorMessage = { type: 'error', message: 'No legal moves' };
    (self as unknown as Worker).postMessage(message);
  }
};

