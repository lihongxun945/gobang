import { serializeGame, deserializeGame } from '../gameSerialization';

const sample = {
  size: 15,
  aiFirst: true,
  depth: 6,
  openingBook: true,
  history: [
    { i: 7, j: 7, role: 1 },
    { i: 7, j: 8, role: -1 },
    { i: 8, j: 8, role: 1 },
  ],
};

describe('game serialization', () => {
  test('round-trips a valid game', () => {
    const text = serializeGame(sample);
    const result = deserializeGame(text, 15);
    expect(result.ok).toBe(true);
    expect(result.data).toEqual(sample);
  });

  test('ignores extra fields in history when serializing', () => {
    const text = serializeGame({
      ...sample,
      history: sample.history.map((move) => ({ ...move, previousRole: 1, extra: true })),
    });
    const result = deserializeGame(text, 15);
    expect(result.ok).toBe(true);
    expect(result.data.history).toEqual(sample.history);
  });

  test('rejects empty or non-string input', () => {
    expect(deserializeGame('', 15).ok).toBe(false);
    expect(deserializeGame('   ', 15).ok).toBe(false);
    expect(deserializeGame(123, 15).ok).toBe(false);
  });

  test('rejects malformed JSON', () => {
    expect(deserializeGame('{not json', 15).ok).toBe(false);
  });

  test('rejects wrong format marker', () => {
    const result = deserializeGame(JSON.stringify({ format: 'other', version: 1, size: 15, aiFirst: true, openingBook: true, depth: 6, history: [] }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('格式标识');
  });

  test('rejects unsupported version', () => {
    const result = deserializeGame(JSON.stringify({ format: 'gobang-game', version: 999, size: 15, aiFirst: true, openingBook: true, depth: 6, history: [] }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('版本');
  });

  test('rejects mismatched board size', () => {
    const result = deserializeGame(serializeGame({ ...sample, size: 19 }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('尺寸');
  });

  test('rejects out-of-bounds coordinates', () => {
    const result = deserializeGame(serializeGame({ ...sample, history: [{ i: 15, j: 0, role: 1 }] }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('越界');
  });

  test('rejects illegal roles', () => {
    const result = deserializeGame(serializeGame({ ...sample, history: [{ i: 0, j: 0, role: 2 }] }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('角色');
  });

  test('rejects non-alternating or non-black-first order', () => {
    const whiteFirst = deserializeGame(serializeGame({ ...sample, history: [{ i: 0, j: 0, role: -1 }] }), 15);
    expect(whiteFirst.ok).toBe(false);
    expect(whiteFirst.error).toContain('黑白交替');

    const doubleBlack = deserializeGame(serializeGame({
      ...sample,
      history: [{ i: 0, j: 0, role: 1 }, { i: 1, j: 1, role: 1 }],
    }), 15);
    expect(doubleBlack.ok).toBe(false);
    expect(doubleBlack.error).toContain('黑白交替');
  });

  test('rejects duplicate positions', () => {
    const result = deserializeGame(serializeGame({
      ...sample,
      history: [
        { i: 3, j: 3, role: 1 },
        { i: 4, j: 4, role: -1 },
        { i: 3, j: 3, role: 1 },
      ],
    }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('重复');
  });

  test('rejects moves after a win', () => {
    // 黑横向五连：row 0, cols 0-4
    const history = [
      { i: 0, j: 0, role: 1 },
      { i: 7, j: 7, role: -1 },
      { i: 0, j: 1, role: 1 },
      { i: 7, j: 8, role: -1 },
      { i: 0, j: 2, role: 1 },
      { i: 7, j: 9, role: -1 },
      { i: 0, j: 3, role: 1 },
      { i: 7, j: 10, role: -1 },
      { i: 0, j: 4, role: 1 }, // 黑五连成
      { i: 7, j: 11, role: -1 }, // 其后落子
    ];
    const result = deserializeGame(serializeGame({ ...sample, history }), 15);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('胜负');
  });

  test('accepts a completed win with no trailing moves', () => {
    const history = [
      { i: 0, j: 0, role: 1 },
      { i: 7, j: 7, role: -1 },
      { i: 0, j: 1, role: 1 },
      { i: 7, j: 8, role: -1 },
      { i: 0, j: 2, role: 1 },
      { i: 7, j: 9, role: -1 },
      { i: 0, j: 3, role: 1 },
      { i: 7, j: 10, role: -1 },
      { i: 0, j: 4, role: 1 },
    ];
    const result = deserializeGame(serializeGame({ ...sample, history }), 15);
    expect(result.ok).toBe(true);
  });

  test('accepts an empty history', () => {
    const result = deserializeGame(serializeGame({ ...sample, history: [] }), 15);
    expect(result.ok).toBe(true);
    expect(result.data.history).toEqual([]);
  });
});
