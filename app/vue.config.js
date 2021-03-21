module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      builderOptions: {
        appId: 'simpledam',
        productName: 'Simpledam',
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
            name: 'Simpledam Catalog',
            role: 'Editor',
          },
        ],
        // See https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html#webpack-configuration
      }
    }
  }
}