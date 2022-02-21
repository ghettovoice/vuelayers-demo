module.exports = {
  chainWebpack: config => {
    config.module
      .rule('json')
      .test(/\.(json|geojson)$/i)
      .use('json')
      .loader('json-loader')

    config.module
      .rule('vue')
      .use('vue-loader')
      .tap(options => {
        options.transformAssetUrls = {
          'vl-style-icon': 'src',
          'VlStyleIcon': 'src',
        }
        return options
      })
  },
}
