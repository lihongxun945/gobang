import assert from 'assert';
import Board from '../src/ai/board';
import { candidateMinmax, clearSearchCache } from '../src/ai/candidate/minmax';
import { loadOpeningSet } from '../src/ai/fixtures/openings';

const verifyScoutAtPly = Number(process.env.VERIFY_PLY || 1);
const opening = loadOpeningSet().find(({ id }) => id === 'gomocup-2026-f15-02');
assert(opening, 'opening 02 not found');

const createBoard = () => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  return board;
};

const normalBoard = createBoard();
const normalScoresBefore = JSON.stringify([normalBoard.evaluator.blackScores, normalBoard.evaluator.whiteScores, normalBoard.evaluator.shapeCache]);
clearSearchCache(normalBoard);
const normal = candidateMinmax(normalBoard, normalBoard.role, 6, false, {
  disableTtCutoffs: true,
  disableQuiescence: true,
});

const normalScoresRestored = normalScoresBefore === JSON.stringify([normalBoard.evaluator.blackScores, normalBoard.evaluator.whiteScores, normalBoard.evaluator.shapeCache]);
const boundaryViolations = [];
const trace = [];
const pvsBoard = createBoard();
const pvsScoresBefore = JSON.stringify([pvsBoard.evaluator.blackScores, pvsBoard.evaluator.whiteScores, pvsBoard.evaluator.shapeCache]);
clearSearchCache(pvsBoard);
const pvs = candidateMinmax(pvsBoard, pvsBoard.role, 6, false, {
  experimentalPvs: true,
  disableTtCutoffs: true,
  disableQuiescence: true,
  traceRoot: (entry) => trace.push(entry),
  verifyScoutAtPly,
  traceBoundary: (entry) => boundaryViolations.push(entry),
});
const pvsScoresRestored = pvsScoresBefore === JSON.stringify([
  pvsBoard.evaluator.blackScores,
  pvsBoard.evaluator.whiteScores, pvsBoard.evaluator.shapeCache,
]);

console.log(JSON.stringify({
  openingId: opening.id,
  normal,
  pvs,
  identical: JSON.stringify(normal) === JSON.stringify(pvs),
  normalScoresRestored,
  pvsScoresRestored,
  verifyScoutAtPly,
  boundaryViolations,
  depth6Trace: trace.filter(({ depth }) => depth === 6),
}, null, 2));
