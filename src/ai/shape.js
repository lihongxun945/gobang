export const patterns = {
  five: new RegExp('11111'),
  blockfive: new RegExp('211111|111112'),
  four: new RegExp('011110'),
  blockFour: new RegExp('10111|11011|11101|211110|211101|211011|210111|011112|101112|110112|111012'),
  three: new RegExp('011100|011010|010110|001110'),
  blockThree: new RegExp('211100|211010|210110|001112|010112|011012'),
  two: new RegExp('001100|011000|000110|010100|001010'),
}
export const shapes = {
  FIVE: 5,
  BLOCK_FIVE: 50,
  FOUR: 4,
  FOUR_FOUR: 44, // 双冲四
  FOUR_THREE: 43, // 冲四活三
  THREE_THREE: 33, // 双三
  BLOCK_FOUR: 40,
  THREE: 3,
  BLOCK_THREE: 30,
  TWO_TWO: 22, // 双活二
  TWO: 2,
  NONE: 0,
};

export const performance = {
  five: 0,
  blockFive: 0,
  four: 0,
  blockFour: 0,
  three: 0,
  blockThree: 0,
  two: 0,
  none: 0,
  total: 0,
}

// 使用字符串匹配的方式实现的形状检测，速度较慢，但逻辑比较容易理解
export const getShape = (board, x, y, offsetX, offsetY, role) => {
  const opponent = -role;
  let emptyCount = 0;
  let selfCount = 1;
  let opponentCount = 0;
  let shape = shapes.NONE;

  // 跳过为空的节点
  if (board[x + offsetX + 1][y + offsetY + 1] === 0
    && board[x - offsetX + 1][y - offsetY + 1] === 0
    && board[x + 2 * offsetX + 1][y + 2 * offsetY + 1] === 0
    && board[x - 2 * offsetX + 1][y - 2 * offsetY + 1] === 0
  ) {
    return [shapes.NONE, selfCount, opponentCount, emptyCount];
  }

  // two 类型占比超过一半，做一下优化
  // 活二是不需要判断特别严谨的
  for (let i = -3; i <= 3; i++) {
    if (i === 0) continue;
    const [nx, ny] = [x + i * offsetX + 1, y + i * offsetY + 1];
    if (board[nx] === undefined || board[nx][ny] === undefined) continue;
    const currentRole = board[nx][ny];
    if (currentRole === 2) {
      opponentCount++;
    } else if (currentRole === role) {
      selfCount++;
    } else if (currentRole === 0) {
      emptyCount++;
    }
  }
  if (selfCount === 2) {
    if (!opponentCount) {
      return [shapes.TWO, selfCount, opponentCount, emptyCount];
    } else {
      return [shapes.NONE, selfCount, opponentCount, emptyCount];
    }
  }
  // two 类型优化结束，不需要的话可以在直接删除这一段代码不影响功能

  // three类型大约占比有20%，也优化一下


  emptyCount = 0;
  selfCount = 1;
  opponentCount = 0;
  let resultString = '1';

  for (let i = 1; i <= 5; i++) {
    const [nx, ny] = [x + i * offsetX + 1, y + i * offsetY + 1];
    const currentRole = board[nx][ny];
    if (currentRole === 2) resultString += '2';
    else if (currentRole === 0) resultString += '0';
    else resultString += currentRole === role ? '1' : '2';
    if (currentRole === 2 || currentRole === opponent) {
      opponentCount++;
      break;
    }
    if (currentRole === 0) {
      emptyCount++;
    }
    if (currentRole === role) {
      selfCount++;
    }
  }
  for (let i = 1; i <= 5; i++) {
    const [nx, ny] = [x - i * offsetX + 1, y - i * offsetY + 1];
    const currentRole = board[nx][ny];
    if (currentRole === 2) resultString = '2' + resultString;
    else if (currentRole === 0) resultString = '0' + resultString;
    else resultString = (currentRole === role ? '1' : '2') + resultString;
    if (currentRole === 2 || currentRole === opponent) {
      opponentCount++;
      break;
    }
    if (currentRole === 0) {
      emptyCount++;
    }
    if (currentRole === role) {
      selfCount++;
    }
  }
  if (patterns.five.test(resultString)) {
    shape = shapes.FIVE;
    performance.five++;
    performance.total++;
  } else if (patterns.four.test(resultString)) {
    shape = shapes.FOUR;
    performance.four++;
    performance.total++;
  } else if (patterns.blockFour.test(resultString)) {
    shape = shapes.BLOCK_FOUR;
    performance.blockFour++;
    performance.total++;
  } else if (patterns.three.test(resultString)) {
    shape = shapes.THREE;
    performance.three++;
    performance.total++;
  } else if (patterns.blockThree.test(resultString)) {
    shape = shapes.BLOCK_THREE;
    performance.blockThree++;
    performance.total++;
  } else if (patterns.two.test(resultString)) {
    shape = shapes.TWO;
    performance.two++;
    performance.total++;
  }
  // 尽量减少多余字符串生成
  if (selfCount <= 1 || resultString.length < 5) return [shape, selfCount, opponentCount, emptyCount];

  return [shape, selfCount, opponentCount, emptyCount];
}

