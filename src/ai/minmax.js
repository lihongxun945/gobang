import Cache from "./cache";
import { FIVE, FOUR } from "./eval";

const MAX = 1000000000;
// 缓存内容：depth, value, move
export const cache_hits = {
  search: 0,
  total: 0,
  hit: 0
};

const onlyThreeThreshold = 6;
const cache = new Cache(); // 放在这里，则minmax, vct和vcf会共用同一个缓存

const factory = (onlyThree = false, onlyFour = false) => {
  // depth 表示总深度，cDepth表示当前搜索深度
  const helper = (board, role, depth, cDepth = 0, path = [], alpha = -MAX, beta = MAX) => {
    cache_hits.search++;
    if (cDepth >= depth || board.isGameOver()) {
      return [board.evaluate(role), null, [...path]];
    }
    const hash = board.hash();
    const prev = cache.get(hash);
    if (prev && prev.role === role) {
      if ((Math.abs(prev.value) >= FIVE || prev.depth >= depth - cDepth) && prev.onlyThree === onlyThree && prev.onlyFour === onlyFour) // 不能连五的，则minmax 和 vct vcf 的缓存不能通用
      {
        cache_hits.hit++;
        return [prev.value, prev.move, [...path, ...prev.path]];
      }
    }
    let value = -MAX;
    let move = null;
    let bestPath = [...path]; // Copy the current path
    let bestDepth = 0;
    let points = board.getValuableMoves(role, cDepth, onlyThree || cDepth > onlyThreeThreshold, onlyFour);
    if (cDepth === 0) {
      console.log('points:', points);
    }
    // board.display(points);
    if (!points.length) {
      // points = board.getValidMoves(role);
      return [board.evaluate(role), null, [...path]];
    }
    for (let d = cDepth + 1; d <= depth; d += 1) {
      // 迭代加深过程中只找己方能赢的解，因此只搜索偶数层即可
      if (d % 2 !== 0) continue;
      let breakAll = false;
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        board.put(point[0], point[1], role);
        let newPath = [...path, point]; // Add current move to path
        let [currentValue, currentMove, currentPath] = helper(board, -role, d, cDepth + 1, newPath, -beta, -alpha);
        currentValue = -currentValue;
        board.undo();
        // 迭代加深的过程中，除了能赢的棋，其他都不要
        // 原因是：除了必胜的，其他评估不准。比如必输的棋，由于走的步数偏少，也会变成没有输，比如 5步之后输了，但是1步肯定不会输，这时候1步的分数是不准确的，显然不能选择。
        if (currentValue >= FIVE || d === depth) {
          // 必输的棋，也要挣扎一下，选择最长的路径
          if ((currentValue > value) ||
            (currentValue <= -FIVE && value <= -FIVE && currentPath.length > bestDepth)) {
            value = currentValue;
            move = point;
            bestPath = currentPath;
            bestDepth = currentPath.length;
          }
        }
        alpha = Math.max(alpha, value);
        if (alpha >= FIVE) { // 自己赢了也结束，但是对方赢了还是要继续搜索的
          breakAll = true;
          break;
        }
        if (alpha >= beta) {
          break;
        }
      }
      if (breakAll) {
        break;
      }
    }
    // 缓存
    if ((cDepth < onlyThreeThreshold || onlyThree || onlyFour) && (!prev || prev.depth < depth - cDepth)) {
      cache_hits.total += 1;
      cache.put(hash, {
        depth: depth - cDepth, // 剩余搜索深度
        value,
        move,
        role,
        path: bestPath.slice(cDepth), // 剩余搜索路径
        onlyThree,
        onlyFour,
      });
    }
    const res = [value, move, bestPath];
    return res;
  }
  return helper;
}

const _minmax = factory();
export const vct = factory(true);
export const vcf = factory(false, true);

export const minmax = (board, role, depth = 4, enableVCT = true) => {
  if (enableVCT) {
    const vctDepth = depth + 8;
    // 先看自己有没有杀棋
    let [value, move, bestPath] = vct(board, role, vctDepth);
    if (value >= FIVE) {
      return [value, move, bestPath];
    }
    [value, move, bestPath] = _minmax(board, role, depth);
    // 假设对方有杀棋，先按自己的思路走，走完之后看对方是不是还有杀棋
    // 如果对方没有了，那么就说明走的是对的
    // 如果对方还是有，那么要对比对方的杀棋路径和自己没有走棋时的长短
    // 如果走了棋之后路径变长了，说明走的是对的
    // 如果走了棋之后，对方杀棋路径长度没变，甚至更短，说明走错了，此时就优先封堵对方
    board.put(move[0], move[1], role);
    let [value2, move2, bestPath2] = vct(board.reverse(), role, vctDepth)
    board.undo();
    if (value < FIVE && value2 === FIVE && bestPath2.length > bestPath.length) {
      let [value3, move3, bestPath3] = vct(board.reverse(), role, vctDepth)
      if (bestPath2.length <= bestPath3.length) {
        return [value, move2, bestPath2]; // value2 是被挡住的，所以这里还是用value
      }
    }
    return [value, move, bestPath];
  } else {
    return _minmax(board, role, depth);
  }
}
