import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ChessGame from '../ChessGame';

describe('ChessGame', () => {
  test('renders download and load controls', () => {
    const { getByText } = render(<ChessGame />);
    expect(getByText(/Download PGN/i)).toBeInTheDocument();
    expect(getByText(/Load FEN/i)).toBeInTheDocument();
  });

  test('handles importing FEN', () => {
    const { getByPlaceholderText, getByText } = render(<ChessGame />);
    const input = getByPlaceholderText('Enter FEN') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'test-fen' } });
    fireEvent.click(getByText(/Load FEN/i));
    expect(input.value).toBe('');
  });
});
