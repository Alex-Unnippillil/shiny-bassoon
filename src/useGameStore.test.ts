import { renderHook, act } from '@testing-library/react';
import useGameStore from './useGameStore';

test('adds moves to history', () => {
  const { result } = renderHook(() => useGameStore());
  act(() => {
    result.current.addMove('e4');
  });
  expect(result.current.history).toEqual(['e4']);
});
