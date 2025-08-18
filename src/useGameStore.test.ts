import { renderHook, act } from '@testing-library/react';
import useGameStore from './useGameStore';

describe('useGameStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initialises state from localStorage', () => {
    localStorage.setItem('game_fen', 'stored-fen');
    localStorage.setItem('game_history', JSON.stringify(['e4', 'e5']));

    const { result } = renderHook(() => useGameStore());

    expect(result.current.fen).toBe('stored-fen');
    expect(result.current.history).toEqual(['e4', 'e5']);
  });

  test('addMove appends to history', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.addMove('e4');
      result.current.addMove('e5');
    });

    expect(result.current.history).toEqual(['e4', 'e5']);
  });

  test('exportPGN concatenates moves', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.addMove('e4');
      result.current.addMove('e5');
      result.current.addMove('Nf3');
    });

    expect(result.current.exportPGN()).toBe('e4 e5 Nf3');
  });

  test('importFEN resets history and updates FEN', () => {
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.addMove('e4');
      result.current.addMove('e5');
    });

    act(() => {
      result.current.importFEN('new-fen');
    });

    expect(result.current.fen).toBe('new-fen');
    expect(result.current.history).toEqual([]);
  });
});
