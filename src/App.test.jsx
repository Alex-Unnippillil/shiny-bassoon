import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App.jsx';
import { BoardProvider } from './boardStore.jsx';

class MockWorker {
  onmessage = null;
  postMessage() {}
  terminate() {}
}

describe('App accessibility', () => {
  beforeEach(() => {
    global.Worker = MockWorker;
  });

  function renderApp() {
    return render(
      <BoardProvider>
        <App />
      </BoardProvider>
    );
  }

  test('renders board with grid roles', () => {
    const { getByRole, getAllByRole } = renderApp();
    expect(getByRole('grid')).toBeInTheDocument();
    expect(getAllByRole('gridcell')).toHaveLength(64);
  });

  test('arrow keys move focus between squares', () => {
    const { container } = renderApp();
    const start = container.querySelector('[data-square="e2"]');
    const target = () => document.activeElement;
    start.focus();
    fireEvent.keyDown(start, { key: 'ArrowRight' });
    expect(target()).toHaveAttribute('data-square', 'f2');
    fireEvent.keyDown(target(), { key: 'ArrowLeft' });
    expect(target()).toHaveAttribute('data-square', 'e2');
  });
});
