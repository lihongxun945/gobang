const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const root = path.resolve(__dirname, '..');
const buildDir = path.join(root, '.ai-eval');
const sources = [
  require('../src/ai/opening-book/sources/gomocup-2026-15x15.json'),
  require('../src/ai/opening-book/sources/rapfi-natural-freestyle-15x15.json'),
  require('../src/ai/opening-book/sources/rapfi-verified-freestyle-15x15.json'),
];

const parseArgs = (argv) => {
  const options = {
    baseline: 'HEAD', games: 200, depth: 2, timeLimitMs: 0, maxMoves: 80,
    seed: 20260812, bootstrapSamples: 5000, enableVCT: true,
    openingBook: false, openingBookMode: 'strength', details: false,
    concurrency: 1, output: null, baselineBundle: null,
  };
  const keys = {
    '--baseline': 'baseline', '--games': 'games', '--depth': 'depth',
    '--time-ms': 'timeLimitMs', '--max-moves': 'maxMoves', '--seed': 'seed',
    '--bootstrap': 'bootstrapSamples', '--opening-book-mode': 'openingBookMode',
    '--concurrency': 'concurrency', '--output': 'output',
    '--baseline-bundle': 'baselineBundle',
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--details') options.details = true;
    else if (argument === '--no-vct') options.enableVCT = false;
    else if (argument === '--opening-book') options.openingBook = true;
    else if (keys[argument]) {
      const key = keys[argument];
      const value = argv[++index];
      if (value === undefined) throw new Error(`${argument} requires a value`);
      options[key] = ['baseline', 'baselineBundle', 'openingBookMode', 'output'].includes(key)
        ? value : Number(value);
    } else if (argument === '--help') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  return options;
};

const usage = () => {
  console.log(`Usage: npm run ai:evaluate -- [options]

  --baseline <ref>       Git ref for the old engine (default: HEAD)
  --baseline-bundle <p>  Use an existing isolated engine bundle as baseline
  --games <even-number>  Total games, played in color-swapped pairs (default: 200)
  --depth <n>            Search depth for both engines (default: 2)
  --time-ms <n>          Optional per-move time budget; 0 means depth-only
  --max-moves <n>        Maximum moves after the opening (default: 80)
  --seed <n>             Deterministic opening shuffle/bootstrap seed
  --bootstrap <n>        Pair-bootstrap samples (default: 5000)
  --concurrency <n>      Opening pairs evaluated in parallel (default: 1)
  --output <path>        Also write the JSON report to this file
  --opening-book         Enable opening books during play
  --no-vct               Disable VCT for both engines
  --details              Include every game in JSON output`);
};

const run = (command, args, options = {}) => {
  const result = childProcess.spawnSync(command, args, {
    cwd: options.cwd || root, env: { ...process.env, ...options.env },
    encoding: 'utf8', stdio: options.quiet ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`${command} failed${result.stderr ? `: ${result.stderr}` : ''}`);
  }
  return result.stdout;
};

const buildEngine = (entry, outputFile) => run('node', ['scripts/build-ai.cjs'], {
  env: { AI_ENTRY: entry, AI_OUTPUT_DIR: buildDir, AI_OUTPUT_FILE: outputFile },
});

const prepareEngines = (baselineRef, baselineBundle) => {
  fs.mkdirSync(buildDir, { recursive: true });
  const harness = path.join(root, 'scripts/ai-match-engine.js');
  buildEngine(harness, 'candidate.cjs');

  if (baselineBundle) {
    const source = path.resolve(root, baselineBundle);
    if (!fs.existsSync(source)) throw new Error(`Baseline bundle does not exist: ${source}`);
    fs.copyFileSync(source, path.join(buildDir, 'baseline.cjs'));
    return null;
  }

  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'gobang-ai-baseline-'));
  const archive = path.join(temporary, 'baseline.tar');
  run('git', ['archive', '--format=tar', `--output=${archive}`, baselineRef], { quiet: true });
  run('tar', ['-xf', archive, '-C', temporary], { quiet: true });
  fs.mkdirSync(path.join(temporary, 'scripts'), { recursive: true });
  fs.copyFileSync(harness, path.join(temporary, 'scripts/ai-match-engine.js'));
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(temporary, 'node_modules'), 'dir');
  buildEngine(path.join(temporary, 'scripts/ai-match-engine.js'), 'baseline.cjs');
  return temporary;
};

const transformPoint = ([x, y], size, transform) => {
  const last = size - 1;
  switch (transform) {
    case 1: return [y, last - x];
    case 2: return [last - x, last - y];
    case 3: return [last - y, x];
    case 4: return [x, last - y];
    case 5: return [last - x, y];
    case 6: return [y, x];
    case 7: return [last - y, last - x];
    default: return [x, y];
  }
};

