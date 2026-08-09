import assert from 'assert';
import Board from '../src/ai/board';
import {
  candidateMinmax, clearSearchCache,
} from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depth = Number(process.env.AI_DEPTH || 4);
const openings = loadOpeningSet();

const sameMove = (left, right) => (
  left?.[0] === right?.[0] && left?.[1] === right?.[1]
);

const records = openings.flatMap((opening) => [false, true].map((enableVCT) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  const before = {
    hash: board.hash(),
    history: JSON.stringify(board.history),
    text: board.toString(),
  };

  clearSearchCache(board);
  const cold = candidateMinmax(board, board.role, depth, enableVCT);
  const warm = candidateMinmax(board, board.role, depth, enableVCT);
  clearSearchCache(board);
  const coldAgain = candidateMinmax(board, board.role, depth, enableVCT);

  for (const [label, result] of [['warm', warm], ['coldAgain', coldAgain]]) {
    assert.strictEqual(result[0], cold[0], `${opening.id}/${enableVCT}: ${label} score`);
    assert(sameMove(result[1], cold[1]), `${opening.id}/${enableVCT}: ${label} move`);
    assert.deepStrictEqual(result[2], cold[2], `${opening.id}/${enableVCT}: ${label} pv`);
    assert.strictEqual(result[3], cold[3], `${opening.id}/${enableVCT}: ${label} depth`);
  }

  assert.strictEqual(board.hash(), before.hash, `${opening.id}: hash restored`);
  assert.strictEqual(JSON.stringify(board.history), before.history, `${opening.id}: history restored`);
  assert.strictEqual(board.toString(), before.text, `${opening.id}: board restored`);

  return {
    openingId: opening.id,
    enableVCT,
    score: cold[0],
    move: cold[1],
    completedDepth: cold[3],
  };
}));

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  depth,
  cases: records.length,
  validation: 'pass',
  records,
}, null, 2));
