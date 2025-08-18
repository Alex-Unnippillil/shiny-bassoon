import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MoveHistory } from './App';
import useGameStore from './useGameStore';

test('displays moves in pairs in order', () => {
  const { result } = renderHook(() => useGameStore());
  const theme = createTheme();
  const { rerender, getByText } = render(
    <ThemeProvider theme={theme}>
      <MoveHistory history={result.current.history} />
    </ThemeProvider>,
  );

  act(() => result.current.addMove('e4'));
  rerender(
    <ThemeProvider theme={theme}>
      <MoveHistory history={result.current.history} />
    </ThemeProvider>,
  );

  act(() => result.current.addMove('e5'));
  rerender(
    <ThemeProvider theme={theme}>
      <MoveHistory history={result.current.history} />
    </ThemeProvider>,
  );

  expect(getByText('1. e4 e5')).toBeTruthy();
});
