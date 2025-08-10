import { Chess } from 'chess.js';

self.onmessage = (e: MessageEvent<{ fen: string }>) => {
  const { fen } = e.data;
  const chess = new Chess(fen);
  const moves = chess.moves({ verbose: true });
  let move = moves.find((m) => m.from === 'e7' && m.to === 'e5');
  if (!move) move = moves[0];
  if (move) {
    chess.move(move);
    (self as unknown as Worker).postMessage({ from: move.from, to: move.to });
  }
};
