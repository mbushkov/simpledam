module.exports = {
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: false,
      builderOptions: {
        chainWebpackRendererProcess: config => {
          
        }
      }
    }
  }
}