import { Chess } from 'chess.js';

function boardToFen(board, turn) {
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const rows = [];
  for (let rank = 8; rank >= 1; rank--) {
    let empty = 0;
    let row = '';
    for (const file of files) {
      const sq = file + rank;
      const piece = board[sq];
      if (piece) {
        if (empty) {
          row += empty;
          empty = 0;
        }
        let symbol = piece.type.toLowerCase();
        if (piece.color === 'w') symbol = symbol.toUpperCase();
        row += symbol;
      } else {
        empty++;
      }
    }
    if (empty) row += empty;
    rows.push(row);
  }
  return `${rows.join('/') } ${turn} - - 0 1`;
}

self.onmessage = (event) => {
  try {
    const { board, move, playerColor } = event.data || {};
    if (!board || !move || !playerColor) {
      self.postMessage({ error: 'Invalid input' });
      return;
    }
    const fen = boardToFen(board, playerColor);
    const game = new Chess(fen);
    let attempted;
    try {
      attempted = game.move({ from: move.from, to: move.to, promotion: 'q' });
    } catch {
      attempted = null;
    }
    if (!attempted) {
      self.postMessage({
        error: 'Illegal move',
        legalMoves: game.moves({ verbose: true }).map(m => ({ from: m.from, to: m.to })),
        status: game.isCheckmate() ? 'checkmate' : game.isStalemate() ? 'stalemate' : 'ongoing'
      });
      return;
    }
    if (game.isCheckmate()) {
      self.postMessage({
        playerMove: move,
        legalMoves: [],
        status: 'checkmate'
      });
      return;
    }
    if (game.isStalemate()) {
      self.postMessage({
        playerMove: move,
        legalMoves: [],
        status: 'stalemate'
      });
      return;
    }
    const aiMoveObj = game.moves({ verbose: true })[0];
    if (!aiMoveObj) {
      self.postMessage({
        playerMove: move,
        error: 'AI has no legal moves',
        legalMoves: [],
        status: 'error'
      });
      return;
    }
    game.move(aiMoveObj);
    let status;
    if (game.isCheckmate()) status = 'checkmate';
    else if (game.isStalemate()) status = 'stalemate';
    else status = 'ongoing';
    self.postMessage({
      playerMove: move,
      aiMove: { from: aiMoveObj.from, to: aiMoveObj.to },
      legalMoves: game.moves({ verbose: true }).map(m => ({ from: m.from, to: m.to })),
      status
    });
  } catch (err) {
    self.postMessage({ error: err.message });
  }
};
