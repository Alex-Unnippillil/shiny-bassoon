import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { BoardProvider } from './boardStore';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

const theme = createTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <BoardProvider>
        <DndProvider backend={HTML5Backend}>
          <App />
        </DndProvider>
      </BoardProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
