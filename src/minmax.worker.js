import Board from './ai/board';
import { minmax, resetSearchStats, searchStats } from './ai/candidate/minmax';
import { assessScore } from './ai/scoreAssessment';
import { board_size } from './config';

// @ts-ignore
onmessage = function (event) {
  const { action, payload } = event.data;
  let res = null;
  switch (action) {
    case 'start':
      res = start(
        payload.board_size, payload.aiFirst, payload.depth,
        payload.openingBook, payload.openingBookMode,
      );
      break;
    case 'move':
      res = move(payload.position, payload.depth, payload.openingBook, payload.openingBookMode);
      break;
    case 'undo':
      res = undo();
      break;
    case 'load':
      res = load(payload);
      break;
    case 'end':
      res = end();
      break;
    default:
      break;
  }
  postMessage({
    action,
    payload: res,
  });
};

let board = new Board(board_size);
let currentAiFirst = true;
let score = 0, bestPath = [], currentDepth = 0;
let scoreAssessment = assessScore(0, []);
let openingBookDebug = {
  enabled: true, hit: false, adopted: false, selectedMove: null, candidates: [],
};

const getBoardData = () => {
  return {
    board: JSON.parse(JSON.stringify(board.board)),
    winner: board.getWinner(),
    current_player: board.role,
    history: JSON.parse(JSON.stringify(board.history)),
    size: board.size,
    aiFirst: currentAiFirst,
    gameOver: board.isGameOver(),
    score,
    scoreAssessment,
    bestPath,
    currentDepth,
    openingBookDebug,
  }
}

const search = (depth, openingBook = true, openingBookMode = 'strength') => {
  resetSearchStats();
  const result = minmax(board, board.role, depth, true, {
    disableOpeningBook: !openingBook,
    openingBookMode,
  });
  openingBookDebug = {
    enabled: openingBook,
    mode: openingBookMode,
    hit: openingBook && searchStats.bookHits > 0,
    adopted: searchStats.openingBook?.adopted === true,
    selectedMove: searchStats.openingBook?.selectedMove || null,
    candidates: searchStats.openingBook?.candidates || [],
  };
  return result;
};

export const start = (
  board_size, aiFirst = true, depth = 4, openingBook = true, openingBookMode = 'strength',
) => {
  console.log('start', board_size, aiFirst, depth);
  board = new Board(board_size);
  currentAiFirst = aiFirst;
  score = 0;
  scoreAssessment = assessScore(0, []);
  openingBookDebug = {
    enabled: openingBook, mode: openingBookMode,
    hit: false, adopted: false, selectedMove: null, candidates: [],
  };
  try {
    if (aiFirst) {
      const res = search(depth, openingBook, openingBookMode);
      let move;
      [score, move, bestPath, currentDepth] = res;
      scoreAssessment = assessScore(score, searchStats.scoreTrace, searchStats.openingBook?.adopted === true);
      board.put(move[0], move[1]);
    }
  } catch (e) {
    console.log(e);
  }
  return getBoardData();
};

export const move = (
  position, depth, openingBook = true, openingBookMode = 'strength',
) => {
  openingBookDebug = {
    enabled: openingBook, mode: openingBookMode,
    hit: false, adopted: false, selectedMove: null, candidates: [],
  };
  try {
    board.put(position[0], position[1]);
  } catch (e) {
    console.log(e);
  }
  if (!board.isGameOver()) {
    const res = search(depth, openingBook, openingBookMode);
    let move;
    [score, move, bestPath, currentDepth] = res;
    scoreAssessment = assessScore(score, searchStats.scoreTrace, searchStats.openingBook?.adopted === true);
    board.put(move[0], move[1]);
  }
  return getBoardData();
};

export const load = ({
  size, aiFirst, depth, openingBook, history,
}) => {
  currentAiFirst = Boolean(aiFirst);
  const loadedDepth = Number(depth) || 6;
  const loadedBook = Boolean(openingBook);
  board = new Board(Number(size) || 15);
  score = 0;
  bestPath = [];
  currentDepth = 0;
  scoreAssessment = assessScore(0, []);
  openingBookDebug = {
    enabled: loadedBook, mode: 'strength',
    hit: false, adopted: false, selectedMove: null, candidates: [],
  };

  try {
    for (const { i, j, role } of history) {
      board.put(i, j, role);
    }
  } catch (e) {
    console.log(e);
  }

  // 棋局未结束且轮到 AI 时，自动走一步，保持“导入后轮到玩家或已结束”的交互一致性。
  const aiRole = currentAiFirst ? 1 : -1;
  if (!board.isGameOver() && board.role === aiRole) {
    try {
      const res = search(loadedDepth, loadedBook, 'strength');
      let move;
      [score, move, bestPath, currentDepth] = res;
      scoreAssessment = assessScore(score, searchStats.scoreTrace, searchStats.openingBook?.adopted === true);
      board.put(move[0], move[1]);
    } catch (e) {
      console.log(e);
    }
  }
  return getBoardData();
};

export const end = () => {
  // do nothing
  return getBoardData();
};

export const undo = () => {
  board.undo();
  board.undo();
  return getBoardData();
}
