function generatePawnMoves(from, board, color) {
  const moves = [];
  const file = from.charCodeAt(0);
  const rank = parseInt(from[1], 10);
  const forward = color === "w" ? 1 : -1;
  const startRank = color === "w" ? 2 : 7;
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

function choosePawnMove(board, color) {
  const squares = Object.keys(board).sort();
  for (const sq of squares) {
    const piece = board[sq];
    if (piece.type === "P" && piece.color === color) {
      const moves = generatePawnMoves(sq, board, color);
      if (moves.length) return moves[0];
    }
  }
  return null;
}

function handleMessage(event) {
  const { board, color } = event.data || {};
  if (!board || !color) {
    return { error: "Invalid input" };
  }
  const move = choosePawnMove(board, color);
  if (move) {
    return { move };
  }
  return { error: "No legal moves" };
}

if (typeof self !== "undefined") {
  self.onmessage = (event) => {
    const result = handleMessage(event);
    self.postMessage(result);
  };
}

module.exports = { generatePawnMoves, choosePawnMove, handleMessage };
