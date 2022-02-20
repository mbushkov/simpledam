module.exports = {
  chainWebpack: config => {
    // There's a bug when the fonts are not inlined.
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