import assert from 'assert';
import Board from '../src/ai/board';
import { FIVE } from '../src/ai/eval';
import { baselineMinmax } from '../src/ai/baseline/minmax';
import { candidateMinmax, candidateVct, clearSearchCache } from '../src/ai/candidate/minmax';
import Cache from '../src/ai/cache';

const fromSteps = (size, steps) => {
  const board = new Board(size);
  steps.forEach(([x, y]) => board.put(x, y));
  return board;
};

const timed = (search, board, role, depth, enableVCT = false) => {
  const start = performance.now();
  const result = search(board, role, depth, enableVCT);
  return { result, elapsedMs: performance.now() - start };
};

const tacticalChecks = () => {
  const immediate = fromSteps(6, [
    [0, 0], [0, 1], [1, 1], [1, 2],
    [2, 2], [2, 3], [3, 3], [3, 4],
  ]);
  const [score, move, path, completedDepth] = candidateMinmax(immediate, 1, 4, true);
  assert.strictEqual(score, FIVE);
  assert.deepStrictEqual(move, [4, 4]);
  assert.deepStrictEqual(path[0], move);
  assert(completedDepth > 0);

  const stable = fromSteps(9, [[4, 4], [5, 3], [4, 5], [5, 4]]);
  const before = [stable.toString(), stable.role, JSON.stringify(stable.history), stable.hash()];
  clearSearchCache(stable);
  const first = candidateMinmax(stable, stable.role, 4, false);
  const after = [stable.toString(), stable.role, JSON.stringify(stable.history), stable.hash()];
  assert.deepStrictEqual(after, before);
  assert.deepStrictEqual(candidateMinmax(stable, stable.role, 4, false), first);

  const forcing = fromSteps(9, [
    [3, 1], [3, 0], [3, 2], [6, 2], [3, 3],
    [6, 3], [4, 3], [6, 4], [5, 2], [7, 2],
  ]);
  assert.strictEqual(candidateVct(forcing, 1, 10)[0], FIVE);

  const cache = new Cache(2);
  cache.put('a', 1);
  cache.put('b', 2);
  cache.put('a', 3);
  cache.put('c', 4);
  assert.strictEqual(cache.get('a'), null);
  assert.strictEqual(cache.get('b'), 2);
  assert.strictEqual(cache.get('c'), 4);

  clearSearchCache(stable);
  const timedBefore = [stable.toString(), stable.role, stable.hash()];
  const startedAt = performance.now();
  const timedResult = candidateMinmax(stable, stable.role, 20, false, { timeLimitMs: 5 });
  const timedElapsed = performance.now() - startedAt;
  assert(timedResult[1], 'timed search must return a legal fallback or completed move');
  assert(timedElapsed < 100, `timed search exceeded safety margin: ${timedElapsed}ms`);
  assert.deepStrictEqual([stable.toString(), stable.role, stable.hash()], timedBefore);

  clearSearchCache(stable);
  const vctStartedAt = performance.now();
  const timedVctResult = candidateMinmax(stable, stable.role, 20, true, { timeLimitMs: 10 });
  const timedVctElapsed = performance.now() - vctStartedAt;
  assert(timedVctResult[1], 'timed VCT search must return a legal move');
  assert(timedVctElapsed < 150, `timed VCT exceeded safety margin: ${timedVctElapsed}ms`);
  assert.deepStrictEqual([stable.toString(), stable.role, stable.hash()], timedBefore);

  const defense = fromSteps(15, [
    [7, 7], [8, 6], [7, 5], [7, 6], [6, 6], [5, 5], [6, 7], [5, 7],
    [5, 6], [7, 8], [6, 4], [6, 5], [8, 7], [9, 7], [3, 4], [4, 5],
    [3, 5], [4, 4], [4, 3], [9, 6], [3, 6], [3, 3], [5, 2], [2, 5],
    [3, 7], [3, 8], [4, 6], [2, 6], [6, 1], [7, 0], [2, 4], [5, 9],
    [0, 2], [1, 3], [9, 8], [2, 8], [6, 2], [6, 9], [4, 9], [9, 9],
    [6, 3], [6, 0],
  ]);
  const defenseResult = candidateMinmax(defense, 1, 6, true);
  assert(defenseResult[0] < FIVE, 'defensive position must not be reported as a forced win');
  assert([[10, 6], [7, 9], [8, 9]].some(([x, y]) => (
    defenseResult[1][0] === x && defenseResult[1][1] === y
  )), `unexpected defensive move: ${JSON.stringify(defenseResult[1])}`);
};

