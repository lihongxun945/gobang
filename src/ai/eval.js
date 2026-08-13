/*
帮我用JS写一个 Evaluate 类，作用是进行五子棋评分，原理是通过遍历棋盘上的每个点，计算出每个点的得分，最后将所有点的得分相加，得到当前棋盘的总得分。计算分数的规则如下：
- 每一个点的得分都是通过计算这个点在横、竖、左斜、右斜四个方向上的得分，这些得分按照连五、活四、冲四、活三、眠三、活二、眠二，存储在不同的数组中，最后将这些数组的得分相加，得到当前点的总得分。
- 每一个方向上，都通过匹配模式串的方式计算分数。
- 只计算空位的得分，不计算已经有棋子的得分。
这个类要记住当前棋盘状态，提供如下方法：
- 提供 move 和 undo 方法，用于模拟下棋和悔棋，并且同步更新当前棋盘状态和得分。
- 提供 evaluate 方法，用于计算当前棋盘的得分。
- 提供 evaluatePoint 方法，用于计算某个点的得分。
*/
import { uniq } from 'lodash';
import { shapes, getShapeFast, isFive, isFour, getAllShapesOfPoint } from './shape';
import { coordinate2Position, isLine, isAllInLine, hasInLine, position2Coordinate } from './position';
import { config } from './config';

export const FIVE = 10000000;
export const BLOCK_FIVE = FIVE;
export const FOUR = 100000;
export const FOUR_FOUR = FOUR; // 双冲四
export const FOUR_THREE = FOUR; // 冲四活三
export const THREE_THREE = FOUR / 2; // 双三
export const BLOCK_FOUR = 1500;
export const THREE = 1000;
export const BLOCK_THREE = 150;
export const TWO_TWO = 200; // 双活二
export const TWO = 100;
export const BLOCK_TWO = 15;
export const ONE = 10;
export const BLOCK_ONE = 1;

// 形状转换分数，注意这里的分数是当前位置还没有落子的分数
export const getRealShapeScore = (shape) => {
  switch (shape) {
    case shapes.FIVE:
      return FOUR;
    case shapes.BLOCK_FIVE:
      return BLOCK_FOUR;
    case shapes.FOUR:
      return THREE;
    case shapes.FOUR_FOUR:
      return THREE;
    case shapes.FOUR_THREE:
      return THREE;
    case shapes.BLOCK_FOUR:
      return BLOCK_THREE;
    case shapes.THREE:
      return TWO;
    case shapes.THREE_THREE:
      return THREE_THREE / 10;
    case shapes.BLOCK_THREE:
      return BLOCK_TWO;
    case shapes.TWO:
      return ONE;
    case shapes.TWO_TWO:
      return TWO_TWO / 10;
    default:
      return 0;
  }
}

const allDirections = [
  [0, 1],  // Horizontal
  [1, 0],  // Vertical
  [1, 1],  // Diagonal \
  [1, -1]  // Diagonal /
];

const createShapePoints = () => {
  const points = {};
  Object.keys(shapes).forEach((key) => {
    points[shapes[key]] = new Set();
  });
  return points;
};

const selectTopPoints = (values, limit, getScore) => {
  const points = [];
  const scores = [];
  for (const point of values) {
    const score = getScore(point);
    let low = 0;
    let high = scores.length;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (scores[middle] > score || (scores[middle] === score && points[middle] < point)) {
        low = middle + 1;
      } else {
        high = middle;
      }
    }
    if (low >= limit) continue;
    points.splice(low, 0, point);
    scores.splice(low, 0, score);
    if (points.length > limit) {
      points.pop();
      scores.pop();
    }
  }
  return points;
};

const direction2index = (ox, oy) => {
  if (ox === 0) return 0; // |
  if (oy === 0) return 1; // -
  if (ox === oy) return 2; // \
  if (ox !== oy) return 3; // /
};

