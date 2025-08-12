import { renderHook, act } from '@testing-library/react';
import { useGameStore } from './index';

const FEN_KEY = 'game_fen';
const HISTORY_KEY = 'game_history';

beforeEach(() => {
  localStorage.clear();
});

test('persists FEN across sessions', () => {
  const { result, unmount } = renderHook(() => useGameStore());

  act(() => {
    result.current.setFen('fen-string');
  });

  expect(localStorage.getItem(FEN_KEY)).toBe('fen-string');

  unmount();

  const { result: result2 } = renderHook(() => useGameStore());
  expect(result2.current.fen).toBe('fen-string');
});

test('exports PGN from move history', () => {
  const { result } = renderHook(() => useGameStore());

  act(() => {
    result.current.addMove('e4');
    result.current.addMove('e5');
    result.current.addMove('Nf3');
  });

  expect(result.current.exportPGN()).toBe('e4 e5 Nf3');
});

test('resets and persists move history', () => {
  const { result, unmount } = renderHook(() => useGameStore());

  act(() => {
    result.current.addMove('e4');
    result.current.addMove('e5');
  });

  expect(result.current.history).toEqual(['e4', 'e5']);
  expect(localStorage.getItem(HISTORY_KEY)).toBe(JSON.stringify(['e4', 'e5']));

  act(() => {
    result.current.importFEN('new-fen');
  });

  expect(result.current.history).toEqual([]);

  act(() => {
    result.current.addMove('Nf3');
  });

  expect(result.current.history).toEqual(['Nf3']);

  unmount();

  const { result: result2 } = renderHook(() => useGameStore());
  expect(result2.current.history).toEqual(['Nf3']);
});

