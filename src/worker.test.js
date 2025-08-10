const fs = require('fs');
const path = require('path');
const vm = require('vm');

test('worker doubles the provided value', (done) => {
  const OriginalWorker = global.Worker;

  class MockWorker {
    constructor(url) {
      this.onmessage = null;
      const code = fs.readFileSync(path.resolve(__dirname, './worker.js'), 'utf8');
      const sandbox = {
        self: {
          postMessage: (data) => {
            if (this.onmessage) {
              this.onmessage({ data });
            }
          },
        },
      };
      vm.runInNewContext(code, sandbox);
      this._onmessage = sandbox.self.onmessage;
    }

    postMessage(data) {
      if (this._onmessage) {
        this._onmessage({ data });
      }
    }

    terminate() {}
  }

  global.Worker = MockWorker;

  const worker = new Worker('./worker.js');
  worker.onmessage = (event) => {
    expect(event.data).toEqual({ result: 4 });
    global.Worker = OriginalWorker;
    done();
  };
  worker.postMessage({ value: 2 });
});
