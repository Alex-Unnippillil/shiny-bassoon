import React from 'react';
import { render } from '@testing-library/react';
import WorkerComponent from './WorkerComponent.js';
import { jest } from '@jest/globals';

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
