import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/tests/'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(@react-dnd|react-dnd|dnd-core|react-dnd-html5-backend|react-dnd-test-backend)/)',
  ],
};

export default config;
