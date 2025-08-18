import { renderHook, act } from '@testing-library/react';
import useClock from './useClock';

jest.useFakeTimers();

test('counts down for active side', () => {
  const { result } = renderHook(() => useClock(3));

  act(() => {
    result.current.start('white');
  });
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(result.current.white).toBe(1);

  act(() => {
    result.current.start('black');
  });
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(result.current.black).toBe(2);
});

test('pause and reset stop timers', () => {
  const { result } = renderHook(() => useClock(2));

  act(() => {
    result.current.start('white');
  });
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(result.current.white).toBe(1);

  act(() => {
    result.current.pause();
  });
  act(() => {
    jest.advanceTimersByTime(2000);
  });
  expect(result.current.white).toBe(1);

  act(() => {
    result.current.reset();
  });
  expect(result.current.white).toBe(2);
  expect(result.current.black).toBe(2);
});
