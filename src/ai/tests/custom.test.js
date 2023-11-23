import Board from '../board';
import { minmax, cache_hits } from '../minmax';
import { FOUR } from '../eval';

describe('minmax', () => {
  test('test', () => {
    const board = new Board(10);
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 1 1 0 0 0 0
    // 0 0 0 2 2 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    // 0 0 0 0 0 0 0 0 0 0
    const steps = [[4, 4], [5, 3], [4, 5], [5, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    console.log(board.getValuableMoves(1, 0, false, false));
  });
});
