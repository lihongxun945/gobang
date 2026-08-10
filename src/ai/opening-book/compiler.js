import { canonicalizePosition, transformPoint } from './symmetry';

export const compileOpeningBook = (sources) => {
  const positions = new Map();
  const supportedBoards = new Set();
  for (const source of sources) {
    supportedBoards.add(`${source.size}:${source.firstRole}`);
    for (const line of source.lines) {
      for (
        let prefixLength = line.minPrefixLength || source.minPrefixLength;
        prefixLength < line.moves.length;
        prefixLength += 1
      ) {
        const stones = line.moves.slice(0, prefixLength).map(([x, y], index) => ({
          x, y, role: index % 2 === 0 ? source.firstRole : -source.firstRole,
        }));
        const { key, transforms } = canonicalizePosition(stones, source.size);
        let candidates = positions.get(key);
        if (!candidates) {
          candidates = new Map();
          positions.set(key, candidates);
        }
        const canonicalMoves = new Map();
        transforms.forEach((transform) => {
          const move = transformPoint(line.moves[prefixLength], source.size, transform);
          canonicalMoves.set(move[0] * source.size + move[1], move);
        });
        canonicalMoves.forEach((move, moveKey) => {
          const previous = candidates.get(moveKey) || { move, weight: 0, sources: [] };
          previous.weight += 1;
          previous.sources.push(`${source.id}:${line.id}`);
          candidates.set(moveKey, previous);
        });
      }
    }
  }
  return { positions, supportedBoards };
};
