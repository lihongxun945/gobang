import assert from 'assert';
import Board from '../src/ai/board';
import { baselineMinmax } from '../src/ai/baseline/minmax';
import { candidateMinmax } from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depth = Number(process.env.AI_DEPTH || 2);
const maxExtraMoves = Number(process.env.AI_MAX_MOVES || 30);
const openings = loadOpeningSet();

const play = (opening, blackEngine, whiteEngine) => {
  const board = new Board(opening.size);
  opening.moves.forEach(([row, col]) => assert.strictEqual(board.put(row, col), true));
  const elapsed = { black: 0, white: 0 };
  let moves = 0;
  while (!board.isGameOver() && moves < maxExtraMoves) {
    const role = board.role;
    const engine = role === 1 ? blackEngine : whiteEngine;
    const startedAt = performance.now();
    const result = engine(board, role, depth, true);
    elapsed[role === 1 ? 'black' : 'white'] += performance.now() - startedAt;
    assert(result[1], `${opening.id}: engine returned no move`);
    assert.strictEqual(board.put(result[1][0], result[1][1], role), true,
      `${opening.id}: illegal move ${result[1]}`);
    moves += 1;
  }
  return { openingId: opening.id, winner: board.getWinner(), moves, elapsed };
};

let candidateScore = 0;
const engineElapsedMs = { candidate: 0, baseline: 0 };
const games = [];
for (const opening of openings) {
  const asBlack = play(opening, candidateMinmax, baselineMinmax);
  const asWhite = play(opening, baselineMinmax, candidateMinmax);
  games.push(asBlack, asWhite);
  candidateScore += asBlack.winner === 1 ? 1 : asBlack.winner === 0 ? 0.5 : 0;
  candidateScore += asWhite.winner === -1 ? 1 : asWhite.winner === 0 ? 0.5 : 0;
  engineElapsedMs.candidate += asBlack.elapsed.black + asWhite.elapsed.white;
  engineElapsedMs.baseline += asBlack.elapsed.white + asWhite.elapsed.black;
}

const candidateRate = candidateScore / games.length;
console.log(JSON.stringify({
  fixture: gomocup2026.name,
  source: gomocup2026.source,
  depth,
  pairedOpenings: openings.length,
  games: games.length,
  candidateScore,
  baselineScore: games.length - candidateScore,
  candidateRate,
  engineElapsedMs,
  elo: candidateRate > 0 && candidateRate < 1
    ? 400 * Math.log10(candidateRate / (1 - candidateRate))
    : null,
  details: games,
}, null, 2));
