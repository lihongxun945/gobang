import { FIVE } from './eval';

const NEUTRAL = 150;

const median = (values) => {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)] || 0;
};

const direction = (score) => score >= NEUTRAL ? 1 : score <= -NEUTRAL ? -1 : 0;

const advantageLabel = (score) => {
  const absolute = Math.abs(score);
  const side = score > 0 ? 'AI' : '玩家';
  if (absolute < NEUTRAL) return { label: '局面接近', tone: 'even' };
  if (absolute < 800) return { label: `${side}稍优`, tone: score > 0 ? 'positive' : 'negative' };
  if (absolute < 3000) return { label: `${side}明显优势`, tone: score > 0 ? 'positive' : 'negative' };
  return { label: `${side}大幅领先`, tone: score > 0 ? 'positive' : 'negative' };
};

export const assessScore = (score, trace = []) => {
  if (score >= FIVE) return {
    label: 'AI 已找到必胜', detail: '搜索已证明强制胜利', tone: 'winning', confidence: 'proven',
  };
  if (score <= -FIVE) return {
    label: 'AI 已找到必败', detail: '搜索已证明无法避免失败', tone: 'losing', confidence: 'proven',
  };
  if (!trace.length) return {
    label: '开局阶段', detail: '当前着法来自开局库，尚无完整搜索评分', tone: 'even', confidence: 'low',
  };

  const recent = trace.slice(-3).map(({ score: traceScore }) => traceScore);
  const directions = recent.map(direction).filter(Boolean);
  const directionStable = new Set(directions).size <= 1;
  const smoothedScore = median(recent);
  const spread = Math.max(...recent) - Math.min(...recent);
  const scale = Math.max(300, Math.abs(smoothedScore));
  const volatility = spread / scale;

  if (!directionStable) return {
    label: '局面复杂', detail: '不同搜索深度对优势方向判断不一致', tone: 'uncertain',
    confidence: 'low', score: smoothedScore, spread,
  };

  const confidence = recent.length >= 3 && volatility <= 0.5
    ? 'high' : recent.length >= 2 && volatility <= 1.2 ? 'medium' : 'low';
  const { label, tone } = advantageLabel(smoothedScore);
  const confidenceText = { high: '高置信度', medium: '中等置信度', low: '低置信度' }[confidence];
  return {
    label, tone, confidence, score: smoothedScore, spread,
    detail: `${confidenceText} · 已完成 ${trace[trace.length - 1].depth} 层搜索`,
  };
};
