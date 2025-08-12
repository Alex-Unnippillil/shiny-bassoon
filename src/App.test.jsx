import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import App from './App.jsx';
import { BoardProvider } from './boardStore.js';

test('creates a single worker and terminates on unmount', () => {
  const OriginalWorker = global.Worker;
  const terminate = jest.fn();
  const MockWorker = jest.fn(() => ({
    postMessage: jest.fn(),
    terminate,
    onmessage: null,
  }));
  global.Worker = MockWorker;

  const { unmount } = render(
    <BoardProvider>
      <App />
    </BoardProvider>
  );

  // trigger a re-render
  fireEvent.click(screen.getByRole('button', { name: /toggle board orientation/i }));
  fireEvent.click(screen.getByRole('button', { name: /toggle board orientation/i }));

  expect(MockWorker).toHaveBeenCalledTimes(1);

  unmount();
  expect(terminate).toHaveBeenCalledTimes(1);

  global.Worker = OriginalWorker;
});
