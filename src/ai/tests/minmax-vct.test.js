import Board from '../board';
import { minmax, cache_hits } from '../minmax';
import { FIVE } from '../eval';

const enableVCT = true;

describe('minmax with vct', () => {
  test('实战1', () => {
    // 应该防守活四
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [6, 6], [8, 8], [7, 5], [7, 6], [8, 7], [6, 7], [8, 5], [9, 6], [8, 4], [9, 3], [11, 6], [10, 5], [9, 7], [10, 7], [5, 5], [6, 5], [10, 6], [7, 3], [8, 3], [8, 2], [11, 5], [7, 8], [11, 4], [11, 3], [5, 6], [5, 7], [3, 3], [4, 4], [11, 8], [11, 7], [12, 4], [13, 3], [13, 6], [12, 6], [10, 3], [12, 5], [12, 7], [10, 9], [10, 4], [9, 4], [9, 2], [9, 10], [7, 0], [8, 1], [13, 4], [14, 4], [10, 8], [10, 10], [8, 9], [10, 11], [13, 8], [12, 8], [13, 7], [13, 5], [8, 10], [10, 12], [10, 13], [11, 11], [12, 11], [11, 12], [13, 9], [13, 10], [11, 10], [9, 12]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    const score = minmax(board, 1, 4, enableVCT);
    console.log('minmax score1', score);
    console.log('cache: search', cache_hits.search, ', total ', cache_hits.total, 'hit', cache_hits.hit, 'hit rate', cache_hits.hit / cache_hits.total)
    expect([[8, 12], [12, 12]]).toContainEqual(score[1]);
  });
});
