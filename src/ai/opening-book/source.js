export const centerRelativeToBoard = ([x, y], size) => {
  const center = Math.floor(size / 2);
  return [center - y, center + x];
};

const coordinateConverters = {
  'center-relative-x-y': centerRelativeToBoard,
  'board-row-column': (point) => point,
};

export const normalizeOpeningSource = (source) => {
  const convert = coordinateConverters[source.coordinateSystem];
  if (!convert) throw new Error(`Unsupported opening coordinate system: ${source.coordinateSystem}`);
  return {
    id: source.id || source.name,
    name: source.name,
    source: source.source,
    retrieved: source.retrieved,
    rules: source.rules,
    size: source.size,
    firstRole: source.firstRole || 1,
    minPrefixLength: source.minPrefixLength || 1,
    lines: source.openings.map((opening) => ({
      ...opening,
      moves: opening.coordinates.map((point) => convert(point, source.size)),
    })),
  };
};