// const shape2score = {
//   [shapes.FIVE]: FIVE,
//   [shapes.BLOCK_FIVE]: BLOCK_FIVE,
//   [shapes.FOUR]: FOUR,
//   [shapes.FOUR_FOUR]: FOUR_FOUR, // 双冲四
//   [shapes.FOUR_THREE]: FOUR_THREE, // 冲四活三
//   [shapes.THREE_THREE]: THREE_THREE, // 双三
//   [shapes.BLOCK_FOUR]: BLOCK_FOUR,
//   [shapes.THREE]: THREE,
//   [shapes.BLOCK_THREE]: BLOCK_THREE,
//   [shapes.TWO_TWO]: TWO_TWO, // 双活二
//   [shapes.TWO]: TWO,
//   [shapes.NONE]: 0,
// };

export const performance = {
  updateTime: 0,
  getPointsTime: 0,
}

export default class Evaluate {
  constructor(size = 15) {
    this.size = size;
    this.board = Array.from({ length: size + 2 }).map((_, i) =>
      Array.from({ length: size + 2 }).map((_, j) =>
        (i === 0 || j === 0 || i === size + 1 || j === size + 1) ? 2 : 0
      )
    );
    this.blackScores = Array.from({ length: size }).map(() => Array.from({ length: size }).fill(0));
    this.whiteScores = Array.from({ length: size }).map(() => Array.from({ length: size }).fill(0));
    this.initPoints();
    this.history = []; // 记录历史 [position, role]
  }
  move(x, y, role) {
    // 清空记录
    for (const d of [0, 1, 2, 3]) {
      this.shapeCache[role][d][x][y] = 0;
      this.shapeCache[-role][d][x][y] = 0;
    }
    const position = coordinate2Position(x, y, this.size);
    this.activePoints[role].delete(position);
    this.activePoints[-role].delete(position);
    this.blackScores[x][y] = 0;
    this.whiteScores[x][y] = 0;

    // 更新分数
    this.board[x + 1][y + 1] = role; // Adjust for the added wall
    this.updatePoint(x, y);
    this.history.push([coordinate2Position(x, y, this.size), role]);
  }

  undo(x, y) {
    this.board[x + 1][y + 1] = 0; // Adjust for the added wall
    this.updatePoint(x, y);
    this.history.pop();
  }

  initPoints() {
    // 缓存每个点位的分数，避免重复计算
    // 结构： [role][direction][x][y] = shape
    this.shapeCache = {};
    for (let role of [1, -1]) {
      this.shapeCache[role] = {};
      for (let direction of [0, 1, 2, 3]) {
        this.shapeCache[role][direction] = Array.from({ length: this.size }).map(() => Array.from({ length: this.size }).fill(shapes.NONE));
      }
    }
    // 缓存每个形状对应的点位
    // 结构： pointsCache[role][shape] = Set(direction1, direction2);
    this.pointsCache = {}
    this.activePoints = { 1: new Set(), [-1]: new Set() };
    for (let role of [1, -1]) {
      this.pointsCache[role] = {};
      for (let key of Object.keys(shapes)) {
        const shape = shapes[key];
        this.pointsCache[role][shape] = new Set();
      }
    }
  }

