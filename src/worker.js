importScripts('https://cdn.jsdelivr.net/npm/chess.js@1.0.0/dist/chess.min.js');

self.onmessage = (e) => {
  const { fen } = e.data;
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) {
    self.postMessage(null);
    return;
  }
  const move = moves[Math.floor(Math.random() * moves.length)];
  self.postMessage({ from: move.from, to: move.to, promotion: 'q' });
};
