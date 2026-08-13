const path = require('path');

module.exports = {
  mode: 'production',
  target: 'node',
  entry: path.resolve(__dirname, process.env.AI_ENTRY || 'scripts/ai-stage1-runner.js'),
  output: {
    path: path.resolve(process.env.AI_OUTPUT_DIR || path.resolve(__dirname, '.ai-build')),
    filename: process.env.AI_OUTPUT_FILE || 'stage1-runner.cjs',
  },
  optimization: { minimize: false },
};
