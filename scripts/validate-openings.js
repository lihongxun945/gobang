import assert from 'assert';
import Board from '../src/ai/board';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const openings = loadOpeningSet();
assert.strictEqual(gomocup2026.rules, 'freestyle');
assert.strictEqual(gomocup2026.size, 15);
assert.strictEqual(openings.length, 12);

const positionKeys = new Set();
for (const opening of openings) {
  const board = new Board(opening.size);
  const occupied = new Set();
  for (const move of opening.moves) {
    const [row, col] = move;
    assert(row >= 0 && row < opening.size && col >= 0 && col < opening.size,
      `${opening.id}: out-of-range move ${move}`);
    const key = `${row}:${col}`;
    assert(!occupied.has(key), `${opening.id}: duplicate move ${move}`);
    occupied.add(key);
    assert.strictEqual(board.put(row, col), true, `${opening.id}: illegal move ${move}`);
  }
  assert.strictEqual(board.getWinner(), 0, `${opening.id}: opening is already won`);
  assert.strictEqual(board.role, opening.moves.length % 2 === 0 ? 1 : -1,
    `${opening.id}: side to move is inconsistent`);
  const positionKey = board.toString();
  assert(!positionKeys.has(positionKey), `${opening.id}: duplicate board position`);
  positionKeys.add(positionKey);
}

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  source: gomocup2026.source,
  rules: gomocup2026.rules,
  size: gomocup2026.size,
  openings: openings.length,
  validation: 'pass',
}, null, 2));
