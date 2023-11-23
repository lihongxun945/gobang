import Board from './ai/board';
import { minmax } from './ai/minmax';
import { board_size } from './config';

// @ts-ignore
onmessage = function (event) {
  const { action, payload } = event.data;
  let res = null;
  switch (action) {
    case 'start':
      res = start(payload.board_size, payload.aiFirst, payload.depth);
      break;
    case 'move':
      res = move(payload.position, payload.depth);
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
  }
}

export const start = (board_size, aiFirst = true, depth = 4) => {
  console.log('start', board_size, aiFirst, depth);
  board = new Board(board_size);
  try {
    if (aiFirst) {
      const res = minmax(board, board.role, depth);
      let move;
      [score, move, bestPath, currentDepth] = res;
      board.put(move[0], move[1]);
    }
  } catch (e) {
    console.log(e);
  }
  return getBoardData();
};

export const move = (position, depth) => {
  console.log('move', board_size, depth);
  try {
    board.put(position[0], position[1]);
  } catch (e) {
    console.log(e);
  }
  if (!board.isGameOver()) {
    const res = minmax(board, board.role, depth);
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