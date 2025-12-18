const path = require('path');

module.exports = {
  mode: 'development',
  entry: './tests/k6/performance-test.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'performance-test.bundle.js',
    library: {
      type: 'module',
    },
  },
  experiments: {
    outputModule: true,
  },
  target: 'web',
  externals: [
    function ({ request }, callback) {
      // Externaliza módulos K6
      if (/^k6/.test(request)) {
        return callback(null, `commonjs ${request}`);
      }
      // Externaliza URLs HTTPS
      if (/^https?:\/\//.test(request)) {
        return callback(null, `commonjs ${request}`);
      }
      callback();
    },
  ],
  resolve: {
    extensions: ['.js'],
  },
  stats: {
    colors: true,
  },
  optimization: {
    minimize: false,
  },
};

