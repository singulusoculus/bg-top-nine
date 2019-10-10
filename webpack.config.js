const path = require('path')

const MiniCssExtractPlugin = require('mini-css-extract-plugin')

process.env.NODE_ENV = process.env.NODE_ENV || 'development'

module.exports = {
  watch: true,
  entry: {
    index: ['babel-polyfill', './src/js/index.js'],
  },
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: '[name]-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env'],
            plugins: ['transform-object-rest-spread']
          }
        }
      }, {
        test: /\.scss$/,
        use: ['style-loader',
          MiniCssExtractPlugin.loader,
          'css-loader',
          'sass-loader'
        ]
      }, {
        test: /\.(png|jpg)$/,
        loader: 'url-loader'
      }
    ]
  },
  plugins: [
    new MiniCssExtractPlugin('main.css')
  ],
  devServer: {
    contentBase: path.resolve(__dirname, 'public'),
    publicPath: '/dist/',
    watchContentBase: true,
    inline: true
  },
  devtool: 'source-map'
}
