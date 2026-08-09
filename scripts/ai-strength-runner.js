import assert from 'assert';
import Board from '../src/ai/board';
import { baselineMinmax } from '../src/ai/baseline/minmax';
import { candidateMinmax } from '../src/ai/candidate/minmax';

const depth = Number(process.env.AI_DEPTH || 4);
const maxExtraMoves = Number(process.env.AI_MAX_MOVES || 40);

const openings = [
  [[7, 7], [8, 6], [7, 5], [7, 6], [6, 6], [5, 5], [6, 7], [5, 7],
    [5, 6], [7, 8], [6, 4], [6, 5], [8, 7], [9, 7], [3, 4], [4, 5],
    [3, 5], [4, 4], [4, 3], [9, 6], [3, 6], [3, 3], [5, 2], [2, 5],
    [3, 7], [3, 8], [4, 6], [2, 6], [6, 1], [7, 0], [2, 4], [5, 9],
    [0, 2], [1, 3], [9, 8], [2, 8], [6, 2], [6, 9], [4, 9], [9, 9],
    [6, 3], [6, 0]],
  [[7, 7], [8, 6], [8, 8], [6, 6], [7, 8], [6, 8], [6, 7], [8, 7],
    [5, 6], [8, 9]],
  [[7, 6], [7, 5], [8, 5], [8, 6], [9, 4]],
  [[7, 7], [6, 7], [8, 6], [6, 6], [6, 8], [5, 9], [9, 5], [10, 4],
    [9, 7], [6, 4], [6, 5], [8, 5], [10, 6], [7, 6], [9, 4], [9, 6],
    [11, 7], [8, 4], [12, 8], [13, 9], [10, 8], [5, 8], [4, 9], [7, 5],
    [5, 7], [10, 2], [9, 3], [10, 3], [10, 1], [10, 7], [7, 4]],
  [[7, 7], [8, 6], [8, 8], [7, 8], [9, 7], [7, 9], [9, 9], [6, 6],
    [10, 10], [11, 11], [8, 7], [10, 7], [9, 8], [9, 10], [9, 6], [9, 5],
    [10, 8], [10, 9], [6, 7], [5, 7], [11, 8], [12, 8], [8, 10], [11, 7],
    [10, 6], [11, 5], [10, 5], [11, 4], [11, 6], [10, 4], [7, 11], [6, 12],
    [9, 4], [8, 3], [8, 9], [8, 11], [7, 6], [8, 5], [6, 5], [5, 4],
    [12, 6], [13, 6], [12, 7], [13, 8]],
  [[7, 7], [7, 8], [8, 6], [9, 5], [6, 6], [8, 8], [7, 5], [6, 8],
    [5, 8], [9, 8], [10, 8], [9, 7], [9, 6], [7, 6], [5, 7], [8, 4],
    [10, 6], [8, 7], [6, 5]],
  [[7, 7], [8, 6], [7, 6], [7, 5], [9, 7], [8, 7], [8, 5], [9, 4],
    [8, 8], [7, 9], [6, 6], [5, 5], [10, 10], [9, 9], [5, 8], [6, 7],
    [6, 9], [8, 4], [4, 7], [7, 10], [3, 6], [2, 5], [6, 4], [9, 3],
    [10, 2], [10, 5], [11, 4], [10, 3], [8, 3], [8, 9], [4, 6], [5, 6],
    [7, 8], [6, 8], [10, 9], [11, 6], [9, 5], [12, 7], [13, 8], [12, 5],
    [12, 6], [9, 11], [8, 10], [10, 7], [9, 8], [14, 6]],
  [[7, 7], [8, 6], [6, 6], [8, 8], [7, 5], [7, 6], [8, 7], [6, 7],
    [8, 5], [9, 6], [8, 4], [9, 3], [11, 6], [10, 5], [9, 7], [10, 7],
    [5, 5], [6, 5], [10, 6], [7, 3], [8, 3], [8, 2], [11, 5], [7, 8],
    [11, 4], [11, 3], [5, 6], [5, 7], [3, 3], [4, 4], [11, 8], [11, 7],
    [12, 4], [13, 3], [13, 6], [12, 6], [10, 3], [12, 5], [12, 7], [10, 9],
    [10, 4], [9, 4], [9, 2], [9, 10], [7, 0], [8, 1], [13, 4], [14, 4],
    [10, 8], [10, 10], [8, 9], [10, 11], [13, 8], [12, 8], [13, 7], [13, 5],
    [8, 10], [10, 12], [10, 13], [11, 11], [12, 11], [11, 12], [13, 9],
    [13, 10], [11, 10], [9, 12]],
];

const createBoard = (steps) => {
  const board = new Board(15);
  steps.forEach(([x, y]) => assert.strictEqual(board.put(x, y), true));
  assert.strictEqual(board.getWinner(), 0, 'opening must not already be won');
  return board;
};

const play = (opening, blackEngine, whiteEngine) => {
  const board = createBoard(opening);
  const elapsed = { black: 0, white: 0 };
  let moves = 0;
  while (!board.isGameOver() && moves < maxExtraMoves) {
    const role = board.role;
    const engine = role === 1 ? blackEngine : whiteEngine;
    const startedAt = performance.now();
    const result = engine(board, role, depth, true);
    elapsed[role === 1 ? 'black' : 'white'] += performance.now() - startedAt;
    const move = result[1];
    assert(move, 'engine returned no move');
    assert.strictEqual(board.put(move[0], move[1], role), true, `illegal move ${move}`);
    moves += 1;
  }
  return { winner: board.getWinner(), moves, elapsed };
};

let candidateScore = 0;
const engineElapsed = { candidate: 0, baseline: 0 };
const games = [];
for (const opening of openings) {
  const asBlack = play(opening, candidateMinmax, baselineMinmax);
  const asWhite = play(opening, baselineMinmax, candidateMinmax);
  games.push(asBlack, asWhite);
  engineElapsed.candidate += asBlack.elapsed.black + asWhite.elapsed.white;
  engineElapsed.baseline += asBlack.elapsed.white + asWhite.elapsed.black;
  candidateScore += asBlack.winner === 1 ? 1 : asBlack.winner === 0 ? 0.5 : 0;
  candidateScore += asWhite.winner === -1 ? 1 : asWhite.winner === 0 ? 0.5 : 0;
}

const candidateRate = candidateScore / games.length;
console.log(JSON.stringify({
  boardSize: 15,
  depth,
  pairedOpenings: openings.length,
  games: games.length,
  candidateScore,
  baselineScore: games.length - candidateScore,
  candidateRate,
  engineElapsedMs: engineElapsed,
  elo: candidateRate > 0 && candidateRate < 1
    ? 400 * Math.log10(candidateRate / (1 - candidateRate))
    : null,
  details: games,
}, null, 2));
