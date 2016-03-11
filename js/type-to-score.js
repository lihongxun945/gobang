var T = require("./score.js");

/*
 * 只做一件事，就是修复冲四:
 * 如果是单独一个冲四，则将分数将至和活三一样
 * 如果是冲四活三或者双冲四，则分数和活四一样
 */
var s = function(type) {
  if(type < T.FOUR && type >= T.BLOCKED_FOUR) {

    if(type >= T.BLOCKED_FOUR && type < (T.BLOCKED_FOUR + T.THREE)) {
      //单独冲四，意义不大
      return T.THREE;
    } else if(type >= T.BLOCKED_FOUR + T.THREE && type < T.BLOCKED_FOUR * 2) {
      return T.BLOCKED_FOUR;  //冲四活三，比双三分高，但是比活四分低，所以当做冲四处理
    } else {
      //双冲四 等同于活四
      return T.FOUR;
    }
  }
  return type;
}

module.exports = s;
