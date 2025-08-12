import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from '../ChessGame';

describe('ChessGame', () => {
  test('renders download and load controls', () => {
    const { getByText } = render(<ChessGame />);
    expect(getByText(/Download PGN/i)).toBeInTheDocument();
    expect(getByText(/Load FEN/i)).toBeInTheDocument();
  });
});

