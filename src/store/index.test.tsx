import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameStore } from './index';

test('store updates and can undo moves', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );

  const { result } = renderHook(() => useGameStore(), { wrapper });

  act(() => {
    result.current.playerMove('e2', 'e4');
    result.current.aiMove('e7', 'e5');
  });

  expect(result.current.board.e4).toBeTruthy();
  expect(result.current.board.e5).toBeTruthy();

  act(() => {
    result.current.undo();
  });

  expect(result.current.board.e5).toBeUndefined();
});
