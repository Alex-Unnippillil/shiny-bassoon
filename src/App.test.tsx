import { render, fireEvent } from '@testing-library/react';
import App from './App';
import { BoardProvider } from './boardStore';

jest.mock('./workerUrl', () => ({ workerUrl: 'worker.js' }));

test('creates a single worker instance across re-renders', () => {
  const originalWorker = global.Worker;
  const workerInstances: Array<{ postMessage: jest.Mock; terminate: jest.Mock; onmessage: ((e: unknown) => void) | null }> = [];

  const WorkerMock = jest.fn(() => {
    const instance = {
      postMessage: jest.fn(),
      terminate: jest.fn(),
      onmessage: null as ((e: unknown) => void) | null,
    };
    workerInstances.push(instance);
    return instance;
  });

  // @ts-expect-error - assigning mock
  global.Worker = WorkerMock;

  const { getByRole, unmount } = render(
    <BoardProvider>
      <App />
    </BoardProvider>,
  );

  expect(WorkerMock).toHaveBeenCalledTimes(1);

  const toggle = getByRole('button', { name: /toggle board orientation/i });
  fireEvent.click(toggle);
  fireEvent.click(toggle);

  expect(WorkerMock).toHaveBeenCalledTimes(1);

  unmount();
  expect(workerInstances[0].terminate).toHaveBeenCalledTimes(1);

  // restore
  global.Worker = originalWorker;
});
