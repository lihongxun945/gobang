import { FIVE } from '../eval';
import { assessScore } from '../scoreAssessment';

describe('score assessment', () => {
  test('reports only proven terminal scores as forced results', () => {
    expect(assessScore(FIVE, []).confidence).toBe('proven');
    expect(assessScore(-FIVE, []).label).toContain('必败');
    expect(assessScore(5000, [{ depth: 6, score: 5000 }]).confidence).not.toBe('proven');
  });

  test('uses the median of recent completed depths', () => {
    const result = assessScore(900, [
      { depth: 2, score: 700 }, { depth: 4, score: 900 }, { depth: 6, score: 1100 },
    ]);
    expect(result.score).toBe(900);
    expect(result.label).toBe('AI明显优势');
    expect(result.confidence).toBe('high');
  });

  test('marks conflicting depth directions as uncertain', () => {
    const result = assessScore(-600, [
      { depth: 2, score: 500 }, { depth: 4, score: -600 }, { depth: 6, score: -450 },
    ]);
    expect(result.label).toBe('局面复杂');
    expect(result.confidence).toBe('low');
  });

  test('empty trace is only labelled as opening book when explicitly flagged', () => {
    // 未命中开局库、也没有深度搜索轨迹（例如中盘反威胁防守/超时）时，
    // 不得再误标为“开局阶段 / 来自开局库”。
    const tactical = assessScore(500, [], false);
    expect(tactical.label).not.toBe('开局阶段');
    expect(tactical.detail).toContain('未完成深度搜索');

    // 只有显式传入 fromOpeningBook=true 才显示“开局阶段”。
    const opening = assessScore(500, [], true);
    expect(opening.label).toBe('开局阶段');
    expect(opening.detail).toContain('开局库');
  });
});
