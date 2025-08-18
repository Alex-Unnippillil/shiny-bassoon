import { useState, useRef, useEffect, useCallback } from 'react';

interface Clock {
  white: number;
  black: number;
  active: 'white' | 'black' | null;
  start: (side: 'white' | 'black') => void;
  pause: () => void;
  reset: (seconds?: number) => void;
}

export default function useClock(initialSeconds = 300): Clock {
  const [white, setWhite] = useState(initialSeconds);
  const [black, setBlack] = useState(initialSeconds);
  const [active, setActive] = useState<'white' | 'black' | null>(null);
  const intervalRef = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(
    (side: 'white' | 'black') => {
      clear();
      setActive(side);
      intervalRef.current = window.setInterval(() => {
        if (side === 'white') {
          setWhite(prev => {
            if (prev <= 1) {
              clear();
              setActive(null);
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlack(prev => {
            if (prev <= 1) {
              clear();
              setActive(null);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    },
    [clear],
  );

  const pause = useCallback(() => {
    clear();
    setActive(null);
  }, [clear]);

  const reset = useCallback(
    (seconds: number = initialSeconds) => {
      clear();
      setWhite(seconds);
      setBlack(seconds);
      setActive(null);
    },
    [clear, initialSeconds],
  );

  useEffect(() => () => clear(), [clear]);

  return { white, black, active, start, pause, reset };
}

