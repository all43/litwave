const webpack = require('webpack');
const { version } = require('./package.json');

module.exports = {
  plugins: [
    new webpack.DefinePlugin({
      '__NPM_PACKAGE_VERSION__': JSON.stringify(version),
    }),
  ]
};
