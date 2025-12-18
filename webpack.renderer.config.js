const rules = require('./webpack.rules');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require('path');

rules.push({
  test: /\.css$/,
  use: [{ loader: 'style-loader' }, { loader: 'css-loader' }],
});

module.exports = {
  output: {
    publicPath: './',
  },
  module: {
    rules,
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [
        // Copy JSX files so they can be loaded by Babel standalone
        { from: path.resolve(__dirname, 'src/components'), to: 'src/components' },
        { from: path.resolve(__dirname, 'src/App.jsx'), to: 'src/App.jsx' },
        // Copy CSS files
        { from: path.resolve(__dirname, 'src/styles'), to: 'src/styles' },
        // Copy templates
        { from: path.resolve(__dirname, 'templates'), to: 'templates' },
        // Copy assets
        { from: path.resolve(__dirname, 'assets'), to: 'assets' },
      ],
    }),
  ],
};






