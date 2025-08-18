import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameStore } from './index';

test('player move and undo', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );
  const { result } = renderHook(() => useGameStore(), { wrapper });
  act(() => {
    result.current.playerMove('e2', 'e4');
  });
  expect(result.current.board.e4).toBeDefined();
  act(() => {
    result.current.undo();
  });
  expect(result.current.board.e4).toBeUndefined();
});
