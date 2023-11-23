import Board from './board';
import { minmax, cache_hits } from './minmax';
import { FOUR } from './eval';
import { min } from 'lodash';

describe('minmax', () => {
  test('悔棋', () => {
    const board = new Board(15);
    board.put(7, 8);
    console.log(board.display());
    const res = minmax(board, -1, 4);
    board.put(res[1][0], res[1][1]);
    console.log(board.display());
    board.undo();
    console.log(board.display());
    board.undo();
    console.log(board.display());
    board.put(7, 7);
    console.log(board.display());
    console.log(minmax(board, -1, 4));
  });
});
