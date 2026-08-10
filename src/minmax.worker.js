import Board from './ai/board';
import { minmax, resetSearchStats, searchStats } from './ai/candidate/minmax';
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
let score = 0, bestPath = [], currentDepth = 0;
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
    score,
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
  openingBookDebug = {
    enabled: openingBook, mode: openingBookMode,
    hit: false, adopted: false, selectedMove: null, candidates: [],
  };
  try {
    if (aiFirst) {
      const res = search(depth, openingBook, openingBookMode);
      let move;
      [score, move, bestPath, currentDepth] = res;
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
    board.put(move[0], move[1]);
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