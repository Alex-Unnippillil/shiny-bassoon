const React = require('react');
const { render } = require('@testing-library/react');
const WorkerComponent = require('./WorkerComponent');

test('creates one worker and terminates on unmount', () => {
  const terminate = jest.fn();
  const WorkerMock = jest.fn(() => ({ terminate }));
  global.Worker = WorkerMock;

  const { rerender, unmount } = render(React.createElement(WorkerComponent));
  expect(WorkerMock).toHaveBeenCalledTimes(1);

  rerender(React.createElement(WorkerComponent));
  expect(WorkerMock).toHaveBeenCalledTimes(1);

  unmount();
  expect(terminate).toHaveBeenCalledTimes(1);
});
