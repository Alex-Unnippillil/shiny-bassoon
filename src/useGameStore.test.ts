import { renderHook, act } from '@testing-library/react';
import useGameStore from './useGameStore';

const FEN_KEY = 'game_fen';
const HISTORY_KEY = 'game_history';

describe('useGameStore', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('initialises state from localStorage', () => {
    localStorage.setItem(FEN_KEY, 'saved-fen');
    localStorage.setItem(HISTORY_KEY, JSON.stringify(['e4']));

    const getItemSpy = jest.spyOn(Storage.prototype, 'getItem');
    const { result } = renderHook(() => useGameStore());

    expect(result.current.fen).toBe('saved-fen');
    expect(result.current.history).toEqual(['e4']);
    expect(getItemSpy).toHaveBeenCalledWith(FEN_KEY);
    expect(getItemSpy).toHaveBeenCalledWith(HISTORY_KEY);
  });

  test('addMove updates history and exportPGN persists to localStorage', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useGameStore());
    setItemSpy.mockClear();

    act(() => {
      result.current.addMove('e4');
      result.current.addMove('e5');
    });

    expect(result.current.history).toEqual(['e4', 'e5']);
    expect(result.current.exportPGN()).toBe('e4 e5');
    expect(localStorage.getItem(HISTORY_KEY)).toBe(JSON.stringify(['e4', 'e5']));
    expect(setItemSpy).toHaveBeenCalledWith(HISTORY_KEY, JSON.stringify(['e4', 'e5']));
  });

  test('importFEN sets new FEN and clears history', () => {
    const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.addMove('e4');
    });
    setItemSpy.mockClear();

    act(() => {
      result.current.importFEN('new-fen');
    });

    expect(result.current.fen).toBe('new-fen');
    expect(result.current.history).toEqual([]);
    expect(localStorage.getItem(FEN_KEY)).toBe('new-fen');
    expect(localStorage.getItem(HISTORY_KEY)).toBe(JSON.stringify([]));
    expect(setItemSpy).toHaveBeenCalledWith(FEN_KEY, 'new-fen');
    expect(setItemSpy).toHaveBeenCalledWith(HISTORY_KEY, JSON.stringify([]));
  });
});
