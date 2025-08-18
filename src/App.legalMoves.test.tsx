import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';
import { BoardProvider } from './boardStore';

type WorkerRequest = import('./types').WorkerRequest;

afterEach(() => {
  // cleanup worker global
  // jest will reset modules automatically
});

class MockWorker {
  static instances: MockWorker[] = [];
    public onmessage: ((e: { data: unknown }) => void) | null = null;
  public lastMessage: WorkerRequest | null = null;
  constructor() {
    MockWorker.instances.push(this);
  }
  postMessage(msg: WorkerRequest) {
    this.lastMessage = msg;
    if (msg.type === 'GET_LEGAL_MOVES') {
      this.onmessage?.({
        data: {
          type: 'LEGAL_MOVES',
          square: msg.square,
          moves: ['e3', 'e4'],
          difficulty: msg.difficulty,
        },
      });
    }
  }
  terminate() {}
}

test('requests and highlights legal moves', async () => {
  const globalObj = global as unknown as { Worker: unknown };
  const OriginalWorker = globalObj.Worker;
  globalObj.Worker = MockWorker as unknown;

  const theme = createTheme();
  const { container } = render(
    <ThemeProvider theme={theme}>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>,
  );

  const worker = MockWorker.instances[0];

  const e2 = container.querySelector('[data-square="e2"]') as HTMLElement;
  fireEvent.click(e2);
  expect(worker.lastMessage).toEqual({
    type: 'GET_LEGAL_MOVES',
    square: 'e2',
    difficulty: 1,
  });

  const e3 = container.querySelector('[data-square="e3"]') as HTMLElement;
  await waitFor(() => expect(e3.getAttribute('data-legal')).toBe('true'));

  const e5 = container.querySelector('[data-square="e5"]') as HTMLElement;
  fireEvent.click(e5);
  expect(e2.textContent).toBe('♙');
  await waitFor(() => expect(e3.getAttribute('data-legal')).toBeNull());

  globalObj.Worker = OriginalWorker;
});
