import React, { useState, useCallback } from 'react';
import useGameStore from './useGameStore';

export default function ChessGame(): JSX.Element {
  const { exportPGN, importFEN } = useGameStore();
  const [fenInput, setFenInput] = useState('');

  const handleDownload = useCallback(() => {
    const pgn = exportPGN();
    const blob = new Blob([pgn], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'game.pgn';
    a.click();
    URL.revokeObjectURL(url);
  }, [exportPGN]);

  const handleImport = useCallback(() => {
    if (fenInput) {
      importFEN(fenInput);
      setFenInput('');
    }
  }, [fenInput, importFEN]);

  return (
    <div>
      <button onClick={handleDownload}>Download PGN</button>
      <input
        value={fenInput}
        onChange={(e) => setFenInput(e.target.value)}
        placeholder="Enter FEN"
      />
      <button onClick={handleImport}>Load FEN</button>
    </div>
  );
}
