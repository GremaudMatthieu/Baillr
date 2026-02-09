const path = require('path');

module.exports = (options) => ({
  ...options,
  resolve: {
    ...options.resolve,
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@portfolio': path.resolve(__dirname, 'src/portfolio'),
      '@infrastructure': path.resolve(__dirname, 'src/infrastructure'),
    },
  },
});
