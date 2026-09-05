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
});
