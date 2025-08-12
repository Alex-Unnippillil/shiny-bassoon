import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BoardProvider } from './boardStore';

const theme = createTheme();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  </React.StrictMode>
);
