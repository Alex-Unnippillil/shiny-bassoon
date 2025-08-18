import React from 'react';
import { render, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { DndProvider } from 'react-dnd';
import { TestBackend, type ITestBackend } from 'react-dnd-test-backend';
import App from './App';
import { BoardProvider } from './boardStore';

type WorkerRequest = import('./types').WorkerRequest;

class MockWorker {
  public onmessage: ((e: { data: unknown }) => void) | null = null;
  postMessage(msg: WorkerRequest) {
    if (msg.type === 'GET_LEGAL_MOVES') {
      this.onmessage?.({
        data: { type: 'LEGAL_MOVES', square: msg.square, moves: ['e3', 'e4'] },
      });
    }
  }
  terminate() {}
}

test.skip('dragging a pawn from e2 to e4 updates the board', async () => {
  const globalObj = global as unknown as { Worker: unknown };
  const OriginalWorker = globalObj.Worker;
  globalObj.Worker = MockWorker as unknown;

  const theme = createTheme();
  let backend: ITestBackend;
  const { container } = render(
    <ThemeProvider theme={theme}>
      <BoardProvider>
        <DndProvider backend={TestBackend} options={{ onCreate: (b: ITestBackend) => (backend = b) }}>
          <App />
        </DndProvider>
      </BoardProvider>
    </ThemeProvider>,
  );

  const from = container.querySelector('[data-square="e2"]') as HTMLElement;
  const sourceId = from.getAttribute('data-handler-id') as string;

  act(() => {
    backend.simulateBeginDrag([sourceId]);
  });

  const to = container.querySelector('[data-square="e4"]') as HTMLElement;
  const targetId = to.getAttribute('data-drop-handler-id') as string;

  act(() => {
    backend.simulateHover([targetId], { clientOffset: { x: 0, y: 0 } });
    backend.simulateDrop();
    backend.simulateEndDrag();
  });

  await waitFor(() => expect(to.textContent).toBe('♙'));
  expect(from.textContent).toBe('');

  globalObj.Worker = OriginalWorker;
});
