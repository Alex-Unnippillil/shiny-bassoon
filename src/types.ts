export type Color = 'w' | 'b';

export interface Piece {
  type: 'P' | 'K' | 'Q' | 'R' | 'B' | 'N';
  color: Color;
}

export type Board = Record<string, Piece>;

export interface Move {
  from: string;
  to: string;
}

export type WorkerRequest =
  | ({ type: 'PLAYER_MOVE' } & Move)
  | { type: 'GET_LEGAL_MOVES'; square: string }
  | { type: 'INIT'; fen?: string };

export type WorkerResponse =
  | ({ type: 'AI_MOVE' } & Move)
  | { type: 'LEGAL_MOVES'; square: string; moves: string[] }
  | { type: 'CHECKMATE'; winner: Color }
  | { type: 'STALEMATE' }
  | { type: 'ERROR'; message: string; legalMoves?: string[] };
