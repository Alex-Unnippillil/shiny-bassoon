const React = require('react');

function WorkerComponent() {
  const workerRef = React.useRef(null);

  if (!workerRef.current) {
    workerRef.current = new Worker('./worker.js');
  }

  React.useEffect(() => {
    const worker = workerRef.current;
    return () => {
      if (worker) {
        worker.terminate();
      }
    };
  }, []);

  return React.createElement('div', null, 'Worker Component');
}

module.exports = WorkerComponent;
