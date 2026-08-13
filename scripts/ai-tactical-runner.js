import fs from 'fs';
import path from 'path';
import Board from '../src/ai/board';
import { candidateMinmax, candidateVct, clearSearchCache, resetSearchStats, searchStats } from '../src/ai/candidate/minmax';
import { FIVE } from '../src/ai/eval';
import { tacticalPositions } from '../src/ai/fixtures/tactics';

const parseArgs = (argv) => {
  const options = {
    filter: '', repeat: 1, output: null, baselineReport: null,
    details: false, symmetries: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--details') options.details = true;
    else if (argument === '--symmetries') options.symmetries = true;
    else if (argument === '--filter') options.filter = argv[++index] || '';
    else if (argument === '--repeat') options.repeat = Number(argv[++index]);
    else if (argument === '--output') options.output = argv[++index];
    else if (argument === '--baseline-report') options.baselineReport = argv[++index];
    else if (argument === '--help') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!Number.isInteger(options.repeat) || options.repeat < 1) {
    throw new Error('--repeat must be a positive integer');
  }
  return options;
};

const sameMove = (left, right) => (
  left && right && left[0] === right[0] && left[1] === right[1]
);

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

const transformedPositions = (positions) => positions.flatMap((position) => (
  Array.from({ length: 8 }, (_, transform) => ({
    ...position,
    id: `${position.id}/t${transform}`,
    familyId: position.id,
    moves: position.moves.map((move) => transformPoint(move, position.size, transform)),
    expect: {
      ...position.expect,
      moves: position.expect.moves?.map((move) => (
        transformPoint(move, position.size, transform)
      )),
    },
  }))
));

const checkExpectation = (result, expect) => {
  const [score, move] = result;
  const outcomeMatches = expect.outcome === 'win'
    ? score >= FIVE
    : expect.outcome === 'loss' ? score <= -FIVE : score < FIVE;
  const moveMatches = !expect.moves
    || expect.moves.some((expectedMove) => sameMove(move, expectedMove));
  return { passed: outcomeMatches && moveMatches, outcomeMatches, moveMatches };
};

const runPosition = (position) => {
  const board = new Board(position.size);
  position.moves.forEach(([x, y]) => {
    if (!board.put(x, y)) throw new Error(`${position.id}: invalid fixture move ${x},${y}`);
  });
  clearSearchCache(board);
  resetSearchStats();
  const before = {
    board: board.toString(), role: board.role,
    history: JSON.stringify(board.history), hash: board.hash(),
  };
  const startedAt = performance.now();
  const result = position.search === 'vct'
    ? candidateVct(board, position.role, position.depth)
    : candidateMinmax(board, position.role, position.depth, true, { disableOpeningBook: true });
  const elapsedMs = performance.now() - startedAt;
  const stateRestored = board.toString() === before.board && board.role === before.role
    && JSON.stringify(board.history) === before.history && board.hash() === before.hash;
  const expectation = checkExpectation(result, position.expect);
  return {
    id: position.id, tags: position.tags, search: position.search,
    depth: position.depth, passed: expectation.passed && stateRestored,
    ...expectation, stateRestored, score: result[0], move: result[1], pv: result[2],
    completedDepth: result[3], elapsedMs, nodes: searchStats.nodes,
  };
};

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  console.log('Usage: npm run ai:tactics -- [--filter text] [--symmetries] [--repeat n] [--details] [--output path] [--baseline-report path]');
  process.exit(0);
}
const filter = options.filter.toLowerCase();
const filtered = tacticalPositions.filter((position) => (
  !filter || position.id.toLowerCase().includes(filter)
  || position.tags.some((tag) => tag.toLowerCase().includes(filter))
));
if (!filtered.length) throw new Error(`No tactical positions match: ${options.filter}`);
const selected = options.symmetries ? transformedPositions(filtered) : filtered;

const runs = [];
for (let repeat = 0; repeat < options.repeat; repeat += 1) {
  selected.forEach((position) => runs.push(runPosition(position)));
}
const failures = runs.filter(({ passed }) => !passed);
const compactResults = runs.map((run) => ({
  id: run.id, passed: run.passed, score: run.score, move: run.move,
  nodes: run.nodes, elapsedMs: run.elapsedMs,
}));
let comparison;
if (options.baselineReport) {
  const baseline = JSON.parse(fs.readFileSync(path.resolve(options.baselineReport), 'utf8'));
  const baselineById = new Map((baseline.results || baseline.details || []).map((run) => [run.id, run]));
  const matched = compactResults.filter(({ id }) => baselineById.has(id));
  const baselineNodes = matched.reduce((sum, run) => sum + baselineById.get(run.id).nodes, 0);
  const baselineElapsedMs = matched.reduce((sum, run) => sum + baselineById.get(run.id).elapsedMs, 0);
  comparison = {
    matched: matched.length,
    improvements: matched.filter((run) => run.passed && !baselineById.get(run.id).passed).map(({ id }) => id),
    regressions: matched.filter((run) => !run.passed && baselineById.get(run.id).passed).map(({ id }) => id),
    nodeDeltaRate: baselineNodes ? (matched.reduce((sum, run) => sum + run.nodes, 0) - baselineNodes) / baselineNodes : null,
    elapsedDeltaRate: baselineElapsedMs ? (matched.reduce((sum, run) => sum + run.elapsedMs, 0) - baselineElapsedMs) / baselineElapsedMs : null,
  };
}
const familyMap = new Map();
runs.forEach((run) => {
  const familyId = run.id.replace(/\/t\d+$/, '');
  const familyRuns = familyMap.get(familyId) || [];
  familyRuns.push(run);
  familyMap.set(familyId, familyRuns);
});
const symmetryDiagnostics = options.symmetries ? [...familyMap].map(([familyId, familyRuns]) => {
  const scores = familyRuns.map(({ score }) => score);
  const nodes = familyRuns.map(({ nodes }) => nodes);
  const minimumNodes = Math.min(...nodes);
  return {
    familyId,
    scoreSpread: Math.max(...scores) - Math.min(...scores),
    minimumNodes,
    maximumNodes: Math.max(...nodes),
    nodeRatio: minimumNodes ? Math.max(...nodes) / minimumNodes : null,
  };
}) : undefined;
const summary = {
  positions: selected.length, basePositions: filtered.length,
  symmetries: options.symmetries, repeat: options.repeat, runs: runs.length,
  passed: runs.length - failures.length, failed: failures.length,
  passRate: (runs.length - failures.length) / runs.length,
  totalNodes: runs.reduce((sum, run) => sum + run.nodes, 0),
  totalElapsedMs: runs.reduce((sum, run) => sum + run.elapsedMs, 0),
  comparison,
  symmetryDiagnostics,
  failures: failures.map((failure) => ({
    id: failure.id, score: failure.score, move: failure.move, pv: failure.pv,
    outcomeMatches: failure.outcomeMatches, moveMatches: failure.moveMatches,
    stateRestored: failure.stateRestored,
  })),
  results: compactResults,
  details: options.details ? runs : undefined,
};
const json = JSON.stringify(summary, null, 2);
const consoleReport = options.details ? summary : { ...summary, results: undefined };
console.log(JSON.stringify(consoleReport, null, 2));
if (options.output) {
  const output = path.resolve(options.output);
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, json);
}
if (failures.length) process.exitCode = 1;