const normalizePoint = (point, source) => {
  if (source.coordinateSystem === 'board-row-column') return point;
  if (source.coordinateSystem === 'center-relative-x-y') {
    const center = Math.floor(source.size / 2);
    return [center - point[1], center + point[0]];
  }
  throw new Error(`Unsupported coordinate system: ${source.coordinateSystem}`);
};

const openingPool = () => {
  const positions = [];
  const seen = new Set();
  for (const source of sources) {
    for (const opening of source.openings) {
      const moves = opening.coordinates.map((point) => normalizePoint(point, source));
      const minimum = opening.minPrefixLength || source.minPrefixLength || 1;
      for (let prefix = minimum; prefix <= moves.length; prefix += 1) {
        for (let transform = 0; transform < 8; transform += 1) {
          const transformed = moves.slice(0, prefix).map((point) => (
            transformPoint(point, source.size, transform)
          ));
          const key = `${source.size}|${JSON.stringify(transformed)}`;
          if (seen.has(key)) continue;
          seen.add(key);
          positions.push({
            id: `${opening.id}/p${prefix}/t${transform}`,
            familyId: `${source.name}/${opening.id}`,
            source: source.name, size: source.size, moves: transformed,
          });
        }
      }
    }
  }
  return positions;
};

const randomFactory = (seed) => {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = (values, seed) => {
  const result = [...values];
  const random = randomFactory(seed);
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

class EngineProcess {
  constructor(bundle) {
    this.nextId = 1;
    this.pending = new Map();
    this.child = childProcess.fork(bundle, [], { stdio: ['ignore', 'ignore', 'inherit', 'ipc'] });
    this.child.on('message', (message) => {
      const pending = this.pending.get(message.requestId);
      if (!pending) return;
      this.pending.delete(message.requestId);
      if (message.ok) pending.resolve(message.result);
      else pending.reject(new Error(message.error));
    });
    this.child.on('exit', (code) => {
      for (const pending of this.pending.values()) pending.reject(new Error(`Engine exited: ${code}`));
      this.pending.clear();
    });
  }

  request(action, payload) {
    const requestId = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(requestId, { resolve, reject });
      this.child.send({ requestId, action, payload });
    });
  }

  close() {
    this.child.kill();
  }
}

class Referee {
  constructor(size, moves) {
    this.size = size;
    this.board = Array.from({ length: size }, () => Array(size).fill(0));
    this.role = 1;
    this.winner = 0;
    this.moveCount = 0;
    moves.forEach((move) => this.put(move));
  }

  put([x, y]) {
    assert(!this.winner, 'Cannot move after the game has ended');
    assert(Number.isInteger(x) && Number.isInteger(y), `Invalid move: ${x},${y}`);
    assert(x >= 0 && y >= 0 && x < this.size && y < this.size, `Move outside board: ${x},${y}`);
    assert(this.board[x][y] === 0, `Occupied move: ${x},${y}`);
    const role = this.role;
    this.board[x][y] = role;
    this.moveCount += 1;
    if (this.hasFive(x, y, role)) this.winner = role;
    this.role *= -1;
  }

  hasFive(x, y, role) {
    return [[1, 0], [0, 1], [1, 1], [1, -1]].some(([dx, dy]) => {
      const count = (direction) => {
        let total = 0;
        let nextX = x + dx * direction;
        let nextY = y + dy * direction;
        while (this.board[nextX]?.[nextY] === role) {
          total += 1;
          nextX += dx * direction;
          nextY += dy * direction;
        }
        return total;
      };
      return 1 + count(1) + count(-1) >= 5;
    });
  }

  get full() {
    return this.moveCount === this.size * this.size;
  }
}

