import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

beforeAll(() => {
  (global as any).Worker = class {
    onmessage: ((e: any) => void) | null = null;
    postMessage() {}
    terminate() {}
  };
});

describe('ChessGame', () => {
  test('renders board', () => {
    const { container } = render(
      <GameProvider>
        <ChessGame />
      </GameProvider>,
    );
    expect(container.querySelector('.board')).toBeInTheDocument();
  });
});