const countShape = (board, x, y, offsetX, offsetY, role) => {
  const opponent = -role;

  let innerEmptyCount = 0; // 棋子中间的内部空位
  let tempEmptyCount = 0;
  let selfCount = 0;
  let totalLength = 0;

  let sideEmptyCount = 0; // 边上的空位
  let noEmptySelfCount = 0, OneEmptySelfCount = 0;

  // right
  for (let i = 1; i <= 5; i++) {
    const [nx, ny] = [x + i * offsetX + 1, y + i * offsetY + 1];
    const currentRole = board[nx][ny];
    if (currentRole === 2 || currentRole === opponent) {
      break;
    }
    if (currentRole === role) {
      selfCount++;
      sideEmptyCount = 0;
      if (tempEmptyCount) {
        innerEmptyCount += tempEmptyCount;
        tempEmptyCount = 0;
      }
      if (innerEmptyCount === 0) {
        noEmptySelfCount++;
        OneEmptySelfCount++;
      } else if (innerEmptyCount === 1) {
        OneEmptySelfCount++;
      }
    }
    totalLength++;
    if (currentRole === 0) {
      tempEmptyCount++;
      sideEmptyCount++;
    }
    if (sideEmptyCount >= 2) {
      break;
    }
  }
  if (!innerEmptyCount) OneEmptySelfCount = 0;
  return { selfCount, totalLength, noEmptySelfCount, OneEmptySelfCount, innerEmptyCount, sideEmptyCount };
}

// 使用遍历位置的方式实现的形状检测，速度较快，大约是字符串速度的2倍 但理解起来会稍微复杂一些
export const getShapeFast = (board, x, y, offsetX, offsetY, role) => {
  // 有一点点优化效果：跳过为空的节点
  if (board[x + offsetX + 1][y + offsetY + 1] === 0
    && board[x - offsetX + 1][y - offsetY + 1] === 0
    && board[x + 2 * offsetX + 1][y + 2 * offsetY + 1] === 0
    && board[x - 2 * offsetX + 1][y - 2 * offsetY + 1] === 0
  ) {
    return [shapes.NONE, 1];
  }

  let selfCount = 1;
  let totalLength = 1;
  let shape = shapes.NONE;

  let leftEmpty = 0, rightEmpty = 0; // 左右边上的空位
  let noEmptySelfCount = 1, OneEmptySelfCount = 1;

  const left = countShape(board, x, y, -offsetX, -offsetY, role);
  const right = countShape(board, x, y, offsetX, offsetY, role);

  selfCount = left.selfCount + right.selfCount + 1;
  totalLength = left.totalLength + right.totalLength + 1;
  noEmptySelfCount = left.noEmptySelfCount + right.noEmptySelfCount + 1;
  OneEmptySelfCount = Math.max(left.OneEmptySelfCount + right.noEmptySelfCount, left.noEmptySelfCount + right.OneEmptySelfCount) + 1;
  rightEmpty = right.sideEmptyCount;
  leftEmpty = left.sideEmptyCount;

  if (totalLength < 5) return [shape, selfCount];
  // five 
  if (noEmptySelfCount >= 5) {
    if (rightEmpty > 0 && leftEmpty > 0) {
      return [shapes.FIVE, selfCount];
    } else {
      return [shapes.BLOCK_FIVE, selfCount];
    }
  }
  if (noEmptySelfCount === 4) {
    // 注意这里的空位判断条件， 右边有有两种，分别是 XX空 和 XX空X,第二种情况下，虽然 rightEmpty 可能不是true，也是符合的，通过 OneEmptySelfCount > noEmptySelfCount 来判断
    if ((rightEmpty >= 1 || right.OneEmptySelfCount > right.noEmptySelfCount) && (leftEmpty >= 1 || left.OneEmptySelfCount > left.noEmptySelfCount)) { // four
      return [shapes.FOUR, selfCount];
    } else if (!(rightEmpty === 0 && leftEmpty === 0)) { // block four
      return [shapes.BLOCK_FOUR, selfCount];
    }
  }
  if (OneEmptySelfCount === 4) {
    return [shapes.BLOCK_FOUR, selfCount];
  }
  // three
  if (noEmptySelfCount === 3) {
    if ((rightEmpty >= 2 && leftEmpty >= 1) || (rightEmpty >= 1 && leftEmpty >= 2)) {
      return [shapes.THREE, selfCount];
    } else {
      return [shapes.BLOCK_THREE, selfCount];
    }
  }
  if (OneEmptySelfCount === 3) {
    if ((rightEmpty >= 1 && leftEmpty >= 1)) {
      return [shapes.THREE, selfCount];
    } else {
      return [shapes.BLOCK_THREE, selfCount];
    }
  }
  if ((noEmptySelfCount === 2 || OneEmptySelfCount === 2) && totalLength > 5) { // two
    shape = shapes.TWO;
  }

  return [shape, selfCount];
}

export const isFive = (shape) => {
  return shape === shapes.FIVE || shape === shapes.BLOCK_FIVE;
};

export const isFour = (shape) => {
  return shape === shapes.FOUR || shape === shapes.BLOCK_FOUR;
};

export const getAllShapesOfPoint = (shapeCache, x, y, role) => {
  const roles = role ? [role] : [1, -1];
  const result = [];
  for (const r of roles) {
    for (const d of [0, 1, 2, 3]) {
      const shape = shapeCache[r][d][x][y];
      if (shape > 0) {
        result.push(shape);
      }
    }
  }
  return result;
}