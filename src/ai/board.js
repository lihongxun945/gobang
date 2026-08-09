import Zobrist from './zobrist';
import Cache from './cache';
// import { evaluate } from './evaluate';
import Evaluate, { FIVE } from './eval';
const WIN_DIRECTIONS = [[1, 0], [0, 1], [1, 1], [1, -1]];
const WIN_SIGNS = [-1, 1];

class Board {
  constructor(size = 15, firstRole = 1) {
    this.size = size;
    this.board = Array(this.size).fill().map(() => Array(this.size).fill(0));
    this.firstRole = firstRole;  // 1 for black, -1 for white
    this.role = firstRole;  // 1 for black, -1 for white
    this.history = [];
    this.emptyCount = size * size;
    this.winner = 0;
    this.zobrist = new Zobrist(this.size);
    this.winnerCache = new Cache();
    this.gameoverCache = new Cache();
    this.evaluateCache = new Cache();
    this.valuableMovesCache = new Cache();
    this.evaluateTime = 0;
    this.evaluator = new Evaluate(this.size);
  }

  isGameOver() {
    return this.winner !== 0 || this.emptyCount === 0;
  }

  getWinner() {
    return this.winner;
  }

  hasFiveAt(i, j, role) {
    for (let direction = 0; direction < WIN_DIRECTIONS.length; direction += 1) {
      const [di, dj] = WIN_DIRECTIONS[direction];
      let count = 1;
      for (let side = 0; side < WIN_SIGNS.length; side += 1) {
        const sign = WIN_SIGNS[side];
        for (let step = 1; step < 5; step += 1) {
          const x = i + sign * step * di;
          const y = j + sign * step * dj;
          if (x < 0 || x >= this.size || y < 0 || y >= this.size || this.board[x][y] !== role) break;
          count += 1;
        }
      }
      if (count >= 5) return true;
    }
    return false;
  }

  getValidMoves() {
    let moves = [];
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        if (this.board[i][j] === 0) {
          moves.push([i, j]);
        }
      }
    }
    return moves;
  }

  put(i, j, role) {
    if (role === undefined) {
      role = this.role;
    }
    if (isNaN(i) || isNaN(j)) {
      console.log("Invalid move Not Number!", i, j);
      return false;
    }
    if (this.board[i][j] !== 0) {
      console.log("Invalid move!", i, j);
      return false;
    }
    this.board[i][j] = role;
    this.history.push({ i, j, role });
    this.zobrist.togglePiece(i, j, role);
    this.evaluator.move(i, j, role);
    this.emptyCount -= 1;
    this.winner = this.hasFiveAt(i, j, role) ? role : 0;
    this.role *= -1;  // Switch role
    return true;
  }

  undo() {
    if (this.history.length === 0) {
      console.log("No moves to undo!");
      return false;
    }

    let lastMove = this.history.pop();
    this.board[lastMove.i][lastMove.j] = 0;  // Remove the piece from the board
    this.role = lastMove.role;  // Switch back to the previous player
    this.zobrist.togglePiece(lastMove.i, lastMove.j, lastMove.role);
    this.evaluator.undo(lastMove.i, lastMove.j);
    this.emptyCount += 1;
    this.winner = 0;
    return true;
  }

  position2coordinate(position) {
    const row = Math.floor(position / this.size)
    const col = position % this.size
    return [row, col]
  }

  coordinate2position(coordinate) {
    return coordinate[0] * this.size + coordinate[1]
  }

  getValuableMoves(role, depth = 0, onlyThree = false, onlyFour = false) {
    const hash = this.hash();
    const prev = this.valuableMovesCache.get(hash);
    if (prev) {
      if (prev.role === role && prev.depth === depth && prev.onlyThree === onlyThree && prev.onlyFour === onlyFour) {
        return prev.moves;
      }
    }
    const moves = this.evaluator.getMoves(role, depth, onlyThree, onlyFour);
    // 处理一个特殊情况，如果中间点没有落子，则默认加上中间点
    if (!onlyThree && !onlyFour) {
      const center = Math.floor(this.size / 2);
      if (this.board[center][center] == 0) moves.push([center, center]);
    }
    this.valuableMovesCache.put(hash, {
      role,
      moves,
      depth,
      onlyThree,
      onlyFour
    });
    return moves;
  }

  // 显示棋盘，可以传入一个位置列表显示成问号，用来辅助调试
  display(extraPoints = []) {
    const extraPosition = extraPoints.map((point) => this.coordinate2position(point));
    let result = '';
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        const position = this.coordinate2position([i, j]);
        if (extraPosition.includes(position)) {
          result += '? ';
          continue;
        }
        switch (this.board[i][j]) {
          case 1:
            result += 'O ';
            break;
          case -1:
            result += 'X ';
            break;
          default:
            result += '- ';
            break;
        }
      }
      result += '\n';  // New line at the end of each row
    }
    return result;
  }

  hash() {
    return this.zobrist.getHash();
  }

  //evaluate(role) {
  //  const start = + new Date();
  //  const hash = this.hash();
  //  const prev = this.evaluateCache.get(hash);
  //  if (prev) {
  //    if (prev.role === role) {
  //      return prev.value;
  //    }
  //  }
  //  const value = evaluate(this.board, role);
  //  this.evaluateTime += +new Date - start;
  //  this.evaluateCache.put(hash, { role, value });
  //  return value;
  //}

  evaluate(role) {
    const hash = this.hash();
    const prev = this.evaluateCache.get(hash);
    if (prev) {
      if (prev.role === role) {
        return prev.score;
      }
    }
    const winner = this.getWinner();
    let score = 0;
    if (winner !== 0) {
      score = FIVE * winner * role;
    } else {
      score = this.evaluator.evaluate(role);
    }
    this.evaluateCache.put(hash, { role, score });
    return score;
  }
  reverse() {
    const newBoard = new Board(this.size, -this.firstRole);
    for (let i = 0; i < this.history.length; i++) {
      const { i: x, j: y, role } = this.history[i];
      newBoard.put(x, y, -role);
    }
    return newBoard;
  }
  toString() {
    return this.board.map(row => row.join('')).join('');
  }
}

export default Board;
