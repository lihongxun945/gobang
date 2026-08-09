// Frozen copy of the v3 searcher. Keep this implementation unchanged so that
// strength tests can compare candidate engines against the original engine.
import Cache from '../cache';
import { FIVE } from '../eval';

const MAX = 1000000000;
const onlyThreeThreshold = 6;
const cache = new Cache();

const factory = (onlyThree = false, onlyFour = false) => {
  const helper = (board, role, depth, cDepth = 0, path = [], alpha = -MAX, beta = MAX) => {
    if (cDepth >= depth || board.isGameOver()) return [board.evaluate(role), null, [...path]];
    const hash = board.hash();
    const prev = cache.get(hash);
    if (prev && prev.role === role &&
      (Math.abs(prev.value) >= FIVE || prev.depth >= depth - cDepth) &&
      prev.onlyThree === onlyThree && prev.onlyFour === onlyFour) {
      return [prev.value, prev.move, [...path, ...prev.path]];
    }
    let value = -MAX;
    let move = null;
    let bestPath = [...path];
    let bestDepth = 0;
    const points = board.getValuableMoves(role, cDepth, onlyThree || cDepth > onlyThreeThreshold, onlyFour);
    if (!points.length) return [board.evaluate(role), null, [...path]];
    for (let d = cDepth + 1; d <= depth; d += 1) {
      if (d % 2 !== 0) continue;
      let breakAll = false;
      for (const point of points) {
        board.put(point[0], point[1], role);
        const nextPath = [...path, point];
        let [currentValue, , currentPath] = helper(board, -role, d, cDepth + 1, nextPath, -beta, -alpha);
        currentValue = -currentValue;
        board.undo();
        if (currentValue >= FIVE || d === depth) {
          if (currentValue > value ||
            (currentValue <= -FIVE && value <= -FIVE && currentPath.length > bestDepth)) {
            value = currentValue;
            move = point;
            bestPath = currentPath;
            bestDepth = currentPath.length;
          }
        }
        alpha = Math.max(alpha, value);
        if (alpha >= FIVE) {
          breakAll = true;
          break;
        }
        if (alpha >= beta) break;
      }
      if (breakAll) break;
    }
    if ((cDepth < onlyThreeThreshold || onlyThree || onlyFour) && (!prev || prev.depth < depth - cDepth)) {
      cache.put(hash, {
        depth: depth - cDepth,
        value,
        move,
        role,
        path: bestPath.slice(cDepth),
        onlyThree,
        onlyFour,
      });
    }
    return [value, move, bestPath];
  };
  return helper;
};

const normal = factory();
const vct = factory(true);

export const baselineMinmax = (board, role, depth = 4, enableVCT = true) => {
  if (!enableVCT) return normal(board, role, depth);
  const vctDepth = depth + 8;
  let [value, move, bestPath] = vct(board, role, vctDepth);
  if (value >= FIVE) return [value, move, bestPath];
  [value, move, bestPath] = normal(board, role, depth);
  if (!move) return [value, move, bestPath];
  board.put(move[0], move[1], role);
  const [opponentValue, opponentMove, opponentPath] = vct(board.reverse(), role, vctDepth);
  board.undo();
  if (value < FIVE && opponentValue === FIVE && opponentPath.length > bestPath.length) {
    const [, , originalOpponentPath] = vct(board.reverse(), role, vctDepth);
    if (opponentPath.length <= originalOpponentPath.length) {
      return [value, opponentMove, opponentPath];
    }
  }
  return [value, move, bestPath];
};
