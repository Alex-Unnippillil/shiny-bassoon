import { renderHook, act } from '@testing-library/react';
import useGameStore from './useGameStore';

describe('useGameStore (chess)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initializes and persists FEN', () => {
    localStorage.setItem('game_fen', 'stored-fen');
    localStorage.setItem('game_history', JSON.stringify(['e4']));

    const { result } = renderHook(() => useGameStore());
    expect(result.current.fen).toBe('stored-fen');
    expect(result.current.history).toEqual(['e4']);

    act(() => {
      result.current.setFen('updated-fen');
      result.current.addMove('e5');
    });

    expect(localStorage.getItem('game_fen')).toBe('updated-fen');
    expect(localStorage.getItem('game_history')).toBe(JSON.stringify(['e4', 'e5']));
  });

  test('exports PGN and imports FEN', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.addMove('e4');
      result.current.addMove('e5');
    });
    expect(result.current.exportPGN()).toBe('e4 e5');

    act(() => {
      result.current.importFEN('new-fen');
    });
    expect(result.current.fen).toBe('new-fen');
    expect(result.current.history).toEqual([]);
    expect(localStorage.getItem('game_fen')).toBe('new-fen');
    expect(localStorage.getItem('game_history')).toBe(JSON.stringify([]));
  });
});
