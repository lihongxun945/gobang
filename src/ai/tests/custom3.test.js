import Board from './board';
import { minmax, cache_hits } from './minmax';
import { FOUR } from './eval';
import { min } from 'lodash';

// 问题：冲四之后形成了可以连五的位置，被评价分很高，电脑会尽力防止冲四，甚至不管活三
describe('minmax', () => {
  test('test 1', () => {
    const board = new Board(15);
    const steps = [[7, 7], [8, 6], [8, 8], [7, 8], [9, 7], [7, 9], [9, 9], [6, 6], [10, 10], [11, 11], [8, 7], [10, 7], [9, 8], [9, 10], [9, 6], [9, 5], [10, 8], [10, 9], [6, 7], [5, 7], [11, 8], [12, 8], [8, 10], [11, 7], [10, 6], [11, 5], [10, 5], [11, 4], [11, 6], [10, 4], [7, 11], [6, 12], [9, 4], [8, 3], [8, 9], [8, 11], [7, 6], [8, 5], [6, 5], [5, 4], [12, 6], [13, 6], [12, 7], [13, 8]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    console.log('moves', board.getValuableMoves(1, 0, false, false));
    console.log('evaluate', board.evaluate(1));
    console.log('score', minmax(board, 1, 4));
  });
  test('test 2', () => {
    const board = new Board(15, 1);
    const steps = [[7, 7], [7, 8], [8, 6], [9, 5], [6, 6], [8, 8], [7, 5], [6, 8], [5, 8], [9, 8], [10, 8], [9, 7], [9, 6], [7, 6], [5, 7], [8, 4], [10, 6], [8, 7], [6, 5]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    console.log(board.display());
    console.log('moves', board.getValuableMoves(-1, 0, false, false));
    console.log('evaluate', board.evaluate(1));
    console.log('score', minmax(board, -1, 4));
  });
});
