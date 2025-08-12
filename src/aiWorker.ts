import { Chess } from 'chess.js';
import { INITIAL_FEN } from './constants';
import type { WorkerRequest, WorkerResponse } from './types';

let game = new Chess(INITIAL_FEN);

function send(message: WorkerResponse) {
  (self as unknown as { postMessage: (msg: WorkerResponse) => void }).postMessage(
    message,
  );
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const data = e.data;
  switch (data.type) {
    case 'INIT':
      game = new Chess(data.fen || INITIAL_FEN);
      if (game.isCheckmate()) {
        send({ type: 'CHECKMATE', winner: game.turn() === 'w' ? 'b' : 'w' });
      } else if (game.isStalemate()) {
        send({ type: 'STALEMATE' });
      }
      break;
    case 'GET_LEGAL_MOVES':
      send({
        type: 'LEGAL_MOVES',
        square: data.square,
        moves: game.moves({ square: data.square, verbose: false }) as string[],
      });
      break;
    case 'PLAYER_MOVE': {
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
        });
        return;
      }
      if (game.isCheckmate()) {
        send({ type: 'CHECKMATE', winner: move.color });
        return;
      }
      if (game.isStalemate()) {
        send({ type: 'STALEMATE' });
        return;
      }
      const aiMoves = game.moves({ verbose: true });
      const ai =
        aiMoves.find(
          m =>
            m.piece === 'p' &&
            Math.abs(parseInt(m.from[1], 10) - parseInt(m.to[1], 10)) === 2,
        ) || aiMoves.find(m => m.piece === 'p') || aiMoves[0];
      if (!ai) {
        if (game.isStalemate()) send({ type: 'STALEMATE' });
        else send({ type: 'ERROR', message: 'No legal moves' });
        return;
      }
      game.move(ai);
      send({ type: 'AI_MOVE', from: ai.from, to: ai.to });
      if (game.isCheckmate()) {
        send({ type: 'CHECKMATE', winner: ai.color });
      } else if (game.isStalemate()) {
        send({ type: 'STALEMATE' });
      }
      break;
    }
    default:
      break;
  }
};
