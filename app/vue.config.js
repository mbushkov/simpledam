module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      builderOptions: {
        appId: 'newmedia',
        productName: 'New Media',
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
            name: 'NewMedia Catalog',
            role: 'Editor',
          },
        ],
        // See https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/configuration.html#webpack-configuration
      }
    }
  }
}