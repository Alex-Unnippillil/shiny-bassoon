import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { GameProvider } from '../store';
import ChessGame from './ChessGame';

describe('ChessGame', () => {
  class MockWorker {
    onmessage = null;
    // When the user posts a move, immediately respond with a fixed AI move
    postMessage = jest.fn(() => {
      setTimeout(() => {
        this.onmessage?.({ data: { move: { from: 'e7', to: 'e5' } } });
      }, 0);
    });
    terminate = jest.fn();
  }

  beforeEach(() => {
    globalThis.Worker = MockWorker;
  });

  function renderWithProvider() {
    return render(
      <GameProvider>
        <ChessGame />
      </GameProvider>
    );
  }

  test('renders initial board state', () => {
    const { container } = renderWithProvider();
    expect(
      container.querySelector('[data-square="e2"] .piece')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-square="e7"] .piece')
    ).toBeInTheDocument();
  });

  test('submits move, shows AI response, allows undo and reset', async () => {
    const { container } = renderWithProvider();

    // submit player move e2 -> e4
    fireEvent.click(container.querySelector('[data-square="e2"]')!);
    fireEvent.click(container.querySelector('[data-square="e4"]')!);

    expect(
      container.querySelector('[data-square="e4"] .piece')
    ).toBeInTheDocument();

    // AI responds
    await waitFor(() =>
      expect(
        container.querySelector('[data-square="e5"] .piece')
      ).toBeInTheDocument()
    );

    // Move list should include both moves
    expect(screen.getByTestId('move-list')).toHaveTextContent('e4');
    expect(screen.getByTestId('move-list')).toHaveTextContent('e5');

    // Undo last moves
    fireEvent.click(screen.getByText(/undo/i));

    expect(
      container.querySelector('[data-square="e2"] .piece')
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-square="e4"] .piece')
    ).not.toBeInTheDocument();
    expect(screen.getByTestId('move-list')).toBeEmptyDOMElement();

    // Reset board
    fireEvent.click(screen.getByText(/reset/i));

    expect(container.querySelector('[data-square="e2"] .piece')).toBeInTheDocument();
    expect(screen.getByTestId('move-list')).toBeEmptyDOMElement();
  });
});

