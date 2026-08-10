import Cache from '../cache';
import { BLOCK_FOUR, FIVE, THREE } from '../eval';
import { getOpeningBookMoves } from '../openingBook';

const MAX = 1000000000;
const onlyThreeThreshold = 6;
const QUIESCENCE_DEPTH = 2;
const SEARCH_TIMEOUT = Symbol('search-timeout');

export const TT_FLAG = { EXACT: 'exact', LOWER: 'lower', UPPER: 'upper' };
export const searchStats = { nodes: 0, stores: 0, hits: 0, bookHits: 0, openingBook: null };

let boardTables = new WeakMap();
const getTable = (board) => {
  let table = boardTables.get(board);
  if (!table) {
    table = new Cache();
    boardTables.set(board, table);
  }
  return table;
};

export const clearSearchCache = (board) => {
  if (board) boardTables.delete(board);
  else boardTables = new WeakMap();
};

export const resetSearchStats = () => {
  searchStats.nodes = 0;
  searchStats.stores = 0;
  searchStats.hits = 0;
  searchStats.bookHits = 0;
  searchStats.openingBook = null;
};

const modeKey = (onlyThree, onlyFour) => `${onlyThree ? 1 : 0}:${onlyFour ? 1 : 0}`;

const classifyFlag = (score, alpha, beta) => {
  if (score <= alpha) return TT_FLAG.UPPER;
  if (score >= beta) return TT_FLAG.LOWER;
  return TT_FLAG.EXACT;
};

const invertFlag = (flag) => {
  if (flag === TT_FLAG.LOWER) return TT_FLAG.UPPER;
  if (flag === TT_FLAG.UPPER) return TT_FLAG.LOWER;
  return TT_FLAG.EXACT;
};

const normalizeScore = (score) => (
  Math.abs(score) >= FIVE ? Math.sign(score) * FIVE : score
);

const pointScore = (board, role, [x, y]) => {
  const selfScores = role === 1 ? board.evaluator.blackScores : board.evaluator.whiteScores;
  const opponentScores = role === 1 ? board.evaluator.whiteScores : board.evaluator.blackScores;

  return selfScores[x][y] * 2 + opponentScores[x][y];
};

const sameMove = (left, right) => (
  left && right && left[0] === right[0] && left[1] === right[1]
);

const moveIndex = (size, [x, y]) => x * size + y;

const compareBookMoves = (context, board, ply, left, right) => {
  if (ply !== 0 || !context.openingBookRanks) return 0;
  return context.openingBookRanks[moveIndex(board.size, right)]
    - context.openingBookRanks[moveIndex(board.size, left)];
};

const orderingBonus = (context, ply, point, size) => {
  const index = moveIndex(size, point);
  if (context.useKillers) {
    const killers = context.killers[ply];
    if (index === killers?.[0]) return 768;
    if (index === killers?.[1]) return 512;
  }
  return context.useHistory ? context.history[index] : 0;
};

const recordCutoffMove = (context, ply, remainingDepth, point, size) => {
  if (!context.experimentalMoveOrdering) return;
  const index = moveIndex(size, point);
  if (context.useKillers) {
    const killers = context.killers[ply] || [];
    if (index !== killers[0]) {
      context.killers[ply] = [index, killers[0]];
    }
  }
  if (context.useHistory) {
    context.history[index] = Math.min(context.history[index] + remainingDepth ** 2, 255);
  }
};

const hasThreatAtLeast = (board, threshold) => {
  const { blackScores, whiteScores } = board.evaluator;
  for (let row = 0; row < board.size; row += 1) {
    for (let col = 0; col < board.size; col += 1) {
      if (blackScores[row][col] >= threshold || whiteScores[row][col] >= threshold) {
        return true;
      }
    }
  }
  return false;
};

const quiescence = (board, role, ply, remainingDepth, alpha, beta, context) => {
  const originalAlpha = alpha;
  const originalBeta = beta;
  searchStats.nodes += 1;
  if (context.deadline && (searchStats.nodes & 1023) === 0 && performance.now() >= context.deadline) {
    throw SEARCH_TIMEOUT;
  }
  const staticScore = board.evaluate(role);
  if (!remainingDepth || board.isGameOver() || !hasThreatAtLeast(board, BLOCK_FOUR)) {
    return { score: staticScore, flag: TT_FLAG.EXACT };
  }

  const forcingMoves = board.getValuableMoves(role, ply, false, true);
  if (!forcingMoves.length) return { score: staticScore, flag: TT_FLAG.EXACT };

  let bestScore = -MAX;
  for (const point of forcingMoves) {
    if (!board.put(point[0], point[1], role)) continue;
    let childScore;
    try {
      childScore = quiescence(
        board, -role, ply + 1, remainingDepth - 1, -beta, -alpha, context,
      ).score;
    } finally {
      board.undo();
    }
    bestScore = Math.max(bestScore, -childScore);
    alpha = Math.max(alpha, bestScore);
    if (alpha >= beta || alpha >= FIVE) break;
  }
  const score = bestScore === -MAX ? staticScore : bestScore;
  return {
    score, flag: classifyFlag(score, originalAlpha, originalBeta),
  };
};

