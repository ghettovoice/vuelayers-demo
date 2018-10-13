'use strict'
const path = require('path')
const {VueLoaderPlugin} = require('vue-loader')
const utils = require('./utils')
const config = require('../config')

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

const isProduction = process.env.NODE_ENV === 'production'

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}

module.exports = {
  context: path.resolve(__dirname, '../'),
  mode: ['production', 'development'].includes(process.env.NODE_ENV)
    ? process.env.NODE_ENV
    : 'development',
  entry: {
    app: './src/main.js',
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    chunkFilename: '[name].js',
    publicPath: isProduction ? config.build.assetsPublicPath : config.dev.assetsPublicPath
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      '@': resolve('src'),
    },
  },
  module: {
    rules: [
      ...(config.dev.useEslint ? [
        {
          test: /\.(js|vue)$/,
          loader: 'eslint-loader',
          enforce: 'pre',
          include: [
            resolve('src'),
            resolve('test'),
          ],
          options: {
            formatter: require('eslint-friendly-formatter'),
            emitWarning: !config.dev.showEslintErrorsInOverlay,
          },
        },
      ] : []),
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: utils.vueLoaderConfig(),
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: [
          resolve('src'),
          resolve('test'),
        ],
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('img/[name].[hash:7].[ext]'),
        },
      },
      {
        test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('media/[name].[hash:7].[ext]'),
        },
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: utils.assetsPath('fonts/[name].[hash:7].[ext]'),
        },
      },
      {
        test: /\.(json|geojson)$/,
        loader: 'json-loader',
      },
      ...utils.styleLoaders({
        sourceMap: isProduction,
        extract: isProduction,
      }),
    ],
  },
  plugins: [
    new VueLoaderPlugin(),
  ],
}
