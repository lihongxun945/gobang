import Board from '../src/ai/board';
import { candidateMinmax, clearSearchCache, resetSearchStats, searchStats } from '../src/ai/candidate/minmax';
import { FIVE } from '../src/ai/eval';
import { tacticalPositions } from '../src/ai/fixtures/tactics';
import { config } from '../src/ai/config';

export const inverseTransforms = [0, 3, 2, 1, 4, 5, 6, 7];

export const transformPoint = ([x, y], size, transform) => {
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

export const canonicalPoint = (point, size, transform) => (
  point ? transformPoint(point, size, inverseTransforms[transform]) : null
);

export const scoreSign = (score) => score > 0 ? 1 : score < 0 ? -1 : 0;

const parseArgs = (argv) => {
  const options = { depths: [2, 4, 6], filter: '', details: false, enableVCT: true, evaluation: 'classic' };
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--depths') {
      options.depths = (argv[++index] || '').split(',').map(Number);
    } else if (argument === '--filter') options.filter = argv[++index] || '';
    else if (argument === '--evaluation') options.evaluation = argv[++index] || '';
    else if (argument === '--details') options.details = true;
    else if (argument === '--no-vct') options.enableVCT = false;
    else if (argument === '--help') options.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  if (!options.depths.length || options.depths.some((depth) => !Number.isInteger(depth) || depth < 1)) {
    throw new Error('--depths must be a comma-separated list of positive integers');
  }
  if (!['classic', 'threat', 'capped'].includes(options.evaluation)) {
    throw new Error('--evaluation must be classic, threat, or capped');
  }
  options.depths = [...new Set(options.depths)].sort((left, right) => left - right);
  return options;
};

const selectedPositions = (filter) => {
  const normalizedFilter = filter.toLowerCase();
  return tacticalPositions.filter((position) => (
    position.expect.outcome === 'not-win'
    && (!normalizedFilter || position.id.toLowerCase().includes(normalizedFilter)
      || position.tags.some((tag) => tag.toLowerCase().includes(normalizedFilter)))
  ));
};

const runSearch = (position, transform, depth, enableVCT) => {
  const board = new Board(position.size);
  position.moves.map((move) => transformPoint(move, position.size, transform)).forEach(([x, y]) => {
    if (!board.put(x, y)) throw new Error(`${position.id}: invalid move ${x},${y}`);
  });
  clearSearchCache(board);
  resetSearchStats();
  const startedAt = performance.now();
  const [score, move, pv, completedDepth] = candidateMinmax(
    board, position.role, depth, enableVCT, { disableOpeningBook: true },
  );
  return {
    id: position.id, size: position.size, transform, depth, score, move,
    canonicalMove: canonicalPoint(move, position.size, transform), pv,
    completedDepth, nodes: searchStats.nodes, elapsedMs: performance.now() - startedAt,
    terminal: Math.abs(score) >= FIVE,
  };
};

export const summarizeRuns = (runs, depths) => {
  const byPositionDepth = new Map();
  const byPositionTransform = new Map();
  runs.forEach((run) => {
    const depthKey = `${run.id}|${run.depth}`;
    const transformKey = `${run.id}|${run.transform}`;
    byPositionDepth.set(depthKey, [...(byPositionDepth.get(depthKey) || []), run]);
    byPositionTransform.set(transformKey, [...(byPositionTransform.get(transformKey) || []), run]);
  });

  const symmetry = [...byPositionDepth].map(([key, group]) => {
    const heuristic = group.filter((run) => !run.terminal);
    const scores = heuristic.map(({ score }) => score);
    const moves = new Set(group.map(({ canonicalMove }) => JSON.stringify(canonicalMove)));
    return {
      id: group[0].id, depth: group[0].depth,
      scoreSpread: scores.length ? Math.max(...scores) - Math.min(...scores) : 0,
      signVariants: new Set(scores.map(scoreSign)).size,
      canonicalMoveVariants: moves.size,
      terminalVariants: new Set(group.map(({ terminal }) => terminal).values()).size,
      key,
    };
  });

  const transitions = [];
  for (const group of byPositionTransform.values()) {
    const ordered = [...group].sort((left, right) => left.depth - right.depth);
    for (let index = 1; index < ordered.length; index += 1) {
      const previous = ordered[index - 1];
      const current = ordered[index];
      transitions.push({
        id: current.id, transform: current.transform,
        fromDepth: previous.depth, toDepth: current.depth,
        scoreBefore: previous.score, scoreAfter: current.score,
        scoreDelta: Math.abs(current.score - previous.score),
        signFlip: !previous.terminal && !current.terminal
          && scoreSign(previous.score) !== 0 && scoreSign(current.score) !== 0
          && scoreSign(previous.score) !== scoreSign(current.score),
        moveChanged: JSON.stringify(previous.canonicalMove) !== JSON.stringify(current.canonicalMove),
        terminalTransition: previous.terminal !== current.terminal,
      });
    }
  }
  const heuristicTransitions = transitions.filter(({ terminalTransition, scoreBefore, scoreAfter }) => (
    !terminalTransition && Math.abs(scoreBefore) < FIVE && Math.abs(scoreAfter) < FIVE
  ));
  const deltas = heuristicTransitions.map(({ scoreDelta }) => scoreDelta).sort((a, b) => a - b);
  return {
    depths,
    runs: runs.length,
    positions: new Set(runs.map(({ id }) => id)).size,
    symmetryCases: symmetry.length,
    symmetryScoreSpreadMax: Math.max(0, ...symmetry.map(({ scoreSpread }) => scoreSpread)),
    symmetryScoreSpreadMean: symmetry.reduce((sum, item) => sum + item.scoreSpread, 0) / Math.max(symmetry.length, 1),
    symmetrySignVariantCases: symmetry.filter(({ signVariants }) => signVariants > 1).length,
    symmetryMoveVariantCases: symmetry.filter(({ canonicalMoveVariants }) => canonicalMoveVariants > 1).length,
    symmetryTerminalVariantCases: symmetry.filter(({ terminalVariants }) => terminalVariants > 1).length,
    depthTransitions: transitions.length,
    depthSignFlips: transitions.filter(({ signFlip }) => signFlip).length,
    depthMoveChanges: transitions.filter(({ moveChanged }) => moveChanged).length,
    terminalTransitions: transitions.filter(({ terminalTransition }) => terminalTransition).length,
    heuristicScoreDeltaMedian: deltas.length ? deltas[Math.floor(deltas.length / 2)] : 0,
    heuristicScoreDeltaMax: Math.max(0, ...deltas),
    totalNodes: runs.reduce((sum, run) => sum + run.nodes, 0),
    totalElapsedMs: runs.reduce((sum, run) => sum + run.elapsedMs, 0),
    symmetry,
    transitions,
  };
};

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  console.log('Usage: npm run ai:score-stability -- [--depths 2,4,6] [--evaluation classic|threat|capped] [--filter text] [--no-vct] [--details]');
} else {
  config.evaluationMode = options.evaluation;
  const positions = selectedPositions(options.filter);
  if (!positions.length) throw new Error(`No non-terminal positions match: ${options.filter}`);
  const runs = [];
  positions.forEach((position) => {
    for (let transform = 0; transform < 8; transform += 1) {
      options.depths.forEach((depth) => runs.push(runSearch(position, transform, depth, options.enableVCT)));
    }
  });
  const report = summarizeRuns(runs, options.depths);
  report.evaluation = options.evaluation;
  if (!options.details) {
    delete report.symmetry;
    delete report.transitions;
  }
  console.log(JSON.stringify(report, null, 2));
}
