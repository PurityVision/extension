/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const path = require('path')
const CopyPlugin = require('copy-webpack-plugin')

module.exports = (env) => {
  const isFirefox = env.target === 'firefox'
  if (isFirefox) {
    console.log('building for firefox')
  }

  const manifestPattern = env.target === 'firefox'
    ? { from: 'manifest-firefox.json', to: '../manifest.json', context: '.' }
    : { from: 'manifest.json', to: '../', context: '.' }

  return {
    entry: {
      worker: path.join(__dirname, 'src/worker.ts'),
      popup: path.join(__dirname, 'src/popup/index.tsx'),
      content: path.join(__dirname, 'src/content/index.tsx')
    },
    output: {
      path: path.join(__dirname, 'dist/js'),
      filename: '[name].js'
    },
    module: {
      rules: [
        {
          exclude: /node_modules/,
          test: /\.tsx?$/,
          use: 'ts-loader'
        },
        // Treat src/css/app.css as a global stylesheet
        {
          // test: /app.css$/,
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader'
          ]
        },
        // Load .module.css files as CSS modules
        {
          test: /\.module.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            },
            'postcss-loader'
          ]
        }
      ]
    },
    // Setup @src path resolution for TypeScript files
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
      alias: {
        '@src': path.resolve(__dirname, 'src/')
      }
    },
    plugins: [
      // CSS copier
      new CopyPlugin({
        patterns: [
          manifestPattern,
          { from: '.', to: '../css', context: 'src/css' },
          { from: './popup.html', to: '../', context: 'src/popup' },
          { from: './', to: '../img', context: 'src/img' }
        ]
      })
    ]

  }
}
