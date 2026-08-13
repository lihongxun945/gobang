import { openingBookSourcesByMode } from './catalog';
import { compileOpeningBook } from './compiler';
import { canonicalizePosition, inverseTransformPoint, transformPoint } from './symmetry';

const getTranslatedFirstReplies = (sources, board) => {
  if (board.history.length !== 1) return [];
  const [{ i: anchorX, j: anchorY, role }] = board.history;
  const candidates = new Map();

  sources.forEach((source) => {
    if (source.size !== board.size || source.firstRole !== role) return;
    source.lines.forEach((line) => {
      const minPrefixLength = line.minPrefixLength || source.minPrefixLength;
      if (minPrefixLength > 1 || line.moves.length < 2) return;
      const uniqueMoves = new Set();
      for (let transform = 0; transform < 8; transform += 1) {
        const first = transformPoint(line.moves[0], source.size, transform);
        const reply = transformPoint(line.moves[1], source.size, transform);
        const move = [anchorX + reply[0] - first[0], anchorY + reply[1] - first[1]];
        const [x, y] = move;
        if (x < 0 || x >= board.size || y < 0 || y >= board.size || board.board[x][y] !== 0) {
          continue;
        }
        const moveKey = x * board.size + y;
        if (uniqueMoves.has(moveKey)) continue;
        uniqueMoves.add(moveKey);
        const previous = candidates.get(moveKey) || { move, weight: 0, sources: [] };
        previous.weight += 1;
        previous.sources.push(`${source.id}:${line.id}:translated`);
        candidates.set(moveKey, previous);
      }
    });
  });

  return [...candidates.values()].sort((left, right) => (
    right.weight - left.weight
      || left.move[0] - right.move[0]
      || left.move[1] - right.move[1]
  ));
};

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
      if (!candidates) return getTranslatedFirstReplies(sources, board);
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
