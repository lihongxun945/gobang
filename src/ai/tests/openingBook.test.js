import Board from '../board';
import { candidateMinmax, resetSearchStats, searchStats } from '../candidate/minmax';
import { loadOpeningSet } from '../fixtures/openings';
import { rapfiVerified } from '../opening-book/catalog';
import {
  canonicalizePosition,
  createOpeningBook,
  getOpeningBookMoves,
  inverseTransformPoint,
  normalizeOpeningSource,
  openingBookSize,
  openingBookSizes,
  transformPoint,
} from '../openingBook';

const containsMove = (candidates, expected) => candidates.some(({ move }) => (
  move[0] === expected[0] && move[1] === expected[1]
));

describe('opening book', () => {
  test('all symmetry transforms round-trip coordinates', () => {
    for (let transform = 0; transform < 8; transform += 1) {
      const transformed = transformPoint([2, 11], 15, transform);
      expect(inverseTransformPoint(transformed, 15, transform)).toEqual([2, 11]);
    }
  });

  test('canonical position key is identical for all symmetries', () => {
    const stones = [
      { x: 7, y: 7, role: 1 },
      { x: 7, y: 6, role: -1 },
      { x: 9, y: 6, role: 1 },
    ];
    const expected = canonicalizePosition(stones, 15).key;
    for (let transform = 0; transform < 8; transform += 1) {
      const transformed = stones.map(({ x, y, role }) => {
        const [tx, ty] = transformPoint([x, y], 15, transform);
        return { x: tx, y: ty, role };
      });
      expect(canonicalizePosition(transformed, 15).key).toBe(expected);
    }
  });

  test('every official prefix finds its continuation under all symmetries', () => {
    expect(openingBookSize).toBeGreaterThan(0);
    expect(openingBookSizes.balanced).toBeGreaterThan(0);
    for (const opening of loadOpeningSet()) {
      for (let prefix = 1; prefix < opening.moves.length; prefix += 1) {
        for (let transform = 0; transform < 8; transform += 1) {
          const board = new Board(opening.size);
          opening.moves.slice(0, prefix).forEach((move) => {
            const [x, y] = transformPoint(move, opening.size, transform);
            expect(board.put(x, y)).toBe(true);
          });
          const expected = transformPoint(opening.moves[prefix], opening.size, transform);
          const candidates = getOpeningBookMoves(board, 'balanced');
          if (!containsMove(candidates, expected)) {
            throw new Error(JSON.stringify({
              openingId: opening.id, prefix, transform, expected, candidates,
            }));
          }
        }
      }
    }
  });

  test('strength mode serves only the Rapfi-verified response', () => {
    const opening = rapfiVerified.openings[0];
    const moves = opening.coordinates;
    const board = new Board(rapfiVerified.size);
    moves.slice(0, opening.minPrefixLength).forEach(([x, y]) => {
      expect(board.put(x, y)).toBe(true);
    });

    const candidates = getOpeningBookMoves(board);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].move).toEqual(moves[opening.minPrefixLength]);
    expect(candidates[0].sources[0]).toContain('rapfi-verified-freestyle-15x15');
  });

  test('does not prescribe a move for an empty or unknown position', () => {
    expect(getOpeningBookMoves(new Board(15))).toEqual([]);
    const unknown = new Board(15);
    unknown.put(0, 0);
    expect(getOpeningBookMoves(unknown)).toEqual([]);
  });

  test('can register an independent opening source', () => {
    const source = normalizeOpeningSource({
      id: 'test-9x9',
      name: 'Test 9x9 opening',
      size: 9,
      coordinateSystem: 'board-row-column',
      openings: [{ id: 'line-1', coordinates: [[4, 4], [4, 3], [5, 4]] }],
    });
    const book = createOpeningBook([source]);
    const board = new Board(9);
    board.put(4, 4);

    expect(containsMove(book.getMoves(board), [4, 3])).toBe(true);
  });

  test('default strength mode adopts a Rapfi natural reply after center', () => {
    const board = new Board(15);
    board.put(7, 7);
    resetSearchStats();

    const result = candidateMinmax(board, board.role, 4, false);
    const [row, col] = result[1];
    expect(searchStats.bookHits).toBe(1);
    expect(searchStats.openingBook.adopted).toBe(true);
    expect(containsMove(getOpeningBookMoves(board), result[1])).toBe(true);
    expect(Math.max(Math.abs(row - 7), Math.abs(col - 7))).toBe(1);
  });

  test('candidate search enables the book by default and supports disabling it', () => {
    const opening = loadOpeningSet()[2];
    const board = new Board(opening.size);
    board.put(opening.moves[0][0], opening.moves[0][1]);
    resetSearchStats();
    const result = candidateMinmax(board, board.role, 2, false, {
      openingBookMode: 'balanced',
    });
    expect(searchStats.bookHits).toBe(1);
    expect(searchStats.openingBook.adopted).toBe(true);
    expect(containsMove(getOpeningBookMoves(board, 'balanced'), result[1])).toBe(true);
    resetSearchStats();
    candidateMinmax(board, board.role, 2, false, { disableOpeningBook: true });
    expect(searchStats.bookHits).toBe(0);
    expect(searchStats.openingBook).toBeNull();
  });
});
