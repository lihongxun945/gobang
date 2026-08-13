import Board from '../src/ai/board';
import {
  candidateMinmax, clearSearchCache, resetSearchStats, searchStats,
} from '../src/ai/candidate/minmax';

let board = null;
let settings = null;

const serializableHash = () => String(board.hash());

const handle = ({ action, payload = {} }) => {
  if (action === 'init') {
    settings = payload.settings;
    board = new Board(payload.size);
    payload.moves.forEach(([x, y]) => {
      if (!board.put(x, y)) throw new Error(`Invalid opening move: ${x},${y}`);
    });
    clearSearchCache(board);
    return { role: board.role, hash: serializableHash() };
  }
  if (!board) throw new Error('Engine is not initialized');
  if (action === 'move') {
    const [x, y] = payload.move;
    if (!board.put(x, y, payload.role)) throw new Error(`Invalid move: ${x},${y}`);
    return { role: board.role, winner: board.getWinner(), hash: serializableHash() };
  }
  if (action === 'search') {
    resetSearchStats();
    const startedAt = performance.now();
    const result = candidateMinmax(board, board.role, settings.depth, settings.enableVCT, {
      disableOpeningBook: !settings.openingBook,
      openingBookMode: settings.openingBookMode,
      timeLimitMs: settings.timeLimitMs,
    });
    return {
      move: result[1], score: result[0], completedDepth: result[3],
      elapsedMs: performance.now() - startedAt, nodes: searchStats.nodes,
      qThreeExtensions: searchStats.qThreeExtensions || 0,
      qThreeThirdMoves: searchStats.qThreeThirdMoves || 0,
      pvsScouts: searchStats.pvsScouts || 0,
      normalCompletedDepth: searchStats.normalCompletedDepth || 0,
    };
  }
  throw new Error(`Unknown action: ${action}`);
};

process.on('message', (message) => {
  try {
    process.send({ requestId: message.requestId, ok: true, result: handle(message) });
  } catch (error) {
    process.send({ requestId: message.requestId, ok: false, error: error.stack || error.message });
  }
});
