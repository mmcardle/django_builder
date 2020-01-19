const path = require('path')

const node_env = process.env.NODE_ENV
const minimize = node_env == 'development' ? false : true

console.log(`Environment: ${node_env}`)
console.log(`Minimise: ${minimize}`)

module.exports = {
  productionSourceMap: false,
  configureWebpack:{
    entry: {
      app: path.resolve(__dirname, 'src/main.js'),
      //other: path.resolve(__dirname, 'src/other.js'),
    },
    output: {
      filename: '[name].bundle.js',
    },
    performance: {
      maxEntrypointSize: 350000,
      maxAssetSize: 350000,
    },
    optimization: {
      minimize: minimize,
      splitChunks: {
        chunks: 'all',
        minSize: 100000,
        maxSize: 600000,
      }
    }
  },
  chainWebpack: (config) => {

    config.module
      .rule('py')
      .test(/\.py/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()

    config.module
      .rule('html.tmpl')
      .test(/\.html\.tmpl/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()

    config.module
      .rule('txt')
      .test(/\.txt/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()

    config.module
      .rule('ini')
      .test(/\.ini/)
      .use('raw-loader')
      .loader('raw-loader')
      .end()

  },
  lintOnSave: undefined
}
