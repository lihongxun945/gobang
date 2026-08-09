import gomocup2026 from './freestyle/gomocup-2026-15x15.json';

export const centerRelativeToBoard = ([x, y], size) => {
  const center = Math.floor(size / 2);
  return [center - y, center + x];
};

export const loadOpeningSet = (fixture = gomocup2026) => fixture.openings.map((opening) => ({
  ...opening,
  source: fixture.source,
  rules: fixture.rules,
  size: fixture.size,
  moves: opening.coordinates.map((point) => centerRelativeToBoard(point, fixture.size)),
}));

export { gomocup2026 };
