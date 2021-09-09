module.exports = {
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