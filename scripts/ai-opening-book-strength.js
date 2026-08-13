import assert from 'assert';
import Board from '../src/ai/board';
import {
  candidateMinmax, clearSearchCache, resetSearchStats, searchStats,
} from '../src/ai/candidate/minmax';
import { gomocup2026, rapfiNatural } from '../src/ai/opening-book/catalog';
import { normalizeOpeningSource } from '../src/ai/opening-book/source';

const outcomeFor = (winner, role) => (
  winner === role ? 1 : winner === 0 ? 0.5 : 0
);

const loadPositions = (mode, positionLimit) => {
  if (mode === 'strength') {
    const source = normalizeOpeningSource(rapfiNatural);
    return source.lines.map((line) => ({
      id: line.id,
      size: source.size,
      moves: line.moves.slice(0, line.minPrefixLength || source.minPrefixLength),
    })).slice(0, positionLimit);
  }
  const source = normalizeOpeningSource(gomocup2026);
  return source.lines.flatMap((line) => (
    line.moves.slice(1).map((_, index) => ({
      id: `${line.id}/prefix-${index + 1}`,
      size: source.size,
      moves: line.moves.slice(0, index + 1),
    }))
  )).slice(0, positionLimit);
};

const play = (position, useBook, mode, depth) => {
  const board = new Board(position.size);
  position.moves.forEach(([x, y]) => assert.strictEqual(board.put(x, y), true));
  const initialRole = board.role;
  let bookHits = 0;
  let bookMs = 0;
  let plainMs = 0;
  let playedMoves = 0;
  while (!board.isGameOver() && playedMoves < board.size * board.size - position.moves.length) {
    const role = board.role;
    clearSearchCache(board);
    resetSearchStats();
    const startedAt = performance.now();
    const result = candidateMinmax(board, role, depth, false, {
      disableOpeningBook: !(useBook && role === initialRole),
      openingBookMode: mode,
      disablePvs: process.env.AI_DISABLE_PVS === '1',
    });
    const elapsedMs = performance.now() - startedAt;
    if (useBook && role === initialRole) {
      bookHits += searchStats.bookHits;
      bookMs += elapsedMs;
    } else {
      plainMs += elapsedMs;
    }
    const move = result[1] || board.getValidMoves()[0];
    assert(move, `${position.id}: no legal move`);
    assert.strictEqual(board.put(move[0], move[1], role), true, `${position.id}: illegal move`);
    playedMoves += 1;
  }
  return {
    winner: board.getWinner(), initialRole, useBook, bookHits, bookMs, plainMs, playedMoves,
  };
};

export const runOpeningBookStrength = () => {
  const depth = Number(process.env.AI_DEPTH || 2);
  const mode = process.env.AI_BOOK_MODE || 'strength';
  const positionLimit = Number(process.env.AI_POSITIONS || Number.MAX_SAFE_INTEGER);
  const positions = loadPositions(mode, positionLimit);
  let bookScore = 0;
  let controlScore = 0;
  let improvedPositions = 0;
  let regressedPositions = 0;
  let unchangedPositions = 0;
  const pairs = [];
  for (const position of positions) {
    const control = play(position, false, mode, depth);
    const book = play(position, true, mode, depth);
    const controlResult = outcomeFor(control.winner, control.initialRole);
    const bookResult = outcomeFor(book.winner, book.initialRole);
    const delta = bookResult - controlResult;
    bookScore += bookResult;
    controlScore += controlResult;
    if (delta > 0) improvedPositions += 1;
    else if (delta < 0) regressedPositions += 1;
    else unchangedPositions += 1;
    pairs.push({ positionId: position.id, controlResult, bookResult, delta, control, book });
  }
  const summary = {
    fixture: mode === 'strength' ? rapfiNatural.name : gomocup2026.name,
    mode,
    depth,
    positions: positions.length,
    games: positions.length * 2,
    bookScore,
    controlScore,
    scoreDelta: bookScore - controlScore,
    improvedPositions,
    regressedPositions,
    unchangedPositions,
    totalBookHits: pairs.reduce((total, pair) => total + pair.book.bookHits, 0),
    details: process.env.AI_DETAILS === '1' ? pairs : undefined,
  };
  console.log(JSON.stringify(summary, null, 2));
  return summary;
};
