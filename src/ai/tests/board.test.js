import Board from '../board';
import { wins, validMoves } from '../board_manuls';

describe('Board', () => {

  let board;
  beforeEach(() => {
    board = new Board(15);
  });

  test('test init', () => {
    for (let i = 0; i < 15; i++) {
      for (let j = 0; j < 15; j++) {
        expect(board.board[i][j]).toBe(0);
      }
    }
  });

  test('test put', () => {
    board.put(1, 1);
    expect(board.board[1][1]).toBe(1);
    expect(board.history.length).toBe(1);
  });

  test('test getValidMoves', () => {
    board.put(1, 1);
    const validMoves = board.getValidMoves();
    expect(validMoves).not.toContainEqual([1, 1]);
  });

  test('test isGameOver', () => {
    const board = new Board(6);
    expect(board.isGameOver()).toBe(false);
    // 1 2 0 0 0 0
    // 0 1 2 0 0 0
    // 0 0 1 2 0 0
    // 0 0 0 1 2 0
    // 0 0 0 0 1 0
    // 0 0 0 0 0 0
    const steps = [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2], [2, 3], [3, 3], [3, 4], [4, 4]];
    for (let i = 0; i < steps.length; i++) {
      const [x, y] = steps[i];
      board.put(x, y);
    }
    expect(board.isGameOver()).toBe(true);
  });

  test('test undo', () => {
    board.put(1, 1);
    expect(board.board[1][1]).toBe(1); // Check if the piece was put correctly
    board.undo();
    expect(board.board[1][1]).toBe(0); // Check if the piece was removed correctly
    expect(board.role).toBe(1); // Check if the role was switched back correctly
  });

  test('test getWinner', () => {
    wins.forEach(win => {
      const board = new Board(win[0]);
      for (const move of win[1]) {
        const [i, j] = board.position2coordinate(move);
        board.put(i, j);
      }
      expect(board.getWinner()).toBe(win[2]);
    });
  });


  // Add more tests for win condition and other situations
});
