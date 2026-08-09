const webpack = require('webpack');
const config = require('../webpack.ai.config');

webpack(config, (error, stats) => {
  if (error) {
    console.error(error);
    process.exitCode = 1;
    return;
  }
  const output = stats.toString({ colors: false, modules: false, assets: true });
  if (output) console.log(output);
  if (stats.hasErrors()) process.exitCode = 1;
});
