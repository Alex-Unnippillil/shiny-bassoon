import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).Worker = class {
    onmessage: ((ev: MessageEvent) => void) | null = null;
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    postMessage() {}
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    terminate() {}
  };
});

test('renders undo and reset controls', () => {
  const { getByText } = render(
    <GameProvider>
      <ChessGame />
    </GameProvider>,
  );
  expect(getByText(/Undo/i)).toBeInTheDocument();
  expect(getByText(/Reset/i)).toBeInTheDocument();
});