const seedOpenings = [
  [[4, 4], [5, 4], [4, 5], [5, 5]],
  [[4, 4], [3, 3], [5, 4], [4, 3]],
  [[4, 4], [5, 5], [3, 5], [5, 3]],
  [[4, 4], [4, 5], [5, 5], [3, 3], [5, 3], [3, 5]],
  [[4, 4], [3, 4], [5, 5], [3, 5], [5, 3], [4, 3]],
  [[4, 4], [5, 3], [3, 4], [5, 4], [3, 5], [4, 5]],
];

const transforms = [
  ([x, y]) => [x, y], ([x, y]) => [y, 8 - x],
  ([x, y]) => [8 - x, 8 - y], ([x, y]) => [8 - y, x],
  ([x, y]) => [x, 8 - y], ([x, y]) => [8 - x, y],
  ([x, y]) => [y, x], ([x, y]) => [8 - y, 8 - x],
];

const openingLimit = Number(process.env.AI_OPENINGS || 16);
const matchDepth = Number(process.env.AI_DEPTH || 2);
const openings = seedOpenings
  .flatMap((opening) => transforms.map((transform) => opening.map(transform)))
  .filter((opening, index, all) => (
    all.findIndex((item) => JSON.stringify(item) === JSON.stringify(opening)) === index
  ))
  .slice(0, openingLimit);

const play = (opening, blackSearch, whiteSearch, depth = 2) => {
  const board = fromSteps(9, opening);
  const totals = { blackMs: 0, whiteMs: 0, moves: 0 };
  while (!board.isGameOver() && totals.moves < 81 - opening.length) {
    const role = board.role;
    const search = role === 1 ? blackSearch : whiteSearch;
    const { result, elapsedMs } = timed(search, board, role, depth, false);
    const move = result[1] || board.getValidMoves()[0];
    assert(move, 'engine returned no legal move');
    assert.strictEqual(board.put(move[0], move[1], role), true, `illegal move ${move}`);
    if (role === 1) totals.blackMs += elapsedMs;
    else totals.whiteMs += elapsedMs;
    totals.moves += 1;
  }
  return { winner: board.getWinner(), ...totals };
};

const pairedSmokeMatch = () => {
  let candidateScore = 0;
  let baselineScore = 0;
  const games = [];
  for (const opening of openings) {
    const candidateBlack = play(opening, candidateMinmax, baselineMinmax, matchDepth);
    const candidateWhite = play(opening, baselineMinmax, candidateMinmax, matchDepth);
    games.push(candidateBlack, candidateWhite);
    candidateScore += candidateBlack.winner === 1 ? 1 : candidateBlack.winner === 0 ? 0.5 : 0;
    candidateScore += candidateWhite.winner === -1 ? 1 : candidateWhite.winner === 0 ? 0.5 : 0;
    baselineScore += 2 - (candidateBlack.winner === 1 ? 1 : candidateBlack.winner === 0 ? 0.5 : 0)
      - (candidateWhite.winner === -1 ? 1 : candidateWhite.winner === 0 ? 0.5 : 0);
  }
  const candidateRate = candidateScore / games.length;
  const elo = candidateRate > 0 && candidateRate < 1
    ? 400 * Math.log10(candidateRate / (1 - candidateRate))
    : null;
  return {
    depth: matchDepth, openings: openings.length, games: games.length,
    candidateScore, baselineScore, candidateRate, elo, details: games,
  };
};

tacticalChecks();
const match = pairedSmokeMatch();
console.log(JSON.stringify({ tactical: 'pass', match }, null, 2));
