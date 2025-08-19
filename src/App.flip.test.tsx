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

test('flip clears selection and legal moves', async () => {
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

  const e3 = container.querySelector('[data-square="e3"]') as HTMLElement;
  const e4 = container.querySelector('[data-square="e4"]') as HTMLElement;
  await waitFor(() => expect(e3.getAttribute('data-legal')).toBe('true'));

  const flipBtn = getByText('Flip Board');
  fireEvent.click(flipBtn);

  const announcer = container.querySelector('[data-testid="announcer"]') as HTMLElement;
  await waitFor(() => {
    expect(announcer.textContent).toBe('Board orientation changed; selection cleared');
    expect(e3.getAttribute('data-legal')).toBeNull();
    expect(e4.getAttribute('data-legal')).toBeNull();
  });

  fireEvent.click(e4);
  expect(e2.textContent).toBe('♙');
  expect(e4.textContent).toBe('');

  globalObj.Worker = OriginalWorker;
});
