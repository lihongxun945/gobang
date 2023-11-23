import Board from '../board';
import { minmax, cache_hits } from '../minmax';

describe('performance', () => {
  test('自我对弈30步', () => {
    const board = new Board(15);
    const start = Date.now();
    let role = 1;
    while (!board.isGameOver()) {
      const [score, move] = minmax(board, role, 6);
      board.put(move[0], move[1], role);
      role *= -1;
      console.log('move', move, 'score', score);
      console.log(board.display());
      console.log(board.history.map(h => [h.i, h.j]));
    }
    const time = (Date.now() - start) / 1000;
    console.log('自我对弈30步性能：总耗时', time, 's, 平均每一步耗时 ', time / 30, 's');
  });
});