const factory = (onlyThree = false, onlyFour = false) => {
  const enableQuiescence = !onlyThree && !onlyFour;
  const search = (board, role, depth, ply, alpha, beta, context, isScout = false) => {
    searchStats.nodes += 1;
    if (context.deadline && (searchStats.nodes & 1023) === 0 && performance.now() >= context.deadline) {
      throw SEARCH_TIMEOUT;
    }
    if (ply >= depth || board.isGameOver()) {
      const leaf = !board.isGameOver() && enableQuiescence && !context.disableQuiescence
        ? quiescence(board, role, ply, QUIESCENCE_DEPTH, alpha, beta, context)
        : { score: board.evaluate(role), flag: TT_FLAG.EXACT };
      const { score } = leaf;
      const distanceScore = Math.abs(score) >= FIVE
        ? Math.sign(score) * (FIVE + depth - ply)
        : score;
      return { score: distanceScore, move: null, pv: [], flag: leaf.flag };
    }

    const table = getTable(board);
    const key = board.hash();
    const originalAlpha = alpha;
    const originalBeta = beta;
    const remainingDepth = depth - ply;
    const mode = modeKey(onlyThree, onlyFour);
    const previous = table.get(key);
    if (!context.disableTt && !context.disableTtCutoffs && previous && previous.role === role && previous.mode === mode && previous.depth >= remainingDepth) {
      searchStats.hits += 1;
      if (previous.flag === TT_FLAG.EXACT) {
        return {
          score: previous.score, move: previous.move, pv: previous.pv || [], flag: previous.flag,
        };
      }
      if (!context.exactTtOnly && previous.flag === TT_FLAG.LOWER) alpha = Math.max(alpha, previous.score);
      if (!context.exactTtOnly && previous.flag === TT_FLAG.UPPER) beta = Math.min(beta, previous.score);
      if (alpha >= beta) {
        return {
          score: previous.score, move: previous.move, pv: previous.pv || [], flag: previous.flag,
        };
      }
    }

    const points = [...board.getValuableMoves(
      role, ply, onlyThree || ply > onlyThreeThreshold, onlyFour,
    )];
    if (!points.length) {
      return { score: board.evaluate(role), move: null, pv: [], flag: TT_FLAG.EXACT };
    }

    if (context.experimentalMoveOrdering) {
      points.sort((left, right) => {
        if (sameMove(left, previous?.move)) return -1;
        if (sameMove(right, previous?.move)) return 1;
        const leftScore = pointScore(board, role, left);
        const rightScore = pointScore(board, role, right);
        if (leftScore !== rightScore) return rightScore - leftScore;
        const bookOrder = compareBookMoves(context, board, ply, left, right);
        if (bookOrder) return bookOrder;
        return orderingBonus(context, ply, right, board.size)
          - orderingBonus(context, ply, left, board.size);
      });
    } else {
      points.sort((left, right) => {
        if (sameMove(left, previous?.move)) return -1;
        if (sameMove(right, previous?.move)) return 1;
        const leftScore = pointScore(board, role, left);
        const rightScore = pointScore(board, role, right);
        if (leftScore !== rightScore) return rightScore - leftScore;
        const bookOrder = compareBookMoves(context, board, ply, left, right);
        if (bookOrder) return bookOrder;
        return 0;
      });
    }

    let bestScore = -MAX;
    let bestMove = null;
    let bestPv = [];
    let searchedMoves = 0;
    for (const point of points) {
      if (!board.put(point[0], point[1], role)) continue;
      let child;
      try {
        if (context.experimentalPvs && ply === 0 && searchedMoves > 0) {
          const alphaBefore = alpha;
          const scout = search(
            board, -role, depth, ply + 1, -alpha - 1, -alpha, context, true,
          );
          const scoutScore = -scout.score;
          const needsResearch = scoutScore > alpha && scoutScore < beta;
          child = needsResearch
            ? search(board, -role, depth, ply + 1, -beta, -alpha, context, false)
            : scout;
          if (context.traceRoot) {
            context.traceRoot({
              depth, point, alphaBefore, scoutScore, scoutFlag: invertFlag(scout.flag),
              needsResearch, finalScore: -child.score,
            });
          }
        } else {
          child = search(board, -role, depth, ply + 1, -beta, -alpha, context, isScout);
        }
      } finally {
        board.undo();
      }
      searchedMoves += 1;
      const score = -child.score;
      if (score > bestScore) {
        bestScore = score;
        bestMove = point;
        bestPv = [point, ...child.pv];
      }
      alpha = Math.max(alpha, bestScore);
      if (alpha >= beta || alpha >= FIVE) {
        if (context.experimentalMoveOrdering) {
          recordCutoffMove(context, ply, remainingDepth, point, board.size);
        }
        break;
      }
    }

    if (!bestMove) return { score: board.evaluate(role), move: null, pv: [], flag: TT_FLAG.EXACT };
    const flag = classifyFlag(bestScore, originalAlpha, originalBeta);
    if (!context.disableTt && !isScout) {
      searchStats.stores += 1;
      table.put(key, {
        depth: remainingDepth, score: bestScore, move: bestMove, pv: bestPv,
        role, mode, flag,
      });
    }
    const result = { score: bestScore, move: bestMove, pv: bestPv, flag };
    if (isScout && !context.verifyingBoundary && context.verifyScoutAtPly === ply) {
      context.verifyingBoundary = true;
      let exact;
      let stateMatchesFresh;
      let blackScoresMatch;
      let whiteScoresMatch;
      let shapeCacheMatches;
      try {
        const verificationBoard = new board.constructor(board.size, board.firstRole);
        board.history.forEach(({ i, j, role: moveRole }) => {
          verificationBoard.put(i, j, moveRole);
        });
        blackScoresMatch = JSON.stringify(board.evaluator.blackScores)
          === JSON.stringify(verificationBoard.evaluator.blackScores);
        whiteScoresMatch = JSON.stringify(board.evaluator.whiteScores)
          === JSON.stringify(verificationBoard.evaluator.whiteScores);
        shapeCacheMatches = JSON.stringify(board.evaluator.shapeCache)
          === JSON.stringify(verificationBoard.evaluator.shapeCache);
        stateMatchesFresh = blackScoresMatch && whiteScoresMatch && shapeCacheMatches;
        exact = search(
          verificationBoard, role, depth, ply, -MAX, MAX, context, true,
        );
      } finally {
        context.verifyingBoundary = false;
      }
      const valid = (
        (flag === TT_FLAG.EXACT && bestScore === exact.score)
        || (flag === TT_FLAG.LOWER && bestScore <= exact.score)
        || (flag === TT_FLAG.UPPER && bestScore >= exact.score)
      );
      if (!valid && context.traceBoundary) {
        context.traceBoundary({
          ply, role, alpha: originalAlpha, beta: originalBeta,
          score: bestScore, flag, exactScore: exact.score,
          move: bestMove, exactMove: exact.move, stateMatchesFresh,
          blackScoresMatch, whiteScoresMatch, shapeCacheMatches,
        });
      }
    }
    return result;
  };

  return (board, role, maxDepth = 4, options = {}) => {
    let completed = null;
    let completedDepth = 0;
    const moveOrderingMode = options.experimentalMoveOrderingMode
      || (options.experimentalMoveOrdering === true
        ? 'combined' : options.disableMoveOrdering === true ? null : 'killer');
    const bookMoves = !onlyThree && !onlyFour && options.disableOpeningBook !== true
      ? getOpeningBookMoves(board, options.openingBookMode) : [];
    const openingBookRanks = bookMoves.length
      ? new Uint16Array(board.size * board.size) : null;
    bookMoves.forEach(({ move }, index) => {
      openingBookRanks[moveIndex(board.size, move)] = bookMoves.length - index;
    });
    if (bookMoves.length) {
      searchStats.bookHits += 1;
      searchStats.openingBook = {
        adopted: false,
        selectedMove: null,
        candidates: bookMoves.map(({ move, weight, sources }) => ({ move, weight, sources })),
      };
    }
    const context = {
      deadline: options.deadline || (options.timeLimitMs ? performance.now() + options.timeLimitMs : 0),
      experimentalPvs: options.experimentalPvs === true && !onlyThree && !onlyFour,
      traceRoot: options.traceRoot,
      disableTtCutoffs: options.disableTtCutoffs === true,
      exactTtOnly: options.exactTtOnly === true || options.experimentalPvs === true,
      disableTt: options.disableTt === true,
      disableQuiescence: options.disableQuiescence === true,
      verifyScoutAtPly: options.verifyScoutAtPly,
      traceBoundary: options.traceBoundary,
      verifyingBoundary: false,
      experimentalMoveOrdering: Boolean(moveOrderingMode),
      useKillers: moveOrderingMode === 'killer' || moveOrderingMode === 'combined',
      useHistory: moveOrderingMode === 'history' || moveOrderingMode === 'combined',
      killers: moveOrderingMode ? [] : null,
      history: moveOrderingMode
        ? new Uint16Array(board.size * board.size) : null,
      openingBookRanks,
    };
    const firstDepth = maxDepth < 2 ? maxDepth : 2;
    for (let depth = firstDepth; depth <= maxDepth; depth += 2) {
      let result;
      try {
        result = search(board, role, depth, 0, -MAX, MAX, context);
      } catch (error) {
        if (error === SEARCH_TIMEOUT) break;
        throw error;
      }
      if (result.move || board.isGameOver()) {
        completed = result;
        completedDepth = depth;
      }
      if (result.score >= FIVE) break;
    }
    if (!completed) {
      const fallback = board.getValuableMoves(role, 0, onlyThree, onlyFour)[0] || null;
      return [board.evaluate(role), fallback, fallback ? [fallback] : [], 0];
    }
    return [normalizeScore(completed.score), completed.move, completed.pv, completedDepth];
  };
};

