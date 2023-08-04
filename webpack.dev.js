const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const Dotenv = require('dotenv-webpack')

module.exports = (env) => merge(common(env), {
  mode: 'development',
  devtool: 'inline-source-map',
  plugins: [
    new Dotenv()
  ]
})
