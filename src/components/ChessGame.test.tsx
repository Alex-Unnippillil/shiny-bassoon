import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

class MockWorker {
  postMessage(): void {}
  addEventListener(): void {}
  removeEventListener(): void {}
  terminate(): void {}
}

global.Worker = MockWorker as unknown as typeof Worker;

describe('ChessGame', () => {
  test('renders chess board with 64 squares', () => {
    const { container } = render(
      <GameProvider>
        <ChessGame />
      </GameProvider>
    );
    expect(container.querySelectorAll('[data-square]').length).toBe(64);
  });
});
