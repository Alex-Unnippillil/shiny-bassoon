import { renderHook, act } from '@testing-library/react';
import useGameStore from './useGameStore';

test('imports FEN into store', () => {
  const { result } = renderHook(() => useGameStore());
  act(() => {
    result.current.importFEN('4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1');
  });
  expect(result.current.fen).toBe('4k3/8/8/8/8/8/4Q3/4K3 w - - 0 1');
});
