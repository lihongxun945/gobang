module.exports = {
  rootDir: '.',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/src/ai/tests/**/*.test.js'],
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['react-app'] }],
  },
  transformIgnorePatterns: ['/node_modules/'],
};
