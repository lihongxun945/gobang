var T = require("./score.js");

/*
 * 只做一件事，就是修复冲四:
 * 如果是单独一个冲四，则将分数将至和活三一样
 * 如果是冲四活三或者双冲四，则分数和活四一样
 */
var s = function(type) {
  if(type < T.FOUR && type >= T.BLOCKED_FOUR) {

    if(type >= T.BLOCKED_FOUR && type < (T.BLOCKED_FOUR + T.THREE)) {
      return T.THREE;
    } else {
      return T.FOUR;
    }
  }
  return type;
}

module.exports = s;
