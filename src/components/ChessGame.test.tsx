import React, { act } from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from './ChessGame';
import { GameProvider } from '../store';

describe('ChessGame', () => {
  let originalWorker: typeof Worker;

  beforeEach(() => {
    originalWorker = global.Worker;
  });

  afterEach(() => {
    global.Worker = originalWorker;
    jest.clearAllMocks();
  });

  test('player move posts to worker and updates move list', () => {
    const mockWorker: {
      postMessage: jest.Mock;
      onmessage: ((e: { data: unknown }) => void) | null;
      terminate: jest.Mock;
    } = {
      postMessage: jest.fn(),
      onmessage: null,
      terminate: jest.fn(),
    };
    global.Worker = jest.fn(() => mockWorker as unknown as Worker);

    const { container, getByTestId } = render(
      <GameProvider>
        <ChessGame />
      </GameProvider>
    );

    const from = container.querySelector('[data-square="e2"]')!;
    const to = container.querySelector('[data-square="e4"]')!;
    fireEvent.click(from);
    fireEvent.click(to);

    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      move: { from: 'e2', to: 'e4' },
    });
    expect(getByTestId('move-list')).toHaveTextContent('e4');
    expect(
      container.querySelector('[data-square="e4"] .piece')
    ).toHaveTextContent('♙');
  });

  test('AI move from worker updates the board', () => {
    const mockWorker: {
      postMessage: jest.Mock;
      onmessage: ((e: { data: unknown }) => void) | null;
      terminate: jest.Mock;
    } = {
      postMessage: jest.fn(),
      onmessage: null,
      terminate: jest.fn(),
    };
    global.Worker = jest.fn(() => mockWorker as unknown as Worker);

    const { container, getByTestId } = render(
      <GameProvider>
        <ChessGame />
      </GameProvider>
    );

    const from = container.querySelector('[data-square="e2"]')!;
    const to = container.querySelector('[data-square="e4"]')!;
    fireEvent.click(from);
    fireEvent.click(to);

    act(() => {
      mockWorker.onmessage?.({
        data: { move: { from: 'e7', to: 'e5' } },
      });
    });

    expect(
      container.querySelector('[data-square="e5"] .piece')
    ).toHaveTextContent('♟︎');
    expect(getByTestId('move-list')).toHaveTextContent('e4 e5');
  });
});

