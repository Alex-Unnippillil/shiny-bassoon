export default {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', '/tests/', 'src/components/'],
  transform: {
    '^.+\\.[tj]sx?$': 'babel-jest',
  },
};
