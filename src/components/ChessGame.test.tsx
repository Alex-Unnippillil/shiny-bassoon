import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';


describe('ChessGame', () => {
  test('renders download and load controls', () => {
    const { getByText } = render(<ChessGame />);
    expect(getByText(/Download PGN/i)).toBeInTheDocument();
    expect(getByText(/Load FEN/i)).toBeInTheDocument();
  });


  });
});
