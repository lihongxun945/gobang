var path = require('path')
var merge = require('webpack-merge')

function resolve(name) {
  return path.join(__dirname, name)
}

// TODO: not work
module.exports = {
  chainWebpack: config => {
    config
    // Interact with entry points
      .entry('ai')
      .add(resolve('src/ai/bridge.js'))
      .end()
    // Modify output settings
      .output
      .path(resolve('dist'))
      .filename('[name].bundle.js')
      .globalObject('this') //https://github.com/webpack/webpack/issues/6642

    config.
      devtool(false)
  }
}
