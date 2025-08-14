import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameStore } from './index';

describe('Game store undo', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <GameProvider>{children}</GameProvider>
  );

  test('undo reverts only the last move', () => {
    const { result } = renderHook(() => useGameStore(), { wrapper });

    act(() => {
      result.current.playerMove('e2', 'e4');
      result.current.aiMove('e7', 'e5');
    });

    expect(result.current.board.e4).toEqual({ type: 'P', color: 'w' });
    expect(result.current.board.e5).toEqual({ type: 'P', color: 'b' });

    act(() => {
      result.current.undo();
    });

    expect(result.current.board.e5).toBeUndefined();
    expect(result.current.board.e7).toEqual({ type: 'P', color: 'b' });
    expect(result.current.board.e4).toEqual({ type: 'P', color: 'w' });
    expect(result.current.moves).toEqual(['e4']);
    expect(result.current.history).toHaveLength(2);
  });

  test('consecutive undos revert multiple moves', () => {
    const { result } = renderHook(() => useGameStore(), { wrapper });

    act(() => {
      result.current.playerMove('e2', 'e4');
      result.current.aiMove('e7', 'e5');
    });

    act(() => {
      result.current.undo();
      result.current.undo();
    });

    expect(result.current.board.e4).toBeUndefined();
    expect(result.current.board.e5).toBeUndefined();
    expect(result.current.board.e2).toEqual({ type: 'P', color: 'w' });
    expect(result.current.board.e7).toEqual({ type: 'P', color: 'b' });
    expect(result.current.moves).toHaveLength(0);
    expect(result.current.history).toHaveLength(1);
  });
});
