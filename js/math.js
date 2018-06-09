var S = require('./score.js');
var threshold = 1.15;

var equal = function(a, b) {
  b = b || 0.01
  return b >= 0 ? ((a >= b / threshold) && (a <= b * threshold))
          : ((a >= b * threshold) && (a <= b / threshold))
}
var greatThan = function(a, b) {
  return b >= 0 ? (a >= (b+0.1) * threshold) : (a >= (b+0.1) / threshold); // 注意处理b为0的情况，通过加一个0.1 做简单的处理
}
var greatOrEqualThan = function(a, b) {
  return equal(a, b) || greatThan(a, b);
}
var littleThan = function(a, b) {
  return b >= 0 ? (a <= (b-0.1) / threshold) : (a <= (b-0.1) * threshold);
}
var littleOrEqualThan = function(a, b) {
  return equal(a, b) || littleThan(a, b);
}

var containPoint = function (arrays, p) {
  for (var i=0;i<arrays.length;i++) {
    var a = arrays[i];
    if (a[0] === p[0] && a[1] === p[1]) return true
  }
  return false
}

var pointEqual = function (a, b) {
  return a[0] === b[0] && a[1] === b[1]
}

var round = function (score) {
  var neg = score < 0 ? -1 : 1;
  var abs = Math.abs(score);
  if (abs <= S.ONE / 2) return 0;
  if (abs <= S.TWO / 2 && abs > S.ONE / 2) return neg * S.ONE;
  if (abs <= S.THREE / 2 && abs > S.TWO / 2) return neg * S.TWO;
  if (abs <= S.THREE * 1.5 && abs > S.THREE / 2) return neg * S.THREE;
  if (abs <= S.FOUR / 2 && abs > S.THREE * 1.5) return neg * S.THREE*2;
  if (abs <= S.FIVE / 2 && abs > S.FOUR / 2) return neg * S.FOUR;
  return neg * S.FIVE;
}

module.exports = {
  equal: equal,
  greatThan: greatThan,
  greatOrEqualThan: greatOrEqualThan,
  littleThan: littleThan,
  littleOrEqualThan: littleOrEqualThan,
  containPoint: containPoint,
  pointEqual: pointEqual,
  round: round
}
