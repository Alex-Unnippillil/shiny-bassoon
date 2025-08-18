import { Chess, type Move as ChessMove } from 'chess.js';
import { INITIAL_FEN } from './constants';
import type { WorkerRequest, WorkerResponse, Difficulty } from './types';

let game = new Chess(INITIAL_FEN);
let difficulty: Difficulty = 1;

function send(message: WorkerResponse) {
  (self as unknown as { postMessage: (msg: WorkerResponse) => void }).postMessage(
    message,
  );
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
};

function evaluate(g: Chess): number {
  let sum = 0;
  const board = g.board();
  for (const row of board) {
    for (const piece of row) {
      if (piece) {
        sum += piece.color === 'w' ? pieceValues[piece.type] : -pieceValues[piece.type];
      }
    }
  }
  return sum;
}

function minimax(g: Chess, depth: number, alpha: number, beta: number, maximizing: boolean): number {
  if (depth === 0 || g.isGameOver()) return evaluate(g);
  const moves = g.moves({ verbose: true }) as ChessMove[];
  if (maximizing) {
    let value = -Infinity;
    for (const m of moves) {
      g.move(m);
      value = Math.max(value, minimax(g, depth - 1, alpha, beta, false));
      g.undo();
      alpha = Math.max(alpha, value);
      if (beta <= alpha) break;
    }
    return value;
  } else {
    let value = Infinity;
    for (const m of moves) {
      g.move(m);
      value = Math.min(value, minimax(g, depth - 1, alpha, beta, true));
      g.undo();
      beta = Math.min(beta, value);
      if (beta <= alpha) break;
    }
    return value;
  }
}

function bestMove(g: Chess, depth: number): ChessMove | null {
  const moves = g.moves({ verbose: true }) as ChessMove[];
  if (moves.length === 0) return null;
  let best: ChessMove | null = null;
  let bestVal = g.turn() === 'w' ? -Infinity : Infinity;
  for (const m of moves) {
    g.move(m);
    const val = minimax(g, depth - 1, -Infinity, Infinity, g.turn() === 'w');
    g.undo();
    if (g.turn() === 'w') {
      if (val > bestVal) {
        bestVal = val;
        best = m;
      }
    } else if (val < bestVal) {
      bestVal = val;
      best = m;
    }
  }
  return best;
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;
  switch (data.type) {
    case 'INIT':
      game = new Chess(data.fen || INITIAL_FEN);
      if (data.difficulty) difficulty = data.difficulty;
      if (game.isCheckmate()) {
        send({ type: 'CHECKMATE', winner: game.turn() === 'w' ? 'b' : 'w', difficulty });
      } else if (game.isStalemate()) {
        send({ type: 'STALEMATE', difficulty });
      }
      break;
    case 'GET_LEGAL_MOVES':
      send({
        type: 'LEGAL_MOVES',
        square: data.square,
        moves: game.moves({ square: data.square, verbose: false }) as string[],
        difficulty,
      });
      break;
    case 'PLAYER_MOVE': {
      if (data.difficulty) difficulty = data.difficulty;
      let move = null;
      try {
        move = game.move({ from: data.from, to: data.to, promotion: 'q' });
      } catch {
        move = null;
      }
      if (!move) {
        send({
          type: 'ERROR',
          message: 'Illegal move',
          legalMoves: game.moves({ square: data.from, verbose: false }) as string[],
          difficulty,
        });
        return;
      }
      if (game.isCheckmate()) {
        send({ type: 'CHECKMATE', winner: move.color, difficulty });
        return;
      }
      if (game.isStalemate()) {
        send({ type: 'STALEMATE', difficulty });
        return;
      }
      const ai = bestMove(game, difficulty);
      if (!ai) {
        if (game.isStalemate()) send({ type: 'STALEMATE', difficulty });
        else send({ type: 'ERROR', message: 'No legal moves', difficulty });
        return;
      }
      game.move(ai);
      send({ type: 'AI_MOVE', from: ai.from, to: ai.to, difficulty });
      if (game.isCheckmate()) {
        send({ type: 'CHECKMATE', winner: ai.color, difficulty });
      } else if (game.isStalemate()) {
        send({ type: 'STALEMATE', difficulty });
      }
      break;
    }
    default:
      break;
  }
};
