import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import App from './App';
import { BoardProvider } from './boardStore';
import type { WorkerRequest } from './types';

afterEach(() => {
  // cleanup worker global
});

class MockWorker {
  static instances: MockWorker[] = [];
  public onmessage: ((e: { data: unknown }) => void) | null = null;
  public messages: WorkerRequest[] = [];
  constructor() {
    MockWorker.instances.push(this);
  }
  postMessage(msg: WorkerRequest) {
    this.messages.push(msg);
    if (msg.type === 'REQUEST_AI_MOVE') {
      this.onmessage?.({ data: { type: 'AI_MOVE', from: 'e2', to: 'e4' } });
    }
  }
  terminate() {}
}

test('choosing black requests AI move and applies it', async () => {
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

  const playBlack = getByText('Play Black');
  fireEvent.click(playBlack);

  const worker = MockWorker.instances[0];
  await waitFor(() =>
    expect(worker.messages.some(m => m.type === 'REQUEST_AI_MOVE')).toBe(true),
  );

  const e2 = container.querySelector('[data-square="e2"]') as HTMLElement;
  const e4 = container.querySelector('[data-square="e4"]') as HTMLElement;
  await waitFor(() => expect(e2.textContent).toBe(''));
  await waitFor(() => expect(e4.textContent).toBe('♙'));

  globalObj.Worker = OriginalWorker;
});

