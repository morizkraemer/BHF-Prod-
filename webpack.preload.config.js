const path = require('path');

module.exports = {
  entry: './src/preload.js',
  module: {
    rules: require('./webpack.rules'),
  },
  resolve: {
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
  },
  node: {
    __dirname: false,
    __filename: false,
  },
};

