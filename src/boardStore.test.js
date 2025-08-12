import { reducer, initialState } from './boardStore.js';
import { Chess } from 'chess.js';

describe('boardStore', () => {
  test('initial board has full setup', () => {
    const state = initialState();
    expect(state.board['a1']).toEqual({ type: 'R', color: 'w' });
    expect(state.board['e1']).toEqual({ type: 'K', color: 'w' });
    expect(state.board['a8']).toEqual({ type: 'R', color: 'b' });
    expect(Object.keys(state.board)).toHaveLength(32);
  });

  test('undo and reset restore state', () => {
    let state = initialState();
    state = reducer(state, { type: 'PLAYER_MOVE', from: 'e2', to: 'e4' });
    expect(state.turn).toBe('b');
    state = reducer(state, { type: 'UNDO' });
    expect(state.turn).toBe('w');
    expect(state.board['e2']).toBeDefined();
    state = reducer(state, { type: 'PLAYER_MOVE', from: 'e2', to: 'e4' });
    state = reducer(state, { type: 'RESET' });
    expect(state.turn).toBe('w');
    expect(state.board['e2']).toBeDefined();
    expect(state.history).toHaveLength(0);
  });

  test('FEN and PGN roundtrip', () => {
    let state = initialState();
    state = reducer(state, { type: 'PLAYER_MOVE', from: 'e2', to: 'e4' });
    state = reducer(state, { type: 'PLAYER_MOVE', from: 'e7', to: 'e5' });
    const fen = state.chess.fen();
    const pgn = state.chess.pgn();

    let newState = initialState();
    newState = reducer(newState, { type: 'IMPORT_FEN', fen });
    expect(newState.chess.fen()).toBe(fen);

    const game = new Chess();
    game.loadPgn(pgn);
    expect(game.fen()).toBe(fen);
  });
});