const normal = factory();
export const candidateVct = factory(true);
export const candidateVcf = factory(false, true);

export const candidateMinmax = (board, role, depth = 4, enableVCT = true, options = {}) => {
  if (options.disableOpeningBook !== true && !hasThreatAtLeast(board, THREE)) {
    const bookMoves = getOpeningBookMoves(board, options.openingBookMode);
    if (bookMoves.length) {
      const selected = bookMoves[0];
      searchStats.bookHits += 1;
      searchStats.openingBook = {
        adopted: true,
        selectedMove: selected.move,
        candidates: bookMoves.map(({ move, weight, sources }) => ({ move, weight, sources })),
      };
      return [board.evaluate(role), selected.move, [selected.move], 0];
    }
  }
  if (!enableVCT || !hasThreatAtLeast(board, THREE)) return normal(board, role, depth, options);
  const startedAt = performance.now();
  const timeLimitMs = Number(options.timeLimitMs) || 0;
  const phaseOptions = (fraction) => (timeLimitMs ? {
    deadline: startedAt + timeLimitMs * fraction,
  } : options);
  const vctDepth = depth + 8;
  let [score, move, bestPath, completedDepth] = candidateVct(board, role, vctDepth, phaseOptions(0.35));
  if (score >= FIVE) return [score, move, bestPath, completedDepth];

  // If the opponent already has a forcing line, first try occupying its
  // principal threat point. Verify the block before preferring positional play.
  const [threatScore, threatMove] = candidateVct(board.reverse(), role, vctDepth, phaseOptions(0.6));
  if (threatScore >= FIVE && threatMove && board.board[threatMove[0]][threatMove[1]] === 0) {
    board.put(threatMove[0], threatMove[1], role);
    let afterBlock;
    try {
      afterBlock = candidateVct(board.reverse(), role, vctDepth, phaseOptions(0.75));
    } finally {
      board.undo();
    }
    if (afterBlock[0] < FIVE) {
      return [board.evaluate(role), threatMove, [threatMove, ...afterBlock[2]], completedDepth];
    }
  }

  [score, move, bestPath, completedDepth] = normal(board, role, depth, phaseOptions(0.9));
  if (!move) return [score, move, bestPath, completedDepth];
  if (!board.put(move[0], move[1], role)) return [score, move, bestPath, completedDepth];
  let opponentResult;
  try {
    opponentResult = candidateVct(board.reverse(), role, vctDepth, phaseOptions(1));
  } finally {
    board.undo();
  }
  const [opponentScore, opponentMove, opponentPath] = opponentResult;
  if (score < FIVE && opponentScore === FIVE && opponentPath.length > bestPath.length) {
    const [, , originalOpponentPath] = candidateVct(board.reverse(), role, vctDepth, phaseOptions(1));
    if (opponentPath.length <= originalOpponentPath.length && opponentMove) {
      return [score, opponentMove, opponentPath, completedDepth];
    }
  }
  return [score, move, bestPath, completedDepth];
};

export { candidateMinmax as minmax };
