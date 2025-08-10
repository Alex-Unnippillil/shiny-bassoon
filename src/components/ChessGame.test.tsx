import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { ChessGame, ChessProvider } from './ChessGame';

describe('ChessGame', () => {
  class MockWorker {
    public onmessage: ((ev: MessageEvent) => any) | null = null;
    public postMessage = jest.fn(() => {
      setTimeout(() => {
        this.onmessage && this.onmessage({ data: 'e7e5' } as MessageEvent);
      }, 0);
    });
    public terminate = jest.fn();
  }

  beforeEach(() => {
    // @ts-ignore
    global.Worker = jest.fn(() => new MockWorker());
  });

  test('initial render and move flow with undo and reset', async () => {
    render(
      <ChessProvider>
        <ChessGame />
      </ChessProvider>
    );

    expect(screen.getByTestId('board').textContent).toBe('Board: initial');
    expect(screen.getByTestId('move-list').children).toHaveLength(0);

    fireEvent.change(screen.getByTestId('move-input'), { target: { value: 'e2e4' } });
    fireEvent.click(screen.getByText('Submit'));

    await screen.findByText('e7e5');
    expect(screen.getByTestId('move-list').children).toHaveLength(2);
    expect(screen.getByTestId('board').textContent).toBe('Board: e7e5');

    fireEvent.click(screen.getByText('Undo'));
    await waitFor(() => expect(screen.queryByText('e7e5')).toBeNull());
    expect(screen.getByTestId('move-list').children).toHaveLength(1);
    expect(screen.getByTestId('board').textContent).toBe('Board: e2e4');

    fireEvent.click(screen.getByText('Reset'));
    expect(screen.getByTestId('move-list').children).toHaveLength(0);
    expect(screen.getByTestId('board').textContent).toBe('Board: initial');
  });
});
