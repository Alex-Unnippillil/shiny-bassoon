import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/tests/', 'src/store/', 'src/useGameStore.test.ts', 'src/App.legalMoves.test.tsx'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
};

export default config;
