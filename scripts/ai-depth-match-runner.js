import assert from 'assert';
import Board from '../src/ai/board';
import { baselineMinmax } from '../src/ai/baseline/minmax';
import { candidateMinmax } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const candidateDepth = Number(process.env.AI_CANDIDATE_DEPTH || 6);
const baselineDepth = Number(process.env.AI_BASELINE_DEPTH || 4);
const maxExtraMoves = Number(process.env.AI_MAX_MOVES || 20);
const openingLimit = Number(process.env.AI_OPENINGS || 4);
const openings = loadOpeningSet().slice(0, openingLimit);

const play = (opening, blackEngine, whiteEngine) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  const elapsed = { candidate: 0, baseline: 0 };
  let moves = 0;
  while (!board.isGameOver() && moves < maxExtraMoves) {
    const engine = board.role === 1 ? blackEngine : whiteEngine;
    const isCandidate = engine === candidateMinmax;
    const startedAt = performance.now();
    const result = engine(
      board, board.role, isCandidate ? candidateDepth : baselineDepth, true,
    );
    elapsed[isCandidate ? 'candidate' : 'baseline'] += performance.now() - startedAt;
    assert(result[1], `${opening.id}: engine returned no move`);
    assert.strictEqual(board.put(result[1][0], result[1][1]), true);
    moves += 1;
  }
  return { openingId: opening.id, winner: board.getWinner(), moves, elapsed };
};

let candidateScore = 0;
const elapsedMs = { candidate: 0, baseline: 0 };
const games = [];
for (const opening of openings) {
  const asBlack = play(opening, candidateMinmax, baselineMinmax);
  const asWhite = play(opening, baselineMinmax, candidateMinmax);
  games.push(asBlack, asWhite);
  candidateScore += asBlack.winner === 1 ? 1 : asBlack.winner === 0 ? 0.5 : 0;
  candidateScore += asWhite.winner === -1 ? 1 : asWhite.winner === 0 ? 0.5 : 0;
  elapsedMs.candidate += asBlack.elapsed.candidate + asWhite.elapsed.candidate;
  elapsedMs.baseline += asBlack.elapsed.baseline + asWhite.elapsed.baseline;
}

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  candidateDepth,
  baselineDepth,
  pairedOpenings: openings.length,
  games: games.length,
  candidateScore,
  baselineScore: games.length - candidateScore,
  elapsedMs,
  details: games,
}, null, 2));
