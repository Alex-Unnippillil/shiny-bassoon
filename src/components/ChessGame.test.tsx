import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

test('renders chess board', () => {
  const { container } = render(
    <GameProvider>
      <ChessGame />
    </GameProvider>,
  );

  expect(container.querySelector('.board')).toBeInTheDocument();
});

