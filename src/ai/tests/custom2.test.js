import Board from './board';
import { minmax, cache_hits } from './minmax';
import { FOUR } from './eval';

describe('minmax', () => {
  test('test ', () => {
    const board = new Board(9);
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    // 2 1 1 1 1 2 0 0 0
    // 0 0 0 1 0 0 0 0 0
    // 0 0 1 0 0 0 0 0 0
    // 0 0 2 2 2 0 0 0 0
    // 0 0 2 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0
    const steps = [[3, 1], [3, 0], [3, 2], [6, 2], [3, 3], [6, 3], [4, 3], [6, 4], [5, 2], [7, 2], [3, 4], [3, 5]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log('moves', board.getValuableMoves(1, 0, true, false));
  });
});
