import React from 'react';
import useGameStore from './useGameStore.js';

function ChessGame() {
  const { exportPGN, importFEN } = useGameStore();
  const [fenInput, setFenInput] = React.useState('');

  const handleDownload = React.useCallback(() => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPGN]);

  const handleImport = React.useCallback(() => {
    if (fenInput) {
      importFEN(fenInput);
      setFenInput('');
    }
  }, [fenInput, importFEN]);

  return React.createElement(
    'div',
    null,
    React.createElement(
      'button',
      { onClick: handleDownload },
      'Download PGN'
    ),
    React.createElement('input', {
      value: fenInput,
      onChange: (e) => setFenInput(e.target.value),
      placeholder: 'Enter FEN',
    }),
    React.createElement(
      'button',
      { onClick: handleImport },
      'Load FEN'
    )
  );
}

export default ChessGame;
