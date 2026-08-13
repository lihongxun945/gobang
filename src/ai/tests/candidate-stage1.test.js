import Board from '../board';
import { FIVE } from '../eval';
import {
  candidateMinmax, candidateVct, clearSearchCache, resetSearchStats, searchStats,
} from '../candidate/minmax';
import { loadOpeningSet } from '../fixtures/openings';

const fromSteps = (size, steps) => {
  const board = new Board(size);
  steps.forEach(([x, y]) => board.put(x, y));
  return board;
};

describe('stage-one candidate search', () => {
  test('incremental evaluation depends only on the position, not move order', () => {
    const opening = loadOpeningSet().find(({ id }) => id === 'gomocup-2026-f15-02');
    const original = fromSteps(opening.size, opening.moves);
    const reordered = fromSteps(opening.size, [
      opening.moves[2], opening.moves[3], opening.moves[0],
      opening.moves[1], opening.moves[4],
    ]);
    const evaluationState = (board) => ({
      blackScores: board.evaluator.blackScores,
      whiteScores: board.evaluator.whiteScores,
      shapeCache: board.evaluator.shapeCache,
      activePoints: {
        1: [...board.evaluator.activePoints[1]].sort((a, b) => a - b),
        [-1]: [...board.evaluator.activePoints[-1]].sort((a, b) => a - b),
      },
    });

    expect(reordered.toString()).toBe(original.toString());
    expect(evaluationState(reordered)).toEqual(evaluationState(original));
  });

  test('finds an immediate diagonal win and reports completed depth', () => {
    const board = fromSteps(6, [
      [0, 0], [0, 1], [1, 1], [1, 2],
      [2, 2], [2, 3], [3, 3], [3, 4],
    ]);
    const [score, move, path, completedDepth] = candidateMinmax(board, 1, 4, true);
    expect(score).toBe(FIVE);
    expect(move).toEqual([4, 4]);
    expect(path[0]).toEqual(move);
    expect(completedDepth).toBeGreaterThan(0);
  });

  test('search restores board, role, history and hash', () => {
    const board = fromSteps(9, [[4, 4], [5, 3], [4, 5], [5, 4]]);
    const before = {
      board: board.toString(), role: board.role,
      history: JSON.stringify(board.history), hash: board.hash(),
      activePoints: JSON.stringify({
        1: [...board.evaluator.activePoints[1]].sort((a, b) => a - b),
        [-1]: [...board.evaluator.activePoints[-1]].sort((a, b) => a - b),
      }),
    };
    candidateMinmax(board, board.role, 4, false);
    expect(board.toString()).toBe(before.board);
    expect(board.role).toBe(before.role);
    expect(JSON.stringify(board.history)).toBe(before.history);
    expect(board.hash()).toBe(before.hash);
    expect(JSON.stringify({
      1: [...board.evaluator.activePoints[1]].sort((a, b) => a - b),
      [-1]: [...board.evaluator.activePoints[-1]].sort((a, b) => a - b),
    })).toBe(before.activePoints);
  });

  test('depth-two search extends the strongest open-three continuations', () => {
    const board = fromSteps(15, [
      [7, 6], [6, 6], [7, 7], [6, 7],
    ]);

    resetSearchStats();
    candidateMinmax(board, board.role, 2, false, { disableOpeningBook: true });

    expect(searchStats.qThreeExtensions).toBeGreaterThan(0);
  });

  test('depth-two search includes a tied third open-three continuation', () => {
    const triggered = loadOpeningSet().some((opening) => {
      const board = fromSteps(opening.size, opening.moves);
      resetSearchStats();
      candidateMinmax(board, board.role, 2, false, { disableOpeningBook: true });
      return searchStats.qThreeThirdMoves > 0;
    });

    expect(triggered).toBe(true);
  });

  test('repeated cached search returns the same result', () => {
    const board = fromSteps(9, [[4, 4], [5, 3], [4, 5], [5, 4]]);
    clearSearchCache(board);
    const first = candidateMinmax(board, board.role, 4, false);
    const second = candidateMinmax(board, board.role, 4, false);
    expect(second).toEqual(first);
  });

  test('default root PVS preserves the full-window result', () => {
    const steps = [[4, 4], [5, 3], [4, 5], [5, 4], [3, 5], [6, 5]];
    const fullWindow = candidateMinmax(fromSteps(9, steps), 1, 4, false, {
      experimentalPvs: false,
    });
    resetSearchStats();
    const pvs = candidateMinmax(fromSteps(9, steps), 1, 4, false);

    expect(pvs).toEqual(fullWindow);
    expect(searchStats.pvsScouts).toBeGreaterThan(0);

    resetSearchStats();
    candidateMinmax(fromSteps(9, steps), 1, 4, false, { timeLimitMs: 10000 });
    expect(searchStats.pvsScouts).toBe(0);
  });

  test('VCT finds the existing forcing win fixture', () => {
    const board = fromSteps(9, [
      [3, 1], [3, 0], [3, 2], [6, 2], [3, 3],
      [6, 3], [4, 3], [6, 4], [5, 2], [7, 2],
    ]);
    expect(candidateVct(board, 1, 10)[0]).toBe(FIVE);
  });

  test('opponent VCT is color-symmetric without cloning or mutating the board', () => {
    const board = fromSteps(9, [
      [3, 1], [3, 0], [3, 2], [6, 2], [3, 3],
      [6, 3], [4, 3], [6, 4], [5, 2], [7, 2],
    ]);
    const before = {
      position: board.toString(), role: board.role,
      history: JSON.stringify(board.history), hash: board.hash(),
    };
    const reversedResult = candidateVct(board.reverse(), -1, 10);
    const directResult = candidateVct(board, 1, 10);

    expect(directResult).toEqual(reversedResult);
    expect(board.toString()).toBe(before.position);
    expect(board.role).toBe(before.role);
    expect(JSON.stringify(board.history)).toBe(before.history);
    expect(board.hash()).toBe(before.hash);

    const reverse = jest.spyOn(board, 'reverse');
    candidateMinmax(board, -1, 2, true, { disableOpeningBook: true });
    expect(reverse).not.toHaveBeenCalled();
    expect(board.toString()).toBe(before.position);
    expect(board.role).toBe(before.role);
    reverse.mockRestore();
  });

  test('keeps the critical defensive candidate in a crowded middle game', () => {
    const board = fromSteps(15, [
      [7, 7], [8, 6], [7, 5], [7, 6], [6, 6], [5, 5], [6, 7], [5, 7],
      [5, 6], [7, 8], [6, 4], [6, 5], [8, 7], [9, 7], [3, 4], [4, 5],
      [3, 5], [4, 4], [4, 3], [9, 6], [3, 6], [3, 3], [5, 2], [2, 5],
      [3, 7], [3, 8], [4, 6], [2, 6], [6, 1], [7, 0], [2, 4], [5, 9],
      [0, 2], [1, 3], [9, 8], [2, 8], [6, 2], [6, 9], [4, 9], [9, 9],
      [6, 3], [6, 0],
    ]);

    const [, move] = candidateMinmax(board, 1, 6, true);
    expect([[10, 6], [7, 9], [8, 9]]).toContainEqual(move);
  });
});
