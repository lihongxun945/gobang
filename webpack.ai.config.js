const path = require('path');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, process.env.AI_ENTRY || 'scripts/ai-stage1-runner.js'),
  output: {
    path: path.resolve(__dirname, '.ai-build'),
    filename: 'stage1-runner.cjs',
  },
  optimization: { minimize: false },
};