  // 只返回和最后几步在一条直线上的点位。
  // 这么做有一点问题：
  // 1. 因为己方可能会由于防守暂时离开原来的线，这样就会导致己方被中断，只能增加最后几步的长度，比如不是取最后一步，而不是最后3步
  // 2. 如果不是取最后1步，取的步数太多了，反而还不如直接返回所有点位。
  getPointsInLine(role) {
    const pointsInLine = createShapePoints();
    let hasPointsInLine = false;
    let last2Points = this.history.slice(-config.inlineCount).map(([position, role]) => position);
    const processed = {}; // 已经处理过的点位
    // 在last2Points中查找是否有点位在一条线上
    for (let r of [role, -role]) {
      for (let point of last2Points) {
        const [x, y] = position2Coordinate(point, this.size);
        for (let [ox, oy] of allDirections) {
          for (let sign of [1, -1]) { // -1 for negative direction, 1 for positive direction
            for (let step = 1; step <= config.inLineDistance; step++) {
              const [nx, ny] = [x + sign * step * ox, y + sign * step * oy]; // +1 to adjust for wall
              const position = coordinate2Position(nx, ny, this.size);

              // 检测是否到达边界
              if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.size) {
                break;
              }
              if (this.board[nx + 1][ny + 1] !== 0) {
                continue;
              }
              if (processed[position] === r) continue;
              processed[position] = r;
              for (let direction of [0, 1, 2, 3]) {
                const shape = this.shapeCache[r][direction][nx][ny];
                // 到达边界停止，但是注意到达对方棋子不能停止
                if (shape) {
                  const candidate = coordinate2Position(nx, ny, this.size);
                  pointsInLine[shape].add(candidate);
                  hasPointsInLine = true;
                }
              }
            }
          }
        }
      }
    }
    if (hasPointsInLine) {
      return pointsInLine;
    }
    return false;
  }


  getPoints(role, depth, vct, vcf) {
    const first = depth % 2 === 0 ? role : -role; // 先手
    const start = new Date();
    if (config.onlyInLine && this.history.length >= config.inlineCount) {
      const pointsInLine = this.getPointsInLine(role);
      if (pointsInLine) {
        performance.getPointsTime += new Date - start;
        return pointsInLine;
      }
    }

    const points = createShapePoints();

    const lastPoints = this.history.slice(-4).map(([position, role]) => position);
    // const last2Points = this.history.slice(-2).map(([position, role]) => position);

    // 只遍历增量维护的有效空点，避免每个搜索节点扫描整张棋盘。
    for (let r of [role, -role]) {
      for (const activePoint of this.activePoints[r]) {
        const i = Math.floor(activePoint / this.size);
        const j = activePoint % this.size;
        let fourCount = 0, blockFourCount = 0, threeCount = 0;
        for (let direction of [0, 1, 2, 3]) {
            const shape = this.shapeCache[r][direction][i][j];
            if (!shape) continue;
            // const scores = r === 1 ? this.blackScores : this.whiteScores;
            // 冲四，考虑自己的冲四，连五和对方的连五
            if (vcf) {
              if (r === first && !isFour(shape) && !isFive(shape)) continue;
              if (r === -first && isFive(shape)) continue
            }
            const point = activePoint;
            if (vct) {
              // 自己只进攻, 只考虑自己的活三，自己和对面的冲四、活四
              if (depth % 2 === 0) {
                if (depth === 0 && r !== first) continue; // 并且第一步一定是从自己进攻开始，而不是一上来就防守
                if (shape !== shapes.THREE && !isFour(shape) && !isFive(shape)) continue;
                // 对面的活三不考虑
                if (shape === shapes.THREE && r !== first) continue;
                // 第一步只考虑自己的棋
                if (depth === 0 && r !== first) continue;
                if (depth > 0) {
                  // 为了优化速度，这里增加了一个有损剪枝逻辑： 从第二步开始，只有 能形成活二以上的活三和冲四才考虑，这样可以过滤掉大部分无效的活三和冲四，但是也存在极少情况的错误剪枝
                  if (shape === shapes.THREE && getAllShapesOfPoint(this.shapeCache, i, j, r).length === 1) continue;
                  if (shape === shapes.BLOCK_FOUR && getAllShapesOfPoint(this.shapeCache, i, j, r).length === 1) continue;
                }
              }
              // 对面只防守，只考虑自己的冲四，活四，和对方的活三
              else {
                if (shape !== shapes.THREE && !isFour(shape) && !isFive(shape)) continue;
                if (shape === shapes.THREE && r === -first) continue; // 不考虑防守方的活三
                if (depth > 1) {
                  // 有损剪枝，如果单纯冲四无法和任何棋子联系在一起，则直接剪掉
                  if (shape === shapes.BLOCK_FOUR && getAllShapesOfPoint(this.shapeCache, i, j).length === 1) continue;
                  // 从防守方的第二步开始，只有和最近两步连成一条线才行
                  if (shape === shapes.BLOCK_FOUR && !hasInLine(point, lastPoints, this.size)) continue;
                }
              }
            }
            if (vcf) {
              if (!isFour(shape) && !isFive(shape)) continue;
            }
            // 优化方式，从第3步开始，不考虑 在当前路径之外的活三以下的点位
            if (depth > 2 && (shape === shapes.TWO || shape === shapes.TWO_TWO || shape === shapes.BLOCK_THREE) && !hasInLine(point, lastPoints, this.size)) continue;
            points[shape].add(point);
            if (shape === shapes.FOUR) fourCount++;
            else if (shape === shapes.BLOCK_FOUR) blockFourCount++;
            else if (shape === shapes.THREE) threeCount++;
            let unionShape = undefined;
            if (fourCount >= 2) {
              unionShape = shapes.FOUR_FOUR;
            } else if (blockFourCount && threeCount) {
              unionShape = shapes.FOUR_THREE;
            } else if (threeCount >= 2) {
              unionShape = shapes.THREE_THREE;
            }
            if (unionShape) {
              points[unionShape].add(point);
            }
        }
      }
    }

    // 否则继续返回所有的点位

    performance.getPointsTime += new Date - start;

    return points;
  }

  // 当一个位置发生变时候，要更新这个位置的四个方向上得分，更新规则是：
  // 1. 如果这个位置是空的，那么就重新计算这个位置的得分
  // 2. 如果碰到了边界或者对方的棋子，那么就停止计算
  // 3. 如果超过2个空位，那么就停止计算
  // 4. 要更新自己的和对方的得分
  updatePoint(x, y) {
    const start = new Date();
    this.updateSinglePoint(x, y, 1);
    this.updateSinglePoint(x, y, -1);

    for (let [ox, oy] of allDirections) {
      for (let sign of [1, -1]) { // -1 for negative direction, 1 for positive direction
        // let emptyCount = 0;
        for (let step = 1; step <= 5; step++) {
          let reachEdge = false;
          for (let role of [1, -1]) {
            const [nx, ny] = [x + sign * step * ox + 1, y + sign * step * oy + 1]; // +1 to adjust for wall
            // 到达边界停止
            if (this.board[nx][ny] === 2) {
              // Stop if wall or opponent's piece is found
              reachEdge = true;
              break;
            } else if (this.board[nx][ny] === -role) { // 达到对方棋子，则转换角色
              continue;
            } else if (this.board[nx][ny] === 0) {
              this.updateSinglePoint(nx - 1, ny - 1, role, [sign * ox, sign * oy]);  // -1 to adjust back from wall
              // 这里不能跳过，可能会在悔棋时漏掉一些待更新的点位
              // emptyCount++;
              // if (emptyCount >= 3) {
              //   // Stop if more than 2 empty spaces
              //   break;
              // }
            }
          }
          if (reachEdge) break;
        }
      }
    }
    performance.updateTime += new Date() - start;
  }

  /*
   计算单个点的得分
   计算原理是：
   在当前位置放一个当前角色的棋子，遍历四个方向，生成四个方向上的字符串，用patters来匹配字符串, 匹配到的话，就将对应的得分加到scores上
   四个方向的字符串生成规则是：向两边都延伸5个位置，如果遇到边界或者对方的棋子，就停止延伸
   在更新周围棋子时，只有一个方向需要更新，因此可以传入direction参数，只更新一个方向
   */
  updateSinglePoint(x, y, role, direction = undefined) {
    if (this.board[x + 1][y + 1] !== 0) return;  // Not an empty spot

    // Temporarily place the piece
    this.board[x + 1][y + 1] = role;


    let directions = []
    if (direction) {
      directions.push(direction);
    } else {
      directions = allDirections;
    }
    const shapeCache = this.shapeCache[role];

    // 先清除缓存
    for (let [ox, oy] of directions) {
      shapeCache[direction2index(ox, oy)][x][y] = shapes.NONE;
    }

    for (let [ox, oy] of directions) {
      const intDirection = direction2index(ox, oy);
      const [shape] = getShapeFast(this.board, x, y, ox, oy, role);
      shapeCache[intDirection][x][y] = shape || shapes.NONE;
    }

    // Point score must be a pure function of the final four direction shapes.
    // Otherwise partial direction updates make the score depend on move order.
    let score = 0;
    let blockfourCount = 0;
    let threeCount = 0;
    let twoCount = 0;
    for (let intDirection of [0, 1, 2, 3]) {
      let shape = shapeCache[intDirection][x][y];
      if (!shape) continue;
      if (shape === shapes.BLOCK_FOUR) blockfourCount += 1;
      else if (shape === shapes.THREE) threeCount += 1;
      else if (shape === shapes.TWO) twoCount += 1;
      if (blockfourCount >= 2) shape = shapes.FOUR_FOUR;
      else if (blockfourCount && threeCount) shape = shapes.FOUR_THREE;
      else if (threeCount >= 2) shape = shapes.THREE_THREE;
      else if (twoCount >= 2) shape = shapes.TWO_TWO;
      score += getRealShapeScore(shape);
    }

    this.board[x + 1][y + 1] = 0;  // Remove the temporary piece

    const position = coordinate2Position(x, y, this.size);
    const hasShape = [0, 1, 2, 3].some((intDirection) => (
      shapeCache[intDirection][x][y] !== shapes.NONE
    ));
    if (hasShape) this.activePoints[role].add(position);
    else this.activePoints[role].delete(position);

    if (role === 1) {
      this.blackScores[x][y] = score;
    } else {
      this.whiteScores[x][y] = score;
    }

    return score;
  }

  // 计算整个棋盘的得分
  evaluate(role) {
    let blackScore = 0;
    let whiteScore = 0;
    for (let i = 0; i < this.blackScores.length; i += 1) {
      for (let j = 0; j < this.blackScores[i].length; j += 1) {
        blackScore += this.blackScores[i][j];
      }
    }
    for (let i = 0; i < this.whiteScores.length; i += 1) {
      for (let j = 0; j < this.whiteScores[i].length; j += 1) {
        whiteScore += this.whiteScores[i][j];
      }
    }
    return role === 1 ? blackScore - whiteScore : whiteScore - blackScore;
  }

  hasThreatAtLeast(threshold) {
    for (const role of [1, -1]) {
      const scores = role === 1 ? this.blackScores : this.whiteScores;
      for (const point of this.activePoints[role]) {
        const x = Math.floor(point / this.size);
        const y = point % this.size;
        if (scores[x][y] >= threshold) return true;
      }
    }
    return false;
  }

  /**
   * 获取有价值的点位
   * @param {*} role 当前角色
   * @param {*} onlyThrees 只返回 活三、冲四、活四 
   * @param {*} maxCount 最多返回多少个点位，这个参数只会裁剪活三以下的点位
   * @returns 
   */
  getMoves(role, depth, onThree = false, onlyFour = false) {
    const moves = Array.from(this._getMoves(role, depth, onThree, onlyFour)).map((move) => [Math.floor(move / this.size), move % this.size]);
    return moves;
  }
  _getMoves(role, depth, onlyThree = false, onlyFour = false) {
    const points = this.getPoints(role, depth, onlyThree, onlyFour);
    const selfScores = role === 1 ? this.blackScores : this.whiteScores;
    const opponentScores = role === 1 ? this.whiteScores : this.blackScores;
    const pointScore = (point) => {
      const x = Math.floor(point / this.size);
      const y = point % this.size;
      return selfScores[x][y] * 2 + opponentScores[x][y];
    };
    const sortPoints = (values) => [...values].sort((left, right) => (
      pointScore(right) - pointScore(left) || left - right
    ));
    const orderedSet = (...groups) => new Set(groups.flatMap(sortPoints));
    const shapesAt = (point, targetRole) => {
      const x = Math.floor(point / this.size);
      const y = point % this.size;
      return [0, 1, 2, 3].map((direction) => (
        this.shapeCache[targetRole][direction][x][y]
      ));
    };
    const hasShape = (point, targetRole, targetShape) => {
      const pointShapes = shapesAt(point, targetRole);
      if (targetShape === shapes.FIVE) return pointShapes.some(isFive);
      if (targetShape === shapes.FOUR_FOUR) {
        return pointShapes.filter((shape) => shape === shapes.FOUR).length >= 2;
      }
      if (targetShape === shapes.FOUR_THREE) {
        return pointShapes.includes(shapes.BLOCK_FOUR) && pointShapes.includes(shapes.THREE);
      }
      if (targetShape === shapes.THREE_THREE) {
        return pointShapes.filter((shape) => shape === shapes.THREE).length >= 2;
      }
      return pointShapes.includes(targetShape);
    };
    const forRole = (values, targetRole, targetShape) => [...values].filter((point) => (
      hasShape(point, targetRole, targetShape)
    ));
    const bySide = (values, targetShape) => [
      forRole(values, role, targetShape), forRole(values, -role, targetShape),
    ];

    const fives = new Set([...points[shapes.FIVE], ...points[shapes.BLOCK_FIVE]]);
    if (fives.size) {
      const [selfFives, opponentFives] = bySide(fives, shapes.FIVE);
      return orderedSet(selfFives, opponentFives);
    }

    const fours = points[shapes.FOUR];
    const blockFours = points[shapes.BLOCK_FOUR];
    if (onlyFour || fours.size) {
      const [selfFours, opponentFours] = bySide(fours, shapes.FOUR);
      const [selfBlockFours, opponentBlockFours] = bySide(
        blockFours, shapes.BLOCK_FOUR,
      );
      return orderedSet(selfFours, opponentFours, selfBlockFours, opponentBlockFours);
    }

    const fourFours = points[shapes.FOUR_FOUR];
    if (fourFours.size) {
      const [selfFourFours, opponentFourFours] = bySide(fourFours, shapes.FOUR_FOUR);
      const [selfBlockFours, opponentBlockFours] = bySide(
        blockFours, shapes.BLOCK_FOUR,
      );
      return orderedSet(
        selfFourFours, opponentFourFours, selfBlockFours, opponentBlockFours,
      );
    }

    const threes = points[shapes.THREE];
    const fourThrees = points[shapes.FOUR_THREE];
    if (fourThrees.size) {
      const [selfFourThrees, opponentFourThrees] = bySide(
        fourThrees, shapes.FOUR_THREE,
      );
      const [selfBlockFours, opponentBlockFours] = bySide(
        blockFours, shapes.BLOCK_FOUR,
      );
      const [selfThrees, opponentThrees] = bySide(threes, shapes.THREE);
      return orderedSet(
        selfFourThrees, opponentFourThrees,
        selfBlockFours, opponentBlockFours, selfThrees, opponentThrees,
      );
    }

    const threeThrees = points[shapes.THREE_THREE];
    if (threeThrees.size) {
      const [selfThreeThrees, opponentThreeThrees] = bySide(
        threeThrees, shapes.THREE_THREE,
      );
      const [selfBlockFours, opponentBlockFours] = bySide(
        blockFours, shapes.BLOCK_FOUR,
      );
      const [selfThrees, opponentThrees] = bySide(threes, shapes.THREE);
      return orderedSet(
        selfThreeThrees, opponentThreeThrees,
        selfBlockFours, opponentBlockFours, selfThrees, opponentThrees,
      );
    }

    if (onlyThree) {
      const [selfBlockFours, opponentBlockFours] = bySide(
        blockFours, shapes.BLOCK_FOUR,
      );
      const [selfThrees, opponentThrees] = bySide(threes, shapes.THREE);
      return orderedSet(selfBlockFours, opponentBlockFours, selfThrees, opponentThrees);
    }

    const candidates = new Set([
      ...points[shapes.BLOCK_FOUR], ...points[shapes.THREE],
      ...points[shapes.BLOCK_THREE], ...points[shapes.TWO_TWO], ...points[shapes.TWO],
    ]);
    const limit = depth === 0
      ? config.rootPointsLimit : depth >= 3 ? config.deepPointsLimit : config.pointsLimit;
    return new Set(selectTopPoints(candidates, limit, pointScore));
  }
  display() {
    let result = '';
    for (let i = 1; i < this.size + 1; i++) {
      for (let j = 1; j < this.size + 1; j++) {
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
    console.log(result);
  }
}
