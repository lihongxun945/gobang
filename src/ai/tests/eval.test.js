import Evaluate, {
  BLOCK_FOUR, FOUR, THREE,
} from '../eval';
import { shapes } from '../shape';

const createShapePoints = () => Object.fromEntries(
  Object.values(shapes).map((shape) => [shape, new Set()]),
);

describe('Eval', () => {
  test('incremental threat lookup matches a full score scan after moves and undos', () => {
    const evaluator = new Evaluate(15);
    const steps = [
      [7, 6], [6, 6], [7, 7], [6, 7], [7, 8], [5, 8], [8, 8], [5, 7],
    ];
    const fullScan = (threshold) => (
      evaluator.blackScores.some((row) => row.some((score) => score >= threshold))
      || evaluator.whiteScores.some((row) => row.some((score) => score >= threshold))
    );
    const expectParity = () => {
      [THREE, BLOCK_FOUR, FOUR].forEach((threshold) => {
        expect(evaluator.hasThreatAtLeast(threshold)).toBe(fullScan(threshold));
      });
    };

    expectParity();
    steps.forEach(([x, y], index) => {
      evaluator.move(x, y, index % 2 === 0 ? 1 : -1);
      expectParity();
    });
    steps.forEach(() => {
      const [position] = evaluator.history[evaluator.history.length - 1];
      evaluator.undo(Math.floor(position / evaluator.size), position % evaluator.size);
      expectParity();
    });
  });

  test('test five', () => {
    const evaluator = new Evaluate(15);
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 1 1 1 1 0 0 0 0 0
    // 0 0 0 0 0 0 2 2 0 2 2 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    const steps = [[6, 6], [7, 6], [6, 7], [7, 7], [6, 8], [7, 9], [6, 9], [7, 10]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const score = evaluator.evaluate(1);
    expect(score).toBeLessThan(FOUR);
    const moves = evaluator.getMoves(1);
    expect(moves).toHaveLength(3);
    expect(moves.slice(0, 2)).toEqual(expect.arrayContaining([[6, 5], [6, 10]]));
    expect(moves[2]).toStrictEqual([7, 8]);
    console.log(moves);
  });
  test('sorts all positional candidates before applying the root limit', () => {
    const evaluator = new Evaluate(15);
    const byRole = { 1: createShapePoints(), [-1]: createShapePoints() };
    for (let point = 0; point < 40; point += 1) {
      byRole[1][shapes.TWO].add(point);
      evaluator.blackScores[Math.floor(point / 15)][point % 15] = point;
    }
    evaluator.getPoints = () => byRole[1];

    const moves = evaluator.getMoves(1, 0);
    expect(moves).toHaveLength(32);
    expect(moves[0]).toStrictEqual([2, 9]);
    expect(moves).not.toContainEqual([0, 0]);
  });
  test('test four', () => {
    const evaluator = new Evaluate(15);
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 1 1 1 0 0 0 0 0 0
    // 0 0 0 0 0 0 2 2 0 2 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    const steps = [[6, 6], [7, 6], [6, 7], [7, 7], [6, 8], [7, 9]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const score = evaluator.evaluate(1);
    console.log('score', score)
    console.log('blackScores', evaluator.blackScores)
    console.log('whiteScores', evaluator.whiteScores)
  });
  test('test three', () => {
    const evaluator = new Evaluate(15);
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 2 2 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    const steps = [[6, 6], [7, 6], [6, 7], [7, 7]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const score = evaluator.evaluate(1);
    console.log('score', score)
    console.log('blackScores', evaluator.blackScores)
    console.log('whiteScores', evaluator.whiteScores)
  });
  test('test evaluate', () => {
    const evaluator = new Evaluate(15);
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0
    // 2 2 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    const steps = [[6, 0], [7, 0], [6, 1], [7, 1], [6, 2]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const score = evaluator.evaluate(1);
    console.log('score', score)

  });

  test('test 冲四活三胜利', () => {
    const evaluator = new Evaluate(9);
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 2 1 1 1 0 0 0 0 0
    // 0 0 0 1 0 0 0 0 0
    // 0 0 1 0 0 0 0 0 0
    // 0 0 2 2 2 0 0 0 0
    // 0 0 2 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    const steps = [[3, 1], [3, 0], [3, 2], [6, 2], [3, 3], [6, 3], [4, 3], [6, 4], [5, 2], [7, 2], [3, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const moves = evaluator.getMoves(-1);
    console.log('board', evaluator.board)
    console.log('moves', moves);
  });
  test('test 活四', () => {
    const evaluator = new Evaluate(9);
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 1 1 0 0 0
    // 0 0 0 2 2 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    const steps = [[4, 4], [5, 3], [4, 5], [5, 4], [4, 6]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const moves = evaluator.getMoves(1);
    console.log('活四 board', evaluator.board)
    console.log('moves', moves);
  });
  test('test 开局实战一', () => {
    const evaluator = new Evaluate(15);
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 2 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 2 1 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 2 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0
    const steps = [[7, 7], [8, 6], [5, 7], [6, 7], [4, 8], [7, 6]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const moves = evaluator.getMoves(1);
    console.log('moves', moves);
  });
  test('test 实战中局', () => {
    const evaluator = new Evaluate(15);
    const steps = [
      [7, 7], [8, 6], [7, 6], [7, 5], [9, 7], [8, 7], [8, 5], [9, 4], [8, 8], [7, 9], [6, 6], [5, 5], [10, 10],
      [9, 9], [5, 8], [6, 7], [6, 9], [8, 4], [4, 7], [7, 10], [3, 6], [2, 5], [6, 4], [9, 3], [10, 2], [10, 5],
      [11, 4], [10, 3], [8, 3], [8, 9], [4, 6], [5, 6], [7, 8], [6, 8], [10, 9], [11, 6], [9, 5], [12, 7], [13, 8],
      [12, 5], [12, 6], [9, 11], [8, 10], [10, 7], [9, 8], [14, 6], [4, 4], [4, 5], [3, 4], [5, 4], [5, 3],
    ];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      evaluator.move(x, y, i % 2 === 0 ? 1 : -1);
    }
    const moves = evaluator.getMoves(1);
    console.log('moves', moves);
  });
});
