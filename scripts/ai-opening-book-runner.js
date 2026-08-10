import assert from 'assert';
import Board from '../src/ai/board';
import {
  candidateMinmax, clearSearchCache, resetSearchStats, searchStats,
} from '../src/ai/candidate/minmax';
import { loadOpeningSet, gomocup2026 } from '../src/ai/fixtures/openings';

const depth = Number(process.env.AI_DEPTH || 4);
const rounds = Number(process.env.AI_ROUNDS || 5);
const positions = loadOpeningSet().flatMap((opening) => (
  opening.moves.slice(1).map((_, index) => ({
    openingId: opening.id,
    size: opening.size,
    moves: opening.moves.slice(0, index + 1),
  }))
));

const measure = (position, useBook) => {
  const board = new Board(position.size);
  position.moves.forEach(([x, y]) => assert.strictEqual(board.put(x, y), true));
  clearSearchCache(board);
  resetSearchStats();
  const startedAt = performance.now();
  const result = candidateMinmax(board, board.role, depth, false, {
    disableOpeningBook: !useBook,
  });
  return {
    result,
    elapsedMs: performance.now() - startedAt,
    nodes: searchStats.nodes,
    bookHits: searchStats.bookHits,
  };
};

const samples = [];
let pvDrifts = 0;
let rootMoveDrifts = 0;
for (let round = 0; round < rounds; round += 1) {
  let withoutBookMs = 0;
  let withBookMs = 0;
  let withoutBookNodes = 0;
  let withBookNodes = 0;
  let hits = 0;
  positions.forEach((position, index) => {
    const bookFirst = (round + index) % 2 === 0;
    const first = measure(position, bookFirst);
    const second = measure(position, !bookFirst);
    const withoutBook = bookFirst ? second : first;
    const withBook = bookFirst ? first : second;
    const label = `${position.openingId}/prefix-${position.moves.length}/round-${round + 1}`;
    assert.strictEqual(withBook.result[0], withoutBook.result[0], `${label}: score drift`);
    if (JSON.stringify(withBook.result[1]) !== JSON.stringify(withoutBook.result[1])) {
      rootMoveDrifts += 1;
    }
    assert.strictEqual(withBook.result[3], withoutBook.result[3], `${label}: depth drift`);
    if (JSON.stringify(withBook.result[2]) !== JSON.stringify(withoutBook.result[2])) pvDrifts += 1;
    withoutBookMs += withoutBook.elapsedMs;
    withBookMs += withBook.elapsedMs;
    withoutBookNodes += withoutBook.nodes;
    withBookNodes += withBook.nodes;
    hits += withBook.bookHits;
  });
  samples.push({
    round: round + 1,
    withoutBookMs,
    withBookMs,
    speedup: withoutBookMs / withBookMs,
    withoutBookNodes,
    withBookNodes,
    nodeRatio: withBookNodes / withoutBookNodes,
    hits,
  });
}

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
};

console.log(JSON.stringify({
  fixture: gomocup2026.name,
  depth,
  rounds,
  positions: positions.length,
  fasterEveryRound: samples.every(({ withoutBookMs, withBookMs }) => withBookMs < withoutBookMs),
  medianSpeedup: median(samples.map(({ speedup }) => speedup)),
  medianNodeRatio: median(samples.map(({ nodeRatio }) => nodeRatio)),
  rootMoveDrifts,
  pvDrifts,
  samples,
}, null, 2));
