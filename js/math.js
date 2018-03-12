var threshold = 1.2;

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

module.exports = {
  equal: equal,
  greatThan: greatThan,
  greatOrEqualThan: greatOrEqualThan,
  littleThan: littleThan,
  littleOrEqualThan: littleOrEqualThan
}
