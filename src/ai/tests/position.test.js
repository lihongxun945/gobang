import { isLine } from '../position';

describe('position helpers', () => {
  test('horizontal distance uses both column coordinates', () => {
    const size = 15;
    expect(isLine(7 * size + 3, 7 * size + 6, size)).toBe(true);
    expect(isLine(7 * size + 3, 7 * size + 10, size)).toBe(false);
  });
});
