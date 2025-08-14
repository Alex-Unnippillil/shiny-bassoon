import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { GameProvider, useGameStore } from './index';

describe('Game store undo', () => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );

  test('undo reverts a single move', () => {
    const { result } = renderHook(() => useGameStore(), { wrapper });
    act(() => result.current.playerMove('e2', 'e4'));
    act(() => result.current.undo());
    expect(result.current.board).toEqual({
      e2: { type: 'P', color: 'w' },
      e7: { type: 'P', color: 'b' },
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.moves).toEqual([]);
  });

  test('undo can be called consecutively', () => {
    const { result } = renderHook(() => useGameStore(), { wrapper });
    act(() => result.current.playerMove('e2', 'e4'));
    act(() => result.current.aiMove('e7', 'e5'));
    act(() => result.current.undo());
    expect(result.current.board).toEqual({
      e4: { type: 'P', color: 'w' },
      e7: { type: 'P', color: 'b' },
    });
    expect(result.current.moves).toEqual(['e4']);
    act(() => result.current.undo());
    expect(result.current.board).toEqual({
      e2: { type: 'P', color: 'w' },
      e7: { type: 'P', color: 'b' },
    });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.moves).toEqual([]);
  });
});
