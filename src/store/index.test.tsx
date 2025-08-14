import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameStore } from './index';

describe('Game store undo operations', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <GameProvider>{children}</GameProvider>
  );

  test('single undo reverts the last move', () => {
    const { result } = renderHook(() => useGameStore(), { wrapper });

    act(() => {
      result.current.playerMove('e2', 'e4');
    });

    expect(result.current.board.e4).toEqual({ type: 'P', color: 'w' });
    expect(result.current.history).toHaveLength(2);
    expect(result.current.moves).toEqual(['e4']);

    act(() => {
      result.current.undo();
    });

    expect(result.current.board.e4).toBeUndefined();
    expect(result.current.board.e2).toEqual({ type: 'P', color: 'w' });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.moves).toHaveLength(0);
  });

  test('consecutive undo operations revert multiple moves', () => {
    const { result } = renderHook(() => useGameStore(), { wrapper });

    act(() => {
      result.current.playerMove('e2', 'e4');
      result.current.aiMove('e7', 'e5');
    });

    expect(result.current.board.e4).toEqual({ type: 'P', color: 'w' });
    expect(result.current.board.e5).toEqual({ type: 'P', color: 'b' });
    expect(result.current.history).toHaveLength(3);
    expect(result.current.moves).toEqual(['e4', 'e5']);

    act(() => {
      result.current.undo();
    });

    expect(result.current.board.e5).toBeUndefined();
    expect(result.current.board.e7).toEqual({ type: 'P', color: 'b' });
    expect(result.current.board.e4).toEqual({ type: 'P', color: 'w' });
    expect(result.current.history).toHaveLength(2);
    expect(result.current.moves).toEqual(['e4']);

    act(() => {
      result.current.undo();
    });

    expect(result.current.board.e4).toBeUndefined();
    expect(result.current.board.e2).toEqual({ type: 'P', color: 'w' });
    expect(result.current.board.e7).toEqual({ type: 'P', color: 'b' });
    expect(result.current.history).toHaveLength(1);
    expect(result.current.moves).toHaveLength(0);
  });
});
