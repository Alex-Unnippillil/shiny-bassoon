import { renderHook, act } from '@testing-library/react';
import useGameStore from './useGameStore';

function mockLocalStorage() {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => (key in store ? store[key] : null)),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    value: mockLocalStorage(),
    writable: true,
  });
});

test('initializes state from localStorage', () => {
  localStorage.setItem('game_fen', 'initialFEN');
  localStorage.setItem('game_history', JSON.stringify(['e4']));

  const { result } = renderHook(() => useGameStore());
  expect(result.current.fen).toBe('initialFEN');
  expect(result.current.history).toEqual(['e4']);
});

test('addMove appends moves and exportPGN returns them', () => {
  const { result } = renderHook(() => useGameStore());

  act(() => result.current.addMove('e4'));
  act(() => result.current.addMove('e5'));

  expect(result.current.history).toEqual(['e4', 'e5']);
  expect(result.current.exportPGN()).toBe('e4 e5');
});

test('importFEN resets history', () => {
  const { result } = renderHook(() => useGameStore());

  act(() => result.current.addMove('e4'));
  act(() => result.current.importFEN('newFEN'));

  expect(result.current.fen).toBe('newFEN');
  expect(result.current.history).toEqual([]);
});
