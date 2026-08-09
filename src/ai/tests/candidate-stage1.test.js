import Board from '../board';
import { FIVE } from '../eval';
import { candidateMinmax, candidateVct, clearSearchCache } from '../candidate/minmax';
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
    };
    candidateMinmax(board, board.role, 4, false);
    expect(board.toString()).toBe(before.board);
    expect(board.role).toBe(before.role);
    expect(JSON.stringify(board.history)).toBe(before.history);
    expect(board.hash()).toBe(before.hash);
  });

  test('repeated cached search returns the same result', () => {
    const board = fromSteps(9, [[4, 4], [5, 3], [4, 5], [5, 4]]);
    clearSearchCache(board);
    const first = candidateMinmax(board, board.role, 4, false);
    const second = candidateMinmax(board, board.role, 4, false);
    expect(second).toEqual(first);
  });

  test('VCT finds the existing forcing win fixture', () => {
    const board = fromSteps(9, [
      [3, 1], [3, 0], [3, 2], [6, 2], [3, 3],
      [6, 3], [4, 3], [6, 4], [5, 2], [7, 2],
    ]);
    expect(candidateVct(board, 1, 10)[0]).toBe(FIVE);
  });
});
