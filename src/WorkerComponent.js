import React, { useRef, useEffect } from 'react';

export default function WorkerComponent() {
  const workerRef = useRef(null);

  if (!workerRef.current) {
    workerRef.current = new Worker(new URL('./worker.js', import.meta.url));
  }

  useEffect(() => {
    const worker = workerRef.current;
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  return React.createElement('div', null, 'Worker Component');
}
