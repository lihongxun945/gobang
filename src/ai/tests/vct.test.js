import Board from '../board';
import { vct, cache_hits } from '../minmax';
import { FIVE, FOUR, performance } from '../eval';

describe('minmax', () => {
  test('test 连五胜', () => {
    const board = new Board(6);
    // 1 2 0 0 0 0
    // 0 1 2 0 0 0
    // 0 0 1 2 0 0
    // 0 0 0 1 2 0
    // 0 0 0 0 0 0
    // 0 0 0 0 0 0
    const steps = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3], [3, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 4);
    expect(score[0]).toBe(FIVE);
    console.log('minmax score1', score);
    console.log('cache: total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
  });
  test('test 冲四活三胜利', () => {
    const board = new Board(9);
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 2 1 1 1 0 0 0 0 0
    // 0 0 0 1 0 0 0 0 0
    // 0 0 1 0 0 0 0 0 0
    // 0 0 2 2 2 0 0 0 0
    // 0 0 2 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    const steps = [[3, 1], [3, 0], [3, 2], [6, 2], [3, 3], [6, 3], [4, 3], [6, 4], [5, 2], [7, 2]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 10);
    console.log('minmax score2', score);
    console.log('cache: total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    expect(score[0]).toBe(FIVE);
  });
  test('test 开局', () => {
    const board = new Board(10);
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 1 1 0 0 0 0
    // 0 0 0 2 2 1 0 0 0 0
    // 0 0 0 0 2 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    const steps = [[4, 4], [5, 3], [4, 5], [5, 4], [5, 5], [6, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 8);
    expect(score[0]).toBeLessThan(FOUR);
    console.log('minmax score3', score)
    console.log('cache: total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
  });
  test('test 从零开局', () => {
    const board = new Board(9);
    const score = vct(board, 1, 8);
    expect(score[0]).toBeLessThan(FOUR);
    console.log('minmax score4', score)
    console.log('cache: total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
  });
  test('test 连续冲四活三胜', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [7, 5], [7, 6], [6, 6], [5, 5], [6, 7], [5, 7], [5, 6], [7, 8], [6, 4], [6, 5], [8, 7], [9, 7], [3, 4], [4, 5], [3, 5], [4, 4], [4, 3], [9, 6], [3, 6], [3, 3], [5, 2], [2, 5], [3, 7], [3, 8], [4, 6], [2, 6], [6, 1], [7, 0], [2, 4], [5, 9], [0, 2], [1, 3], [9, 8], [2, 8], [6, 2], [6, 9], [4, 9], [9, 9], [6, 3], [6, 0]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    const score = vct(board, -1, 8);
    console.log('minmax score5', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toEqual(FIVE);
  });
  test('test 防守连续冲四活三', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [7, 5], [7, 6], [6, 6], [5, 5], [6, 7], [5, 7], [5, 6], [7, 8], [6, 4], [6, 5], [8, 7], [9, 7], [3, 4], [4, 5], [3, 5], [4, 4], [4, 3], [9, 6], [3, 6], [3, 3], [5, 2], [2, 5], [3, 7], [3, 8], [4, 6], [2, 6], [6, 1], [7, 0], [2, 4], [5, 9], [0, 2], [1, 3], [9, 8], [2, 8], [6, 2], [6, 9], [4, 9], [9, 9], [6, 3], [6, 0]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    const score = vct(board, 1, 12);
    console.log('##防守连续冲四活三')
    console.log('minmax score', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
  test('test 无杀棋', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [8, 8], [6, 6], [7, 8], [6, 8], [6, 7], [8, 7], [5, 6], [8, 9]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 10);
    console.log('minmax score6', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
  test('test 算对面杀棋', () => {
    let board = new Board(15);
    const steps = [[7, 7], [6, 7], [8, 6], [6, 6], [6, 8], [5, 9], [9, 5], [10, 4], [9, 7], [6, 4], [6, 5], [8, 5], [10, 6], [7, 6], [9, 4], [9, 6], [11, 7], [8, 4], [12, 8], [13, 9], [10, 8], [5, 8], [4, 9], [7, 5], [5, 7], [10, 2], [9, 3], [10, 3], [10, 1], [10, 7], [7, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    const score = vct(board, 1, 10);
    console.log('minmax score7', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toEqual(FIVE);
  });
  test('test 无杀棋2', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [7, 6], [7, 5], [9, 7], [8, 7], [8, 5], [9, 4], [8, 8], [7, 9], [6, 6], [5, 5], [10, 10], [9, 9], [5, 8], [6, 7], [6, 9], [8, 4], [4, 7], [7, 10], [3, 6], [2, 5], [6, 4], [9, 3], [10, 2], [10, 5], [11, 4], [10, 3], [8, 3], [8, 9], [4, 6], [5, 6], [7, 8], [6, 8], [10, 9], [11, 6], [9, 5], [12, 7], [13, 8], [12, 5], [12, 6], [9, 11], [8, 10], [10, 7], [9, 8], [14, 6]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 14);
    console.log('minmax score8', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
  test('test 无杀棋3', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [6, 6], [8, 8], [7, 5], [7, 6], [8, 7], [6, 7], [8, 5], [9, 7], [9, 5], [10, 5]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 10);
    console.log('minmax score8', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
  test('test 无杀棋4', () => {
    const board = new Board(15);
    const steps = [[7, 7], [6, 6], [6, 8], [8, 6], [5, 7], [5, 9], [7, 9], [4, 6]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 10);
    console.log('minmax score9', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
  test('test 防守', () => {
    const board = new Board(15);
    const steps = [[7, 6], [7, 5], [8, 5], [8, 6], [9, 4], [6, 7], [10, 3], [11, 2], [10, 5], [8, 3], [11, 4], [10, 4], [11, 6], [7, 7], [12, 7], [13, 8], [9, 5]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, -1, 10);
    console.log('#####test 防守#####')
    console.log(board.display());
    console.log('minmax score', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBe(-FIVE);
  });
  test('test 无杀棋5', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [9, 6], [8, 5], [8, 7], [7, 8], [9, 7], [10, 7], [8, 8], [9, 9], [6, 7], [5, 7], [9, 4], [9, 5], [10, 5], [11, 4], [6, 6], [10, 10], [5, 5], [4, 4], [6, 4], [6, 5], [7, 2], [8, 3], [10, 6], [7, 9], [8, 4], [7, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 10);
    console.log('##无杀棋5')
    console.log('minmax score', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
  test('test 有杀棋6', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [9, 6], [9, 5], [7, 5], [6, 6], [7, 6], [7, 4], [8, 7], [7, 8], [6, 7], [5, 7], [10, 7], [9, 7], [10, 9], [9, 8], [11, 8], [12, 9], [5, 8], [4, 9], [9, 4], [8, 5], [12, 7], [9, 10]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 12);
    console.log('##有杀棋6')
    console.log('minmax score', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBe(FIVE);
  });
  test('test 无杀棋7', () => {
    /*
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - O O X - - - - - - 
    - - - - - O X X O - - - - - - 
    - - - - O X O O X O O - - - - 
    - - - X X - X - X O X - - - - 
    - - - X - - - - - - - - - - - 
    - - O - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - - 
    - - - - - - - - - - - - - - -
    */
    const board = new Board(15);
    const steps = [[7, 7], [6, 6], [5, 6], [6, 7], [6, 5], [7, 5], [5, 7], [8, 4], [6, 8], [5, 8], [7, 6], [8, 8], [7, 9], [8, 10], [7, 10], [7, 8], [8, 9], [9, 3], [10, 2], [8, 6], [7, 4], [8, 3]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    const score = vct(board, 1, 12);
    console.log('##无杀棋7')
    console.log(board.display());
    console.log('minmax score', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
});
