import assert from 'assert';
import Board from '../src/ai/board';
import { baselineMinmax } from '../src/ai/baseline/minmax';
import { candidateMinmax } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const baselineDepth = Number(process.env.AI_BASELINE_DEPTH || 4);
const candidateMaxDepth = Number(process.env.AI_MAX_DEPTH || 10);
const openings = loadOpeningSet();

const createBoard = (opening) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  return board;
};

const records = openings.map((opening) => {
  const baselineBoard = createBoard(opening);
  const baselineStartedAt = performance.now();
  const baselineResult = baselineMinmax(
    baselineBoard, baselineBoard.role, baselineDepth, true,
  );
  const baselineMs = performance.now() - baselineStartedAt;
  assert(baselineResult[1], `${opening.id}: baseline returned no move`);

  const candidateBoard = createBoard(opening);
  const candidateStartedAt = performance.now();
  const candidateResult = candidateMinmax(
    candidateBoard, candidateBoard.role, candidateMaxDepth, true,
    { timeLimitMs: baselineMs },
  );
  const candidateMs = performance.now() - candidateStartedAt;
  assert(candidateResult[1], `${opening.id}: candidate returned no move`);

  return {
    openingId: opening.id,
    budgetMs: baselineMs,
    baselineDepth,
    candidateCompletedDepth: candidateResult[3],
    candidateMs,
    depthGain: candidateResult[3] - baselineDepth,
  };
});

const completedDepths = records.map(({ candidateCompletedDepth }) => candidateCompletedDepth);
console.log(JSON.stringify({
  fixture: gomocup2026.name,
  baselineDepth,
  candidateMaxDepth,
  positions: records.length,
  candidateReachedBaselineDepth: records.filter(({ depthGain }) => depthGain >= 0).length,
  candidateSearchedDeeper: records.filter(({ depthGain }) => depthGain > 0).length,
  minCompletedDepth: Math.min(...completedDepths),
  averageCompletedDepth: completedDepths.reduce((sum, depth) => sum + depth, 0) / records.length,
  records,
}, null, 2));
