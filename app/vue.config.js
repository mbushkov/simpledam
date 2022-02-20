module.exports = {
  chainWebpack: config => {
    // TODO: fix by migrating to a saner build system (vue-cli seems to be in maintenance mode anyway).
    // There's an odd bug - likely caused by some pecularity of Webpack + vue-cli-plugin-electron-builder.
    // Fonts are referenced in generated CSS files with an invalid URL: starting with 'app:///' instead of
    // 'app://./'. Inlining the fonts is a quick hack to fix the issue.
    config.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .set('type', 'asset/inline')
      .set('generator', {
        dataUrl: {
          encoding: "base64",
          mimetype: "application/font"
        }
      })
  },
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      builderOptions: {
        appId: 'simpledam',
        productName: 'simpledam',
        extraFiles: [
          {
            from: '../backend/dist/backend',
            to: 'Resources/bin/backend',
            filter: ['**/*'],
          }
        ],
        fileAssociations: [
          {
            ext: 'nmcatalog',
            name: 'simpledam catalog',
            role: 'Editor',
          },
        ],
        // See https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html#webpack-configuration
        mac: {
          hardenedRuntime: true,
          gatekeeperAssess: false,
          entitlements: "build/entitlements.mac.plist",
          entitlementsInherit: "build/entitlements.mac.plist",
          target: 'dmg',
        },
      }
    }
  }
}