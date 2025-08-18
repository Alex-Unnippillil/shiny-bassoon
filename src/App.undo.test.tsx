import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';
import { BoardProvider } from './boardStore';

type WorkerRequest = import('./types').WorkerRequest;

class MockWorker {
  static instances: MockWorker[] = [];
  public onmessage: ((e: { data: unknown }) => void) | null = null;
  constructor() {
    MockWorker.instances.push(this);
  }
  postMessage(msg: WorkerRequest) {
    if (msg.type === 'GET_LEGAL_MOVES') {
      this.onmessage?.({
        data: { type: 'LEGAL_MOVES', square: msg.square, moves: ['e3', 'e4'] },
      });
    }
  }
  terminate() {}
}

test('undo does nothing when no moves have been made', () => {
  const globalObj = global as unknown as { Worker: unknown };
  const OriginalWorker = globalObj.Worker;
  globalObj.Worker = MockWorker as unknown;

  const theme = createTheme();
  const { container, getByText } = render(
    <ThemeProvider theme={theme}>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>,
  );

  const e2 = container.querySelector('[data-square="e2"]') as HTMLElement;
  expect(e2.textContent).toBe('♙');

  const undoBtn = getByText('Undo');
  fireEvent.click(undoBtn);

  expect(e2.textContent).toBe('♙');

  globalObj.Worker = OriginalWorker;
});

test('undo does nothing when only player move exists', async () => {
  const globalObj = global as unknown as { Worker: unknown };
  const OriginalWorker = globalObj.Worker;
  globalObj.Worker = MockWorker as unknown;

  const theme = createTheme();
  const { container, getByText } = render(
    <ThemeProvider theme={theme}>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>,
  );

  const e2 = container.querySelector('[data-square="e2"]') as HTMLElement;
  fireEvent.click(e2);

  const e4 = container.querySelector('[data-square="e4"]') as HTMLElement;
  await waitFor(() => expect(e4.getAttribute('data-legal')).toBe('true'));

  fireEvent.click(e4);
  await waitFor(() => expect(e4.textContent).toBe('♙'));
  expect(e2.textContent).toBe('');

  const undoBtn = getByText('Undo');
  fireEvent.click(undoBtn);

  await waitFor(() => {
    expect(e4.textContent).toBe('♙');
    expect(e2.textContent).toBe('');
  });

  globalObj.Worker = OriginalWorker;
});
