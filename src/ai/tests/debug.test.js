import Board from '../board';
import { vct, cache_hits } from '../minmax';
import { FIVE, FOUR, performance } from '../eval';
import { performance as shapePerformance } from '../shape';

describe('minmax', () => {
  test('test 无杀棋2', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [7, 6], [7, 5], [9, 7], [8, 7], [8, 5], [9, 4], [8, 8], [7, 9], [6, 6], [5, 5], [10, 10], [9, 9], [5, 8], [6, 7], [6, 9], [8, 4], [4, 7], [7, 10], [3, 6], [2, 5], [6, 4], [9, 3], [10, 2], [10, 5], [11, 4], [10, 3], [8, 3], [8, 9], [4, 6], [5, 6], [7, 8], [6, 8], [10, 9], [11, 6], [9, 5], [12, 7], [13, 8], [12, 5], [12, 6], [9, 11], [8, 10], [10, 7], [9, 8], [14, 6]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    const score = vct(board, 1, 14);
    console.log('minmax score8', score)
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    console.log('evaluateTime:', board.evaluateTime / 1000)
    console.log('update point time', performance.updateTime);
    console.log('get point time', performance.getPointsTime);
    expect(score[0]).toBeLessThan(FIVE);
  });
});
