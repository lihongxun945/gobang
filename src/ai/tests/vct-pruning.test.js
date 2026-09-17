import Board from '../board';
import { shapes } from '../shape';

const pos = (x, y) => x * 15 + y;
const has = (points, shape, x, y) => points[shape].has(pos(x, y));

describe('VCT 防守方活三精细化剪枝', () => {
  test('防守方孤立活三（无威胁）被剪掉，进攻方活三保留', () => {
    const board = new Board(15, 1);
    // 白(-1) 横向相邻两子，(7,3) 走白 = 孤立活三（仅横向 THREE，无眠三/冲四/双三）
    board.put(7, 4, -1);
    board.put(7, 5, -1);
    // 黑(1) 远处横向相邻两子，(10,9) 走黑 = 活三（进攻方威胁，必须保留）
    board.put(10, 10, 1);
    board.put(10, 11, 1);

    // 白防守方层：depth=1 → first=-role=黑(1)，防守方=白(-1)
    const points = board.evaluator.getPoints(-1, 1, true, false);

    expect(has(points, shapes.THREE, 7, 3)).toBe(false); // 白孤立活三被剪
    expect(has(points, shapes.THREE, 10, 9)).toBe(true); // 黑活三威胁保留
  });

  test('防守方活三+眠三（反威胁）被保留', () => {
    const moves = [[7, 7], [6, 6], [7, 5], [6, 7], [6, 8], [8, 6], [8, 8], [7, 8], [5, 6], [9, 6], [7, 9], [8, 7], [6, 9], [10, 6], [7, 6], [10, 5], [11, 4], [11, 6], [12, 6], [7, 4], [8, 9], [9, 9], [5, 9], [4, 9], [4, 10], [3, 11], [6, 10], [9, 7], [9, 8], [10, 7]];
    const board = new Board(15, 1);
    for (let i = 0; i < 19; i++) {
      const [x, y] = moves[i];
      board.put(x, y, i % 2 === 0 ? 1 : -1);
    }
    board.put(7, 4, -1); // 白第20手

    // 黑防守方层：depth=1 → first=-role=白(-1)，防守方=黑(1)
    const points = board.evaluator.getPoints(1, 1, true, false);

    expect(has(points, shapes.THREE, 5, 9)).toBe(true); // 黑反威胁（THREE+BLOCK_THREE）保留
  });

  test('防守方冲四+活三（四三）被保留', () => {
    const board = new Board(15, 1);
    // 白横向三连 (7,6)(7,7)(7,8)，纵向两子 (6,9)(8,9)，黑 (7,10) 堵横向右端
    board.put(7, 6, -1);
    board.put(7, 7, -1);
    board.put(7, 8, -1);
    board.put(6, 9, -1);
    board.put(8, 9, -1);
    board.put(7, 10, 1);

    // 白防守方层：depth=1 → first=-role=黑(1)，防守方=白(-1)
    const points = board.evaluator.getPoints(-1, 1, true, false);

    expect(has(points, shapes.THREE, 7, 9)).toBe(true); // 活三部分保留
    expect(has(points, shapes.BLOCK_FOUR, 7, 9)).toBe(true); // 冲四部分保留
  });
});
