import { gomocup2026 } from '../opening-book/catalog';
import { centerRelativeToBoard, normalizeOpeningSource } from '../opening-book/source';

export { centerRelativeToBoard };

export const loadOpeningSet = (fixture = gomocup2026) => {
  const source = normalizeOpeningSource(fixture);
  return source.lines.map((line) => ({
    ...line,
    source: source.source,
    rules: source.rules,
    size: source.size,
  }));
};

export { gomocup2026 };
