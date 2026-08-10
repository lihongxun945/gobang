const { spawn } = require('child_process');
const path = require('path');
const readline = require('readline');

const engine = process.env.RAPFI_ENGINE;
const maxTimeMs = Number(process.env.RAPFI_TIME_MS || 10000);
if (!engine) throw new Error('RAPFI_ENGINE is required');

const positions = [
  [[7, 7]],
  [[7, 7], [7, 8]],
  [[7, 7], [8, 8]],
  [[7, 7], [7, 9]],
  [[7, 7], [8, 9]],
  [[7, 7], [9, 9]],
  [[6, 7]],
  [[6, 6]],
  [[5, 7]],
  [[5, 5]],
];

const analyze = (moves) => new Promise((resolve, reject) => {
  const child = spawn(engine, [], {
    cwd: process.env.RAPFI_CWD || path.dirname(engine),
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  const lines = [];
  let stderr = '';
  let settled = false;
  const timer = setTimeout(() => {
    child.kill();
    reject(new Error(`Rapfi timed out after ${maxTimeMs + 10000}ms`));
  }, maxTimeMs + 10000);
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  child.on('error', reject);
  child.on('exit', (code) => {
    if (!settled && code !== 0) reject(new Error(`Rapfi exited ${code}: ${stderr}`));
  });
  readline.createInterface({ input: child.stdout }).on('line', (line) => {
    lines.push(line);
    if (!/^\d+,\d+$/.test(line)) return;
    const [col, row] = line.split(',').map(Number);
    settled = true;
    clearTimeout(timer);
    child.stdin.end('END\n');
    resolve({
      moves,
      response: [row, col],
      trace: lines.filter((item) => item.includes('Speed')).pop() || null,
    });
  });
  const board = moves.map(([row, col], index) => (
    `${col},${row},${index % 2 === 0 ? 1 : 2}`
  )).join('\n');
  child.stdin.write([
    'START 15',
    'INFO rule 0',
    `INFO timeout_turn ${maxTimeMs}`,
    'INFO time_left 600000',
    'BOARD',
    board,
    'DONE',
    '',
  ].join('\n'));
});

const main = async () => {
  const entries = [];
  for (const position of positions) entries.push(await analyze(position));
  console.log(JSON.stringify({
    engine: 'Rapfi 250615', rules: 'freestyle', size: 15, maxTimeMs, entries,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
