'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = merge(common, {
   entry: {
      content: PATHS.src + '/content.js',
      downloader: PATHS.src + '/downloader.js',
      ics: PATHS.src + '/ics.min.js'
   },
});

module.exports = config;