const playGame = async (position, candidateRole, settings) => {
  const candidate = new EngineProcess(path.join(buildDir, 'candidate.cjs'));
  const baseline = new EngineProcess(path.join(buildDir, 'baseline.cjs'));
  const engines = { candidate, baseline };
  const elapsedMs = { candidate: 0, baseline: 0 };
  const nodes = { candidate: 0, baseline: 0 };
  const qThreeExtensions = { candidate: 0, baseline: 0 };
  const qThreeThirdMoves = { candidate: 0, baseline: 0 };
  const pvsScouts = { candidate: 0, baseline: 0 };
  const searches = { candidate: 0, baseline: 0 };
  const normalCompletedDepth = { candidate: 0, baseline: 0 };
  const referee = new Referee(position.size, position.moves);
  const playedMoves = [];
  let moves = 0;
  let termination = null;
  try {
    const initialized = await Promise.all(Object.values(engines).map((engine) => engine.request('init', {
      size: position.size, moves: position.moves, settings,
    })));
    initialized.forEach(({ role }) => assert(role === referee.role, `${position.id}: role mismatch`));
    while (!referee.winner && !referee.full && moves < settings.maxMoves) {
      const role = referee.role;
      const engineName = role === candidateRole ? 'candidate' : 'baseline';
      const search = await engines[engineName].request('search');
      assert(search.move, `${position.id}: ${engineName} returned no move`);
      elapsedMs[engineName] += search.elapsedMs;
      nodes[engineName] += search.nodes;
      qThreeExtensions[engineName] += search.qThreeExtensions || 0;
      qThreeThirdMoves[engineName] += search.qThreeThirdMoves || 0;
      pvsScouts[engineName] += search.pvsScouts || 0;
      searches[engineName] += 1;
      const completedNormal = search.normalCompletedDepth
        ?? (search.completedDepth <= settings.depth ? search.completedDepth : 0);
      normalCompletedDepth[engineName] += completedNormal || 0;
      referee.put(search.move);
      playedMoves.push(search.move);
      const replies = await Promise.all(Object.values(engines).map((engine) => (
        engine.request('move', { move: search.move, role })
      )));
      replies.forEach((reply) => assert(reply.role === referee.role, `${position.id}: role mismatch`));
      moves += 1;
    }
    termination = referee.winner ? 'win' : referee.full ? 'board_full' : 'max_moves';
  } finally {
    candidate.close();
    baseline.close();
  }
  const candidateResult = referee.winner === candidateRole ? 1 : referee.winner === 0 ? 0.5 : 0;
  return {
    openingId: position.id, openingFamily: position.familyId,
    openingSource: position.source, candidateRole,
    winner: referee.winner, candidateResult, moves, termination,
    elapsedMs, nodes, qThreeExtensions, qThreeThirdMoves, pvsScouts,
    searches, normalCompletedDepth, playedMoves,
  };
};

const percentile = (sorted, ratio) => sorted[Math.min(
  sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * ratio)),
)];
const scoreToElo = (score) => {
  const bounded = Math.min(1 - 1e-6, Math.max(1e-6, score));
  return 400 * Math.log10(bounded / (1 - bounded));
};

