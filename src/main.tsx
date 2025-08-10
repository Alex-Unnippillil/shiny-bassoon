import React from 'react';
import ReactDOM from 'react-dom/client';
import ChessGame from './components/ChessGame';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ChessGame />
  </React.StrictMode>
);
