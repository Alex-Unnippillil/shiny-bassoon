export type Color = 'w' | 'b';

export interface Piece {
  type: 'P';
  color: Color;
}

export type Board = Record<string, Piece>;

export interface Move {
  from: string;
  to: string;
}

export type WorkerMessage =
  | ({ type: 'PLAYER_MOVE' } & Move)
  | ({ type: 'AI_MOVE' } & Move);

export interface WorkerRequest {
  board: Board;
  color: Color;
}

export interface WorkerResponse {
  move?: Move;
  error?: string;
}
