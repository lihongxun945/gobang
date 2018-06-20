var path = require('path')
var merge = require('webpack-merge')

function resolve(name) {
  return path.join(__dirname, name)
}

// TODO: not work
module.exports = {
  chainWebpack: config => {
    config.resolve.alias.set('~', resolve('src'))
  }
}