const bootstrap = (pairs, samples, seed) => {
  const clusters = new Map();
  pairs.forEach(({ familyId, score }) => {
    if (!clusters.has(familyId)) clusters.set(familyId, []);
    clusters.get(familyId).push(score);
  });
  const families = [...clusters.values()];
  const random = randomFactory(seed ^ 0xA17E5EED);
  const rates = [];
  for (let sample = 0; sample < samples; sample += 1) {
    let score = 0;
    let gameCount = 0;
    for (let index = 0; index < families.length; index += 1) {
      const cluster = families[Math.floor(random() * families.length)];
      score += cluster.reduce((sum, value) => sum + value, 0);
      gameCount += cluster.length * 2;
    }
    rates.push(score / gameCount);
  }
  rates.sort((left, right) => left - right);
  const low = percentile(rates, 0.025);
  const high = percentile(rates, 0.975);
  const better = rates.filter((rate) => rate > 0.5).length;
  const equal = rates.filter((rate) => rate === 0.5).length;
  return {
    openingFamilyClusters: families.length,
    scoreRate95: [low, high], elo95: [scoreToElo(low), scoreToElo(high)],
    probabilityBetter: (better + equal * 0.5) / rates.length,
  };
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) return usage();
  if (!Number.isInteger(options.games) || options.games < 2 || options.games % 2) {
    throw new Error('--games must be a positive even number');
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error('--concurrency must be a positive integer');
  }
  if (!Number.isInteger(options.bootstrapSamples) || options.bootstrapSamples < 1) {
    throw new Error('--bootstrap must be a positive integer');
  }
  if (!Number.isInteger(options.depth) || options.depth < 1) {
    throw new Error('--depth must be a positive integer');
  }
  if (!Number.isFinite(options.timeLimitMs) || options.timeLimitMs < 0) {
    throw new Error('--time-ms must be a non-negative number');
  }
  if (!Number.isInteger(options.maxMoves) || options.maxMoves < 1) {
    throw new Error('--max-moves must be a positive integer');
  }
  const pool = shuffled(openingPool(), options.seed);
  const requestedPairs = options.games / 2;
  const selected = Array.from({ length: requestedPairs }, (_, index) => ({
    ...pool[index % pool.length], cycle: Math.floor(index / pool.length),
  }));
  const settings = {
    depth: options.depth, timeLimitMs: options.timeLimitMs, maxMoves: options.maxMoves,
    enableVCT: options.enableVCT, openingBook: options.openingBook,
    openingBookMode: options.openingBookMode,
  };
  const temporary = prepareEngines(options.baseline, options.baselineBundle);
  const pairedGames = new Array(selected.length);
  let nextPair = 0;
  let completedPairs = 0;
  try {
    const worker = async () => {
      while (nextPair < selected.length) {
        const index = nextPair++;
        const position = selected[index];
        pairedGames[index] = [
          await playGame(position, 1, settings),
          await playGame(position, -1, settings),
        ];
        completedPairs += 1;
        if (completedPairs % 10 === 0 || completedPairs === selected.length) {
          process.stderr.write(`Completed ${2 * completedPairs}/${options.games} games\n`);
        }
      }
    };
    const workers = Math.min(options.concurrency, selected.length);
    await Promise.all(Array.from({ length: workers }, worker));
  } finally {
    if (temporary?.startsWith(os.tmpdir())) fs.rmSync(temporary, { recursive: true, force: true });
  }
  const games = pairedGames.flat();

  const wins = games.filter(({ candidateResult }) => candidateResult === 1).length;
  const draws = games.filter(({ candidateResult }) => candidateResult === 0.5).length;
  const losses = games.length - wins - draws;
  const candidateScore = wins + draws * 0.5;
  const scoreRate = candidateScore / games.length;
  const pairs = pairedGames.map(([first, second]) => ({
    familyId: first.openingFamily,
    score: first.candidateResult + second.candidateResult,
  }));
  const confidence = bootstrap(pairs, options.bootstrapSamples, options.seed);
  const totals = games.reduce((result, game) => ({
    elapsedMs: {
      candidate: result.elapsedMs.candidate + game.elapsedMs.candidate,
      baseline: result.elapsedMs.baseline + game.elapsedMs.baseline,
    },
    nodes: {
      candidate: result.nodes.candidate + game.nodes.candidate,
      baseline: result.nodes.baseline + game.nodes.baseline,
    },
    qThreeExtensions: {
      candidate: result.qThreeExtensions.candidate + game.qThreeExtensions.candidate,
      baseline: result.qThreeExtensions.baseline + game.qThreeExtensions.baseline,
    },
    qThreeThirdMoves: {
      candidate: result.qThreeThirdMoves.candidate + game.qThreeThirdMoves.candidate,
      baseline: result.qThreeThirdMoves.baseline + game.qThreeThirdMoves.baseline,
    },
    pvsScouts: {
      candidate: result.pvsScouts.candidate + game.pvsScouts.candidate,
      baseline: result.pvsScouts.baseline + game.pvsScouts.baseline,
    },
    searches: {
      candidate: result.searches.candidate + game.searches.candidate,
      baseline: result.searches.baseline + game.searches.baseline,
    },
    normalCompletedDepth: {
      candidate: result.normalCompletedDepth.candidate + game.normalCompletedDepth.candidate,
      baseline: result.normalCompletedDepth.baseline + game.normalCompletedDepth.baseline,
    },
  }), {
    elapsedMs: { candidate: 0, baseline: 0 },
    nodes: { candidate: 0, baseline: 0 },
    qThreeExtensions: { candidate: 0, baseline: 0 },
    qThreeThirdMoves: { candidate: 0, baseline: 0 },
    pvsScouts: { candidate: 0, baseline: 0 },
    searches: { candidate: 0, baseline: 0 },
    normalCompletedDepth: { candidate: 0, baseline: 0 },
  });
  totals.averageNormalCompletedDepth = {
    candidate: totals.normalCompletedDepth.candidate / totals.searches.candidate,
    baseline: totals.normalCompletedDepth.baseline / totals.searches.baseline,
  };
  const terminations = games.reduce((counts, game) => ({
    ...counts, [game.termination]: (counts[game.termination] || 0) + 1,
  }), {});
  const report = {
    baseline: options.baselineBundle || options.baseline,
    settings,
    concurrency: options.concurrency,
    openingPool: pool.length,
    openingFamilies: new Set(selected.map(({ familyId }) => familyId)).size,
    uniquePairsUsed: Math.min(selected.length, pool.length),
    repeatedPairs: Math.max(0, selected.length - pool.length),
    games: games.length,
    pairs: pairs.length,
    result: {
      wins, draws, losses, candidateScore, scoreRate,
      elo: scoreToElo(scoreRate),
      ...confidence,
    },
    terminations,
    totals,
    details: options.details ? games : undefined,
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    const output = path.resolve(root, options.output);
    fs.mkdirSync(path.dirname(output), { recursive: true });
    fs.writeFileSync(output, json);
    process.stderr.write(`Report written to ${output}\n`);
  }
  process.stdout.write(json);
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  Referee, bootstrap, openingPool, parseArgs, scoreToElo,
};
