const React = require('react');
const useGameStore = require('./useGameStore');

function ChessGame() {
  const { board, move, pendingPromotion, promote, status } = useGameStore();
  const [selected, setSelected] = React.useState(null);

  const handleSquareClick = (squareName) => {
    if (selected) {
      move(selected, squareName);
      setSelected(null);
    } else {
      const [file, rank] = squareName;
      setSelected(squareName);
    }
  };

  const renderBoard = () => {
    return React.createElement(
      'div',
      { className: 'board' },
      board
        .map((row, rowIndex) =>
          row.map((square, colIndex) => {
            const squareName = 'abcdefgh'[colIndex] + (8 - rowIndex);
            const piece = square ? square.type + square.color : '';
            return React.createElement(
              'button',
              {
                key: squareName,
                'data-square': squareName,
                onClick: () => handleSquareClick(squareName),
                className: 'square'
              },
              piece
            );
          })
        )
    );
  };

  const renderPromotion = () => {
    if (!pendingPromotion) return null;
    return React.createElement(
      'div',
      { className: 'promotion' },
      ['q', 'r', 'b', 'n'].map((p) =>
        React.createElement(
          'button',
          { key: p, onClick: () => promote(p) },
          p
        )
      )
    );
  };

  return React.createElement(
    'div',
    null,
    renderBoard(),
    renderPromotion(),
    React.createElement('div', { className: 'status', 'data-testid': 'status' }, status)
  );
}

module.exports = ChessGame;
