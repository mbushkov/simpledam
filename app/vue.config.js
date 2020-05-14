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
            to: 'Resouces/bin/backend',
            filter: ['**/*'],
          }
        ],
      }
    }
  }
}