module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  verbose: true,
  forceExit: true,
  restoreMocks: true,
  setupFiles: ['dotenv/config'],
};