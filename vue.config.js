module.exports = {
  chainWebpack: config => {
    config.module
      .rule('json')
      .test(/\.(json|geojson)$/i)
      .use('json')
      .loader('json-loader')
  },
}
