import assert from 'assert';
import Board from '../src/ai/board';
import { candidateMinmax, clearSearchCache } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depths = (process.env.AI_DEPTHS || '2,4')
  .split(',').map(Number).filter(Number.isFinite);
const openingLimit = Number(process.env.AI_OPENINGS || Number.MAX_SAFE_INTEGER);
const disableTtCutoffs = process.env.AI_DISABLE_TT_CUTOFFS === '1';
const disableQuiescence = process.env.AI_DISABLE_QUIESCENCE === '1';
const openings = loadOpeningSet().slice(0, openingLimit);

const createBoard = (opening) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  return board;
};

const evaluatorState = (board) => JSON.stringify([
  board.evaluator.blackScores,
  board.evaluator.whiteScores,
  board.evaluator.shapeCache,
]);

const run = (opening, depth, experimentalPvs) => {
  const board = createBoard(opening);
  const before = {
    text: board.toString(),
    history: JSON.stringify(board.history),
    hash: board.hash(),
    evaluator: evaluatorState(board),
  };
  clearSearchCache(board);
  const startedAt = performance.now();
  const result = candidateMinmax(board, board.role, depth, false, {
    experimentalPvs,
    disableTtCutoffs,
    disableQuiescence,
  });
  const elapsedMs = performance.now() - startedAt;
  assert.strictEqual(board.toString(), before.text, `${opening.id}: board restored`);
  assert.strictEqual(JSON.stringify(board.history), before.history, `${opening.id}: history restored`);
  assert.strictEqual(board.hash(), before.hash, `${opening.id}: hash restored`);
  assert.strictEqual(evaluatorState(board), before.evaluator, `${opening.id}: evaluator restored`);
  return { result, elapsedMs };
};

const cases = [];
for (const depth of depths) {
  for (const opening of openings) {
    const normal = run(opening, depth, false);
    const pvs = run(opening, depth, true);
    assert.deepStrictEqual(pvs.result, normal.result, `${opening.id}/depth-${depth}: PVS drift`);
    cases.push({
      openingId: opening.id,
      depth,
      normalMs: normal.elapsedMs,
      pvsMs: pvs.elapsedMs,
      speedup: normal.elapsedMs / pvs.elapsedMs,
    });
  }
}

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  depths,
  openings: openings.length,
  cases: cases.length,
  disableTtCutoffs,
  disableQuiescence,
  validation: 'pass',
  casesDetail: cases,
}, null, 2));
