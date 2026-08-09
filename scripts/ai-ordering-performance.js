import assert from 'assert';
import Board from '../src/ai/board';
import { candidateMinmax, clearSearchCache, resetSearchStats, searchStats } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depth = Number(process.env.AI_DEPTH || 4);
const rounds = Number(process.env.AI_ROUNDS || 5);
const orderingMode = process.env.AI_ORDERING_MODE || 'combined';
const openings = loadOpeningSet();

const createBoard = (opening) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  return board;
};

const measure = (opening, experimentalMoveOrdering) => {
  const board = createBoard(opening);
  clearSearchCache(board);
  resetSearchStats();
  const startedAt = performance.now();
  const result = candidateMinmax(board, board.role, depth, false, experimentalMoveOrdering ? {
    experimentalMoveOrderingMode: orderingMode,
  } : { disableMoveOrdering: true });
  return { result, elapsedMs: performance.now() - startedAt, nodes: searchStats.nodes };
};

const samples = [];
let pvDrifts = 0;
for (let round = 0; round < rounds; round += 1) {
  let currentMs = 0;
  let experimentalMs = 0;
  let currentNodes = 0;
  let experimentalNodes = 0;
  for (let index = 0; index < openings.length; index += 1) {
    const opening = openings[index];
    const experimentalFirst = (round + index) % 2 === 0;
    const first = measure(opening, experimentalFirst);
    const second = measure(opening, !experimentalFirst);
    const current = experimentalFirst ? second : first;
    const experimental = experimentalFirst ? first : second;
    assert.strictEqual(
      experimental.result[0], current.result[0],
      `${opening.id}/round-${round + 1}: score drift`,
    );
    assert.deepStrictEqual(
      experimental.result[1], current.result[1],
      `${opening.id}/round-${round + 1}: root move drift`,
    );
    assert.strictEqual(
      experimental.result[3], current.result[3],
      `${opening.id}/round-${round + 1}: completed-depth drift`,
    );
    if (JSON.stringify(experimental.result[2]) !== JSON.stringify(current.result[2])) {
      pvDrifts += 1;
    }
    currentMs += current.elapsedMs;
    experimentalMs += experimental.elapsedMs;
    currentNodes += current.nodes;
    experimentalNodes += experimental.nodes;
  }
  samples.push({
    round: round + 1,
    currentMs,
    experimentalMs,
    speedup: currentMs / experimentalMs,
    currentNodes,
    experimentalNodes,
    nodeRatio: experimentalNodes / currentNodes,
  });
}

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  depth,
  rounds,
  orderingMode,
  positionsPerRound: openings.length,
  experimentalFasterEveryRound: samples.every(({ currentMs, experimentalMs }) => (
    experimentalMs < currentMs
  )),
  medianSpeedup: median(samples.map(({ speedup }) => speedup)),
  medianNodeRatio: median(samples.map(({ nodeRatio }) => nodeRatio)),
  pvDrifts,
  samples,
}, null, 2));
