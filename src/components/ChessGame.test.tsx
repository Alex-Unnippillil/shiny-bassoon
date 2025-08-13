import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

class MockWorker {
  onmessage: ((e: MessageEvent) => void) | null = null;
  postMessage(): void {}
  terminate(): void {}
}
(globalThis as unknown as { Worker: unknown }).Worker = MockWorker as unknown as {
  new (): Worker;
};

test('renders without crashing', () => {
  render(
    <GameProvider>
      <ChessGame />
    </GameProvider>,
  );
});

