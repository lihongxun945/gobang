const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, '.ai-eval');
const outputFile = 'tactical-runner.cjs';
fs.mkdirSync(outputDir, { recursive: true });

const build = childProcess.spawnSync('node', ['scripts/build-ai.cjs'], {
  cwd: root,
  env: {
    ...process.env,
    AI_ENTRY: 'scripts/ai-tactical-runner.js',
    AI_OUTPUT_DIR: outputDir,
    AI_OUTPUT_FILE: outputFile,
  },
  stdio: 'inherit',
});
if (build.status !== 0) process.exit(build.status || 1);

const run = childProcess.spawnSync('node', [path.join(outputDir, outputFile), ...process.argv.slice(2)], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(run.status ?? 1);
