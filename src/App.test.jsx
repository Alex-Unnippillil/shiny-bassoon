import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App.jsx';
import { BoardProvider } from './boardStore.js';

describe('App chess game', () => {
  class MockWorker {
    onmessage = null;
    postMessage = jest.fn(() => {
      setTimeout(() => {
        this.onmessage?.({ data: { type: 'AI_MOVE', from: 'e7', to: 'e5' } });
      }, 0);
    });
    terminate = jest.fn();
  }

  beforeEach(() => {
    globalThis.Worker = MockWorker;
  });

  function renderWithProvider() {
    return render(
      <BoardProvider>
        <App />
      </BoardProvider>
    );
  }

  test('renders full initial board', () => {
    const { container } = renderWithProvider();
    expect(container.querySelector('[data-square="a1"] .piece')).toBeInTheDocument();
    expect(container.querySelector('[data-square="e2"] .piece')).toBeInTheDocument();
    expect(container.querySelector('[data-square="h8"] .piece')).toBeInTheDocument();
  });

  test('makes moves and supports undo and reset', async () => {
    const { container } = renderWithProvider();

    fireEvent.click(container.querySelector('[data-square="e2"]'));
    fireEvent.click(container.querySelector('[data-square="e4"]'));

    await waitFor(() =>
      expect(container.querySelector('[data-square="e5"] .piece')).toBeInTheDocument()
    );

    expect(screen.getByTestId('move-list')).toHaveTextContent('e4');
    expect(screen.getByTestId('move-list')).toHaveTextContent('e5');

    // undo twice to revert both moves
    fireEvent.click(screen.getByText(/undo/i));
    fireEvent.click(screen.getByText(/undo/i));

    expect(container.querySelector('[data-square="e2"] .piece')).toBeInTheDocument();
    expect(container.querySelector('[data-square="e4"] .piece')).not.toBeInTheDocument();
    expect(screen.getByTestId('move-list')).toBeEmptyDOMElement();

    // reset
    fireEvent.click(screen.getByText(/reset/i));
    expect(container.querySelector('[data-square="e2"] .piece')).toBeInTheDocument();
  });
});
