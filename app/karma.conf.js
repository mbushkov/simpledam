// karma.conf.js
let webpackConfig = require('@vue/cli-service/webpack.config.js');

module.exports = function(config) {
  config.set({
    frameworks: ['mocha'],

    files: ['src/**/*.spec.ts'],

    preprocessors: {
      '**/*.spec.ts': ['webpack', 'sourcemap']
    },

    webpack: webpackConfig,

    reporters: ['spec'],

    browsers: ['Chrome']
  })
}