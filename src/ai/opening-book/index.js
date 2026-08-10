import { openingBookSourcesByMode } from './catalog';
import { compileOpeningBook } from './compiler';
import { canonicalizePosition, inverseTransformPoint } from './symmetry';

export const createOpeningBook = (sources) => {
  const compiled = compileOpeningBook(sources);
  return {
    size: compiled.positions.size,
    getMoves(board) {
      if (
        board.history.length === 0
        || !compiled.supportedBoards.has(`${board.size}:${board.firstRole}`)
      ) return [];
      const stones = board.history.map(({ i: x, j: y, role }) => ({ x, y, role }));
      const { key, transform } = canonicalizePosition(stones, board.size);
      const candidates = compiled.positions.get(key);
      if (!candidates) return [];
      return [...candidates.values()].map((candidate) => ({
        ...candidate,
        move: inverseTransformPoint(candidate.move, board.size, transform),
      })).filter(({ move: [x, y] }) => board.board[x][y] === 0)
        .sort((left, right) => right.weight - left.weight);
    },
  };
};

const openingBooks = Object.fromEntries(Object.entries(openingBookSourcesByMode)
  .map(([mode, sources]) => [mode, createOpeningBook(sources)]));

export const getOpeningBookMoves = (board, mode = 'strength') => (
  openingBooks[mode]?.getMoves(board) || []
);
export const openingBookSize = openingBooks.strength.size;
export const openingBookSizes = Object.fromEntries(Object.entries(openingBooks)
  .map(([mode, book]) => [mode, book.size]));

export {
  balancedOpeningBookSources,
  openingBookSources,
  openingBookSourcesByMode,
  strengthOpeningBookSources,
} from './catalog';
export { compileOpeningBook } from './compiler';
export { centerRelativeToBoard, normalizeOpeningSource } from './source';
export {
  canonicalizePosition, inverseTransformPoint, transformPoint,
} from './symmetry';
