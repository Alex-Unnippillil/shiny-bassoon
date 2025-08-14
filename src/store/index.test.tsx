import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { GameProvider, useGameStore } from './index';


    const { result } = renderHook(() => useGameStore(), { wrapper });

    act(() => {
      result.current.playerMove('e2', 'e4');


    act(() => {
      result.current.undo();
    });


    const { result } = renderHook(() => useGameStore(), { wrapper });

    act(() => {
      result.current.playerMove('e2', 'e4');
      result.current.aiMove('e7', 'e5');
    });


      result.current.undo();
    });

    expect(result.current.board.e4).toBeUndefined();

  });
});
