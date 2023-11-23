import Evaluate, { FOUR } from '../eval';

describe('Eval', () => {
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
    expect(moves).toStrictEqual([[6, 5], [6, 10], [7, 8]])
    console.log(moves);
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
