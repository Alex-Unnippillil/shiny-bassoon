import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';
import { BoardProvider } from './boardStore';
import type { WorkerRequest, WorkerResponse } from './types';

class MockWorker {
  static instance: MockWorker | null = null;
  public onmessage: ((e: { data: WorkerResponse }) => void) | null = null;
  public lastMessage: WorkerRequest | null = null;
  constructor() {
    MockWorker.instance = this;
  }
  postMessage(msg: WorkerRequest) {
    this.lastMessage = msg;
    if (msg.type === 'GET_LEGAL_MOVES') {
      const moves: Record<string, string[]> = {
        g2: ['g3', 'g4'],
        f2: ['f3', 'f4'],
      };
      if (moves[msg.square]) {
        this.onmessage?.({ data: { type: 'ERROR', message: '', legalMoves: moves[msg.square] } });
      }
    }
  }
  terminate() {}
}

test('highlights last move and check', async () => {
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

  const worker = MockWorker.instance!;

  // player move g2 to g4
  const g2 = container.querySelector('[data-square="g2"]') as HTMLElement;
  fireEvent.click(g2);
  const g4 = container.querySelector('[data-square="g4"]') as HTMLElement;
  await waitFor(() => expect(g4.getAttribute('data-legal')).toBe('true'));
  fireEvent.click(g4);
  expect(g2.getAttribute('data-last-move')).toBe('from');
  expect(g4.getAttribute('data-last-move')).toBe('to');

  // AI move e7 to e5
  await act(async () => {
    worker.onmessage?.({ data: { type: 'AI_MOVE', from: 'e7', to: 'e5' } });
  });

  // player move f2 to f3
  const f2 = container.querySelector('[data-square="f2"]') as HTMLElement;
  fireEvent.click(f2);
  const f3 = container.querySelector('[data-square="f3"]') as HTMLElement;
  await waitFor(() => expect(f3.getAttribute('data-legal')).toBe('true'));
  fireEvent.click(f3);

  // AI move Qd8 to h4 delivering check
  await act(async () => {
    worker.onmessage?.({ data: { type: 'AI_MOVE', from: 'd8', to: 'h4' } });
  });

  const e1 = container.querySelector('[data-square="e1"]') as HTMLElement;
  expect(e1.getAttribute('data-in-check')).toBe('true');
  expect(container.querySelector('[data-square="d8"]')?.getAttribute('data-last-move')).toBe('from');
  expect(container.querySelector('[data-square="h4"]')?.getAttribute('data-last-move')).toBe('to');

  globalObj.Worker = OriginalWorker;
});
