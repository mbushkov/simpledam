// karma.conf.js
let webpackConfig = require('@vue/cli-service/webpack.config.js');
// Ensure bundler with the runtime support is used.
webpackConfig['resolve']['alias']['vue$'] = 'vue/dist/vue.esm-bundler.js'

module.exports = function (config) {
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