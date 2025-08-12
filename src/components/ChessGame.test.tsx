import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

describe('ChessGame', () => {
  test('renders board and FEN/PGN controls', () => {
    const { getByText, getByPlaceholderText, container } = render(
      <GameProvider>
        <ChessGame />
      </GameProvider>
    );

    expect(container.querySelector('[data-square="e2"]')).toBeInTheDocument();
    expect(getByText(/Download PGN/i)).toBeInTheDocument();
    expect(getByPlaceholderText(/Enter FEN/i)).toBeInTheDocument();
    expect(getByText(/Load FEN/i)).toBeInTheDocument();
  });
});
