const { resolve } = require('path')

const HtmlWebpackPlugin = require('html-webpack-plugin')

module.exports = {
  mode: 'development',

  target: 'web',

  entry: './src',

  output: {
    filename: 'myVue.js',
    path: resolve(__dirname, 'myVue')
  },

  devServer: {
    port: 8888,
    open: true,
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
      }
    ]
  },


  plugins: [
    new HtmlWebpackPlugin()
  ],

  devtool: 'source-map'
}