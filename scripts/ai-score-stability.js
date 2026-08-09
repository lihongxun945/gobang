import Board from '../src/ai/board';
import { FIVE } from '../src/ai/eval';
import { candidateMinmax, clearSearchCache } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depths = (process.env.AI_DEPTHS || '2,4,6').split(',').map(Number);
const openingLimit = Number(process.env.AI_OPENINGS || 4);
const openings = loadOpeningSet().slice(0, openingLimit);

const createBoard = (opening) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => board.put(row, col));
  return board;
};

const records = openings.map((opening) => ({
  openingId: opening.id,
  depths: depths.map((depth) => {
    const board = createBoard(opening);
    clearSearchCache(board);
    const startedAt = performance.now();
    const [score, move, path, completedDepth] = candidateMinmax(board, board.role, depth, false);
    return {
      depth,
      completedDepth,
      score,
      move,
      pathLength: path.length,
      elapsedMs: performance.now() - startedAt,
      forced: Math.abs(score) >= FIVE,
    };
  }),
}));

let comparisons = 0;
let signFlips = 0;
let moveChanges = 0;
const absoluteDeltas = [];
for (const record of records) {
  for (let index = 1; index < record.depths.length; index += 1) {
    const previous = record.depths[index - 1];
    const current = record.depths[index];
    if (previous.forced || current.forced) continue;
    comparisons += 1;
    if (Math.sign(previous.score) !== Math.sign(current.score)) signFlips += 1;
    if (JSON.stringify(previous.move) !== JSON.stringify(current.move)) moveChanges += 1;
    absoluteDeltas.push(Math.abs(current.score - previous.score));
  }
}

absoluteDeltas.sort((left, right) => left - right);
const percentile = (ratio) => absoluteDeltas.length
  ? absoluteDeltas[Math.min(absoluteDeltas.length - 1, Math.floor(absoluteDeltas.length * ratio))]
  : 0;

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  openings: openings.length,
  depths,
  comparisons,
  signFlips,
  signFlipRate: comparisons ? signFlips / comparisons : 0,
  moveChanges,
  moveChangeRate: comparisons ? moveChanges / comparisons : 0,
  absoluteScoreDelta: {
    median: percentile(0.5),
    p90: percentile(0.9),
    max: absoluteDeltas[absoluteDeltas.length - 1] || 0,
  },
  records,
}, null, 2));
